import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { serverConfig } from "../config";
import logger from "../config/logger.config";
import { BattleService } from "../services/battle.service";
import { BattleDifficulty, IBattleRoom } from "../models/battle-room.model";
import { createSubmission, getSubmissionById } from "../apis/submission.api";

type AccessTokenPayload = JwtPayload & {
  userId?: string;
  role?: string;
  type?: string;
};

type SocketUserData = {
  userId: string;
  accessToken: string;
};

let io: Server | null = null;

const userSockets = new Map<string, Set<string>>();
const userCurrentRoom = new Map<string, string>();
const roomTimers = new Map<string, NodeJS.Timeout>();

const registerUserSocket = (userId: string, socketId: string) => {
  const existing = userSockets.get(userId) || new Set<string>();
  existing.add(socketId);
  userSockets.set(userId, existing);
};

const unregisterUserSocket = (userId: string, socketId: string) => {
  const existing = userSockets.get(userId);
  if (!existing) return;
  existing.delete(socketId);
  if (existing.size === 0) {
    userSockets.delete(userId);
  } else {
    userSockets.set(userId, existing);
  }
};

const joinUserSocketsToRoom = (userId: string, roomId: string) => {
  const sockets = userSockets.get(userId);
  if (!sockets || !io) return;
  sockets.forEach((socketId) => {
    const socket = io?.sockets.sockets.get(socketId);
    socket?.join(roomId);
  });
  userCurrentRoom.set(userId, roomId);
};

const emitToRoom = (roomId: string, event: string, payload: unknown) => {
  io?.to(roomId).emit(event, payload);
};

const emitToUser = (userId: string, event: string, payload: unknown) => {
  const sockets = userSockets.get(userId);
  if (!sockets || !io) return;
  sockets.forEach((socketId) => {
    io?.to(socketId).emit(event, payload);
  });
};

const emitToRoomExceptUser = (
  roomId: string,
  userId: string,
  event: string,
  payload: unknown,
) => {
  const sockets = Array.from(userSockets.get(userId) || []);
  if (sockets.length === 0) {
    emitToRoom(roomId, event, payload);
    return;
  }
  io?.to(roomId).except(sockets).emit(event, payload);
};

const stopRoomTimer = (roomId: string) => {
  const timer = roomTimers.get(roomId);
  if (timer) {
    clearInterval(timer);
    roomTimers.delete(roomId);
  }
};

const startRoomTimer = async (
  room: IBattleRoom,
  battleService: BattleService,
) => {
  if (!room.endsAt) return;
  stopRoomTimer(room.id);

  const endsAtMs = new Date(room.endsAt).getTime();

  const tick = async () => {
    const now = Date.now();
    const remainingMs = endsAtMs - now;
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

    emitToRoom(room.id, "battle:timer", {
      roomId: room.id,
      remainingSeconds,
      endsAt: room.endsAt,
      serverTime: new Date().toISOString(),
    });

    if (remainingMs <= 0) {
      stopRoomTimer(room.id);
      const finishedRoom = await battleService.finalizeRoom(room.id, null);
      emitToRoom(room.id, "battle:result", finishedRoom);
    }
  };

  await tick();
  const interval = setInterval(() => {
    tick().catch((error) => {
      logger.error("Timer tick failed", error);
    });
  }, 1000);

  roomTimers.set(room.id, interval);
};

const pollSubmissionVerdict = async (
  battleService: BattleService,
  roomId: string,
  userId: string,
  submissionId: string,
) => {
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    return;
  }

  if (submission.status !== "FINISHED" && submission.status !== "INTERNAL_ERROR") {
    setTimeout(() => {
      pollSubmissionVerdict(battleService, roomId, userId, submissionId).catch(
        (error) => logger.error("Polling submission failed", error),
      );
    }, 1000);
    return;
  }

  await battleService.recordVerdict(
    roomId,
    userId,
    submission.verdict,
    submission.judgeMeta?.runtimeMs,
    submissionId,
  );

  emitToRoomExceptUser(roomId, userId, "battle:opponent-verdict", {
    roomId,
    userId,
    verdict: submission.verdict,
    runtimeMs: submission.judgeMeta?.runtimeMs,
  });

  emitToUser(userId, "battle:verdict", {
    roomId,
    userId,
    verdict: submission.verdict,
    runtimeMs: submission.judgeMeta?.runtimeMs,
  });
};

export const notifyRankedMatch = async (
  room: IBattleRoom,
  battleService: BattleService,
) => {
  if (!io) return;

  room.players.forEach((player) => {
    joinUserSocketsToRoom(player.userId, room.id);
  });

  emitToRoom(room.id, "battle:match-found", {
    roomId: room.id,
    mode: room.mode,
    difficulty: room.difficulty,
    timerSeconds: room.timerSeconds,
    problem: room.problem,
  });

  await startRoomTimer(room, battleService);
};

