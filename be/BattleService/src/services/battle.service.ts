import { BattleRoomRepository } from "../repositories/battle-room.repository";
import {
  BattleDifficulty,
  BattleResult,
  IBattleRoom,
  IBattlePlayer,
  SubmissionVerdict,
} from "../models/battle-room.model";
import { redis } from "../config/redis.config";
import logger from "../config/logger.config";
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";
import { getProblemsByDifficulty } from "../apis/problem.api";
import { getUserBattleProfile, getUserElo, updateUserElo } from "../apis/user.api";

const RANKED_QUEUE_KEY = "battle:ranked:queue";
const DEFAULT_TIMER_SECONDS: Record<BattleDifficulty, number> = {
  easy: 20 * 60,
  medium: 40 * 60,
  hard: 60 * 60,
};
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class BattleService {
  private roomRepository: BattleRoomRepository;

  constructor(roomRepository: BattleRoomRepository) {
    this.roomRepository = roomRepository;
  }

  private resolveDifficulty(elo: number): BattleDifficulty {
    if (elo < 1000) return "easy";
    if (elo <= 1400) return "medium";
    return "hard";
  }

  private resolveTimerSeconds(
    difficulty: BattleDifficulty,
    timerMinutes?: number,
  ): number {
    if (timerMinutes) {
      return Math.max(5, timerMinutes) * 60;
    }
    return DEFAULT_TIMER_SECONDS[difficulty];
  }

  private async pickRandomBattleProblem(difficulty: BattleDifficulty) {
    const problems = await getProblemsByDifficulty(difficulty);
    const battleProblems = problems.filter((problem) => problem.isForBattle);
    if (battleProblems.length === 0) {
      throw new NotFoundError(
        `No battle problems found for difficulty ${difficulty}`,
      );
    }
    const randomIndex = Math.floor(Math.random() * battleProblems.length);
    const problem = battleProblems[randomIndex];
    return {
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
    };
  }

  private getActivePlayers(room: IBattleRoom) {
    return room.players.filter((player) => !player.hasLeft);
  }

  private async assertUserCanEnterRoom(userId: string, allowedRoomId?: string) {
    const openRoom = await this.roomRepository.findOpenRoomByUserId(userId);
    if (openRoom && openRoom.id !== allowedRoomId) {
      throw new BadRequestError("You are already in another active battle room");
    }
  }

  private async generateRoomCode() {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      let code = "";
      for (let index = 0; index < 6; index += 1) {
        code += ROOM_CODE_ALPHABET[
          Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)
        ];
      }

      const existingRoom = await this.roomRepository.findByRoomCode(code);
      if (!existingRoom) return code;
    }

    throw new BadRequestError("Could not generate room code");
  }

  async enqueueRanked(userId: string) {
    await this.assertUserCanEnterRoom(userId);
    const eloRating = await getUserElo(userId);
    await redis.zadd(RANKED_QUEUE_KEY, eloRating, userId);
    return { userId, eloRating };
  }

  async dequeueRanked(userId: string) {
    await redis.zrem(RANKED_QUEUE_KEY, userId);
  }

  async isRankedQueued(userId: string) {
    const score = await redis.zscore(RANKED_QUEUE_KEY, userId);
    return score !== null;
  }

  async getCurrentState(userId: string) {
    const room = await this.roomRepository.findOpenRoomByUserId(userId);
    const isQueued = await this.isRankedQueued(userId);
    return { room, isQueued };
  }

  async tryMatchRanked(): Promise<IBattleRoom | null> {
    const queuedEntries = await redis.zrange(
      RANKED_QUEUE_KEY,
      0,
      -1,
      "WITHSCORES",
    );
    if (queuedEntries.length < 4) {
      return null;
    }

    const queuedProfiles = [];
    for (let index = 0; index < queuedEntries.length; index += 2) {
      queuedProfiles.push({
        userId: queuedEntries[index],
        eloRating: Number(queuedEntries[index + 1]),
      });
    }

    let profiles:
      | Array<{
          userId: string;
          eloRating: number;
        }>
      | null = null;

    for (let index = 0; index < queuedProfiles.length - 1; index += 1) {
      const first = queuedProfiles[index];
      const second = queuedProfiles[index + 1];
      if (
        this.resolveDifficulty(first.eloRating) ===
        this.resolveDifficulty(second.eloRating)
      ) {
        profiles = [first, second];
        break;
      }
    }

    if (!profiles) {
      logger.info("No ranked match in same ELO range", {
        queuedCount: queuedProfiles.length,
      });
      return null;
    }

    const queuedUsers = profiles.map((profile) => profile.userId);
    await redis.zrem(RANKED_QUEUE_KEY, ...queuedUsers);

    const averageElo =
      profiles.reduce((sum, profile) => sum + profile.eloRating, 0) /
      profiles.length;
    const difficulty = this.resolveDifficulty(averageElo);
    const timerSeconds = this.resolveTimerSeconds(difficulty);
    const problem = await this.pickRandomBattleProblem(difficulty);

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + timerSeconds * 1000);

    const players: IBattlePlayer[] = await Promise.all(
      queuedUsers.map(async (userId, index) => {
        const profile = await getUserBattleProfile(userId);
        return {
          userId,
          username: profile.username,
          joinedAt: startedAt,
          eloBefore: profiles[index].eloRating,
        };
      }),
    );

    const room = await this.roomRepository.createRoom({
      mode: "RANKED",
      status: "ACTIVE",
      difficulty,
      timerSeconds,
      problem,
      players,
      startedAt,
      endsAt,
      winnerUserId: null,
    });

    logger.info("Ranked room created", { roomId: room.id });
    return room;
  }

  async createPrivateRoom(
    userId: string,
    payload: { difficulty: BattleDifficulty; timerMinutes?: number },
  ) {
    await this.assertUserCanEnterRoom(userId);
    await this.dequeueRanked(userId);

    const timerSeconds = this.resolveTimerSeconds(
      payload.difficulty,
      payload.timerMinutes,
    );

    const ownerProfile = await getUserBattleProfile(userId);

    const room = await this.roomRepository.createRoom({
      mode: "PRIVATE",
      status: "WAITING",
      difficulty: payload.difficulty,
      timerSeconds,
      roomCode: await this.generateRoomCode(),
      ownerId: userId,
      players: [
        {
          userId,
          username: ownerProfile.username,
          eloBefore: ownerProfile.eloRating,
          joinedAt: new Date(),
        },
      ],
    });

    return room;
  }

  async joinPrivateRoom(userId: string, roomId: string) {
    const room = await this.roomRepository.findByIdOrCode(roomId);
    if (!room) {
      throw new NotFoundError("Battle room not found");
    }

    if (room.mode !== "PRIVATE") {
      throw new BadRequestError("Room is not a private battle");
    }

    const existingPlayer = room.players.find((player) => player.userId === userId);
    if (existingPlayer && !existingPlayer.hasLeft) {
      return room;
    }

    if (room.status !== "WAITING" && room.status !== "READY") {
      throw new BadRequestError("Room is not joinable");
    }

    await this.assertUserCanEnterRoom(userId, room.id);
    await this.dequeueRanked(userId);

    if (this.getActivePlayers(room).length >= 2) {
      throw new BadRequestError("Room is already full");
    }

    if (existingPlayer) {
      const profile = await getUserBattleProfile(userId);
      existingPlayer.username = profile.username;
      existingPlayer.eloBefore = profile.eloRating;
      existingPlayer.hasLeft = false;
      existingPlayer.leftAt = undefined;
      existingPlayer.joinedAt = new Date();
    } else {
      const profile = await getUserBattleProfile(userId);
      room.players.push({
        userId,
        username: profile.username,
        eloBefore: profile.eloRating,
        joinedAt: new Date(),
      });
    }

    if (this.getActivePlayers(room).length === 2) {
      room.status = "READY";
    }

    await room.save();
    return room;
  }

  async startPrivateRoom(userId: string, roomId: string) {
    const room = await this.roomRepository.findByIdOrCode(roomId);
    if (!room) {
      throw new NotFoundError("Battle room not found");
    }

    if (room.mode !== "PRIVATE") {
      throw new BadRequestError("Room is not a private battle");
    }

    if (room.ownerId !== userId) {
      throw new BadRequestError("Only room owner can start the battle");
    }

    const activePlayers = this.getActivePlayers(room);
    if (activePlayers.length < 2) {
      throw new BadRequestError("Need 2 players to start the battle");
    }

    if (room.status === "ACTIVE") {
      return room;
    }

    const problem = await this.pickRandomBattleProblem(room.difficulty);
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + room.timerSeconds * 1000);

    room.problem = problem;
    room.status = "ACTIVE";
    room.players = activePlayers;
    room.startedAt = startedAt;
    room.endsAt = endsAt;

    await room.save();
    return room;
  }

  async cancelPrivateRoom(userId: string, roomId: string) {
    const room = await this.roomRepository.findByIdOrCode(roomId);
    if (!room) {
      throw new NotFoundError("Battle room not found");
    }

    if (room.mode !== "PRIVATE") {
      throw new BadRequestError("Room is not a private battle");
    }

    if (room.ownerId !== userId) {
      throw new BadRequestError("Only room owner can cancel the battle");
    }

    if (room.status === "ACTIVE") {
      throw new BadRequestError("Active battle cannot be canceled from lobby");
    }

    if (room.status === "FINISHED" || room.status === "CANCELED") {
      return room;
    }

    room.status = "CANCELED";
    room.endedAt = new Date();
    room.players = room.players.map((player) => ({
      ...player,
      hasLeft: true,
      leftAt: player.leftAt ?? new Date(),
    }));

    await room.save();
    return room;
  }

  async leavePrivateRoom(userId: string, roomId: string) {
    const room = await this.roomRepository.findByIdOrCode(roomId);
    if (!room) {
      throw new NotFoundError("Battle room not found");
    }

    if (room.mode !== "PRIVATE") {
      throw new BadRequestError("Room is not a private battle");
    }

    if (room.status === "ACTIVE") {
      return this.markPlayerLeft(roomId, userId);
    }

    if (room.status === "FINISHED" || room.status === "CANCELED") {
      return { room, shouldFinalize: false };
    }

    if (room.ownerId === userId) {
      const canceledRoom = await this.cancelPrivateRoom(userId, roomId);
      return { room: canceledRoom, shouldFinalize: false };
    }

    const player = room.players.find((item) => item.userId === userId);
    if (!player || player.hasLeft) {
      throw new BadRequestError("Player not found in room");
    }

    player.hasLeft = true;
    player.leftAt = new Date();
    room.status = "WAITING";

    await room.save();
    return { room, shouldFinalize: false };
  }

  async getRoomById(roomId: string) {
    const room = await this.roomRepository.findByIdOrCode(roomId);
    if (!room) {
      throw new NotFoundError("Battle room not found");
    }
    return room;
  }

  async getHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const rooms = await this.roomRepository.findHistoryByUserId(
      userId,
      skip,
      limit,
    );
    return rooms;
  }

  async recordSubmission(
    roomId: string,
    userId: string,
    submissionId: string,
    submittedAt: Date,
  ) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError("Battle room not found");
    }

    const player = room.players.find((item) => item.userId === userId);
    if (!player) {
      throw new BadRequestError("Player not found in room");
    }

    player.lastSubmissionId = submissionId;
    player.lastSubmittedAt = submittedAt;

    await room.save();
    return room;
  }

  async recordVerdict(
    roomId: string,
    userId: string,
    verdict: SubmissionVerdict | null,
    runtimeMs?: number,
    submissionId?: string,
  ) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError("Battle room not found");
    }

    const player = room.players.find((item) => item.userId === userId);
    if (!player) {
      throw new BadRequestError("Player not found in room");
    }

    if (submissionId) {
      player.lastSubmissionId = submissionId;
    }

    if (verdict) {
      player.lastVerdict = verdict;
    }

    if (verdict === "AC" && typeof runtimeMs === "number") {
      if (
        typeof player.bestRuntimeMs !== "number" ||
        runtimeMs < player.bestRuntimeMs
      ) {
        player.bestRuntimeMs = runtimeMs;
      }
    }

    await room.save();
    return room;
  }

  async markPlayerLeft(roomId: string, userId: string) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError("Battle room not found");
    }

    if (room.status === "FINISHED" || room.status === "CANCELED") {
      return { room, shouldFinalize: false };
    }

    const player = room.players.find((item) => item.userId === userId);
    if (!player) {
      throw new BadRequestError("Player not found in room");
    }

    player.hasLeft = true;
    player.leftAt = new Date();

    await room.save();

    const shouldFinalize =
      room.players.length > 0 && room.players.every((item) => item.hasLeft);

    return { room, shouldFinalize };
  }

  async finalizeRoom(roomId: string, forcedWinnerUserId?: string | null) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError("Battle room not found");
    }

    if (room.status === "FINISHED") {
      return room;
    }

    if (room.players.length < 2) {
      room.status = "CANCELED";
      await room.save();
      return room;
    }

    const [playerA, playerB] = room.players;

    const aRuntime = playerA.bestRuntimeMs;
    const bRuntime = playerB.bestRuntimeMs;

    let winnerUserId: string | null = forcedWinnerUserId || null;

    if (!winnerUserId) {
      const aHasAC = typeof aRuntime === "number";
      const bHasAC = typeof bRuntime === "number";
      const aForfeited = playerA.hasLeft && !aHasAC;
      const bForfeited = playerB.hasLeft && !bHasAC;

      if (aForfeited && bForfeited) {
        winnerUserId = null;
      } else if (aForfeited) {
        winnerUserId = bHasAC ? playerB.userId : null;
      } else if (bForfeited) {
        winnerUserId = aHasAC ? playerA.userId : null;
      } else if (aHasAC && bHasAC) {
        if (aRuntime < bRuntime) winnerUserId = playerA.userId;
        else if (bRuntime < aRuntime) winnerUserId = playerB.userId;
        else winnerUserId = null;
      } else if (aHasAC) {
        winnerUserId = playerA.userId;
      } else if (bHasAC) {
        winnerUserId = playerB.userId;
      } else {
        winnerUserId = null;
      }
    }

    const results: Record<string, BattleResult> = {
      [playerA.userId]: winnerUserId
        ? winnerUserId === playerA.userId
          ? "WIN"
          : "LOSS"
        : "DRAW",
      [playerB.userId]: winnerUserId
        ? winnerUserId === playerB.userId
          ? "WIN"
          : "LOSS"
        : "DRAW",
    };

    room.winnerUserId = winnerUserId;
    room.endedAt = new Date();
    room.status = "FINISHED";
    room.players = room.players.map((player) => ({
      ...player,
      result: results[player.userId],
    }));

    if (room.mode === "RANKED") {
      await this.applyElo(room, results);
    }

    await room.save();
    return room;
  }

  private async applyElo(
    room: IBattleRoom,
    results: Record<string, BattleResult>,
  ) {
    const [playerA, playerB] = room.players;
    const eloA = await getUserElo(playerA.userId);
    const eloB = await getUserElo(playerB.userId);

    const resultA = results[playerA.userId];
    const resultB = results[playerB.userId];

    let deltaA = 0;
    let deltaB = 0;

    if (resultA === "WIN") {
      deltaA = 30;
      deltaB = -25;
    } else if (resultB === "WIN") {
      deltaB = 30;
      deltaA = -25;
    }

    const nextEloA = await updateUserElo(playerA.userId, deltaA);
    const nextEloB = await updateUserElo(playerB.userId, deltaB);

    room.players = room.players.map((player) => {
      if (player.userId === playerA.userId) {
        return {
          ...player,
          eloBefore: eloA,
          eloAfter: nextEloA,
          eloDelta: deltaA,
        };
      }
      return {
        ...player,
        eloBefore: eloB,
        eloAfter: nextEloB,
        eloDelta: deltaB,
      };
    });
  }
}