export const initBattleSocket = (
  httpServer: HttpServer,
  battleService: BattleService,
) => {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization || "").replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    if (!serverConfig.JWT_ACCESS_SECRET) {
      return next(new Error("JWT access secret is not configured"));
    }

    try {
      const decoded = jwt.verify(
        token,
        serverConfig.JWT_ACCESS_SECRET,
      ) as AccessTokenPayload;

      if (!decoded.userId) {
        return next(new Error("Invalid authentication token"));
      }

      if (decoded.type && decoded.type !== "access") {
        return next(new Error("Access token required"));
      }

      socket.data.user = {
        userId: decoded.userId,
        accessToken: token,
      } as SocketUserData;

      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userData = socket.data.user as SocketUserData;
    registerUserSocket(userData.userId, socket.id);

    socket.on("ranked:enqueue", async () => {
      const profile = await battleService.enqueueRanked(userData.userId);
      socket.emit("battle:ranked-queued", {
        userId: userData.userId,
        eloRating: profile.eloRating,
      });
    });

    socket.on("ranked:dequeue", async () => {
      await battleService.dequeueRanked(userData.userId);
      socket.emit("battle:ranked-dequeued", { userId: userData.userId });
    });

    socket.on(
      "private:create",
      async (payload: { difficulty: string; timerMinutes?: number }) => {
        const room = await battleService.createPrivateRoom(userData.userId, {
          difficulty: payload.difficulty as BattleDifficulty,
          timerMinutes: payload.timerMinutes,
        });
        joinUserSocketsToRoom(userData.userId, room.id);
        socket.emit("battle:private-created", room);
      },
    );

    socket.on(
      "private:join",
      async (payload: { roomId: string; inviteCode: string }) => {
        const room = await battleService.joinPrivateRoom(
          userData.userId,
          payload.roomId,
          payload.inviteCode,
        );
        joinUserSocketsToRoom(userData.userId, room.id);
        emitToRoom(room.id, "battle:player-joined", {
          roomId: room.id,
          userId: userData.userId,
        });
        socket.emit("battle:private-joined", room);
      },
    );

    socket.on("private:start", async (payload: { roomId: string }) => {
      const room = await battleService.startPrivateRoom(
        userData.userId,
        payload.roomId,
      );
      emitToRoom(room.id, "battle:room-started", room);
      await startRoomTimer(room, battleService);
    });

    socket.on("room:join", async (payload: { roomId: string }) => {
      const room = await battleService.getRoomById(payload.roomId);
      const isMember = room.players.some(
        (player) => player.userId === userData.userId,
      );
      if (!isMember) {
        socket.emit("battle:error", { message: "Access denied" });
        return;
      }
      socket.join(room.id);
      userCurrentRoom.set(userData.userId, room.id);
      socket.emit("battle:room-joined", room);
    });

    socket.on(
      "room:submit",
      async (payload: { roomId: string; code: string; language: string }) => {
        const room = await battleService.getRoomById(payload.roomId);
        if (room.status !== "ACTIVE") {
          socket.emit("battle:error", { message: "Room is not active" });
          return;
        }

        if (room.endsAt && Date.now() > new Date(room.endsAt).getTime()) {
          socket.emit("battle:error", { message: "Battle time is over" });
          return;
        }

        if (!room.problem?.id) {
          socket.emit("battle:error", { message: "Problem is missing" });
          return;
        }

        const submission = await createSubmission(
          {
            problemId: room.problem.id,
            code: payload.code,
            language: payload.language,
          },
          userData.accessToken,
        );

        await battleService.recordSubmission(
          room.id,
          userData.userId,
          submission.id,
          new Date(),
        );

        emitToRoomExceptUser(room.id, userData.userId, "battle:opponent-submitted", {
          roomId: room.id,
          userId: userData.userId,
        });

        socket.emit("battle:submitted", {
          roomId: room.id,
          submissionId: submission.id,
        });

        pollSubmissionVerdict(
          battleService,
          room.id,
          userData.userId,
          submission.id,
        ).catch((error) => logger.error("Polling submission failed", error));
      },
    );

    socket.on("room:leave", async (payload: { roomId: string }) => {
      const result = await battleService.markPlayerLeft(
        payload.roomId,
        userData.userId,
      );

      if (result.shouldFinalize) {
        const finishedRoom = await battleService.finalizeRoom(payload.roomId);
        stopRoomTimer(payload.roomId);
        emitToRoom(payload.roomId, "battle:result", finishedRoom);
      } else {
        emitToRoomExceptUser(payload.roomId, userData.userId, "battle:opponent-left", {
          roomId: payload.roomId,
          userId: userData.userId,
        });
      }

      socket.leave(payload.roomId);
      userCurrentRoom.delete(userData.userId);
    });

    socket.on("disconnect", async () => {
      unregisterUserSocket(userData.userId, socket.id);
      if (userSockets.has(userData.userId)) return;

      const roomId = userCurrentRoom.get(userData.userId);
      if (!roomId) return;
      try {
        const result = await battleService.markPlayerLeft(
          roomId,
          userData.userId,
        );
        if (result.shouldFinalize) {
          const finishedRoom = await battleService.finalizeRoom(roomId);
          stopRoomTimer(roomId);
          emitToRoom(roomId, "battle:result", finishedRoom);
        } else {
          emitToRoomExceptUser(roomId, userData.userId, "battle:opponent-left", {
            roomId,
            userId: userData.userId,
          });
        }
      } catch (error) {
        logger.error("Failed to handle disconnect", error);
      } finally {
        userCurrentRoom.delete(userData.userId);
      }
    });
  });

  return io;
};
