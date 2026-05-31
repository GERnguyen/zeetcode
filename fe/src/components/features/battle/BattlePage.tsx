import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  Clock3,
  DoorOpen,
  Link2,
  Loader2,
  LockKeyhole,
  RadioTower,
  Swords,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import {
  createPrivateBattleRoom,
  getCurrentBattleState,
  getMyBattleHistory,
} from "../../../lib/api/battles";
import { BATTLE_SOCKET_URL } from "../../../lib/api/config";
import { getAxiosMessage } from "../../../lib/api/http";
import { useAuthStore } from "../../../stores/authStore";
import type { BattleResult, Difficulty } from "../../../types/domain";
import { Button } from "../../ui/Button";
import { Select } from "../../ui/Form";
import { Panel } from "../../ui/Panel";

type QueueState = "idle" | "connecting" | "queued" | "matched" | "error";

function resultClass(result?: BattleResult) {
  if (result === "WIN") return "battle-form-win";
  if (result === "DRAW") return "battle-form-draw";
  if (result === "LOSS") return "battle-form-loss";
  return "battle-form-empty";
}

function shouldSuppressRoomRedirect(roomId?: string, roomCode?: string) {
  const raw = sessionStorage.getItem("battle:local-exit-room");
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as {
      roomId?: string;
      roomCode?: string;
      until?: number;
    };
    if (!parsed.until || parsed.until < Date.now()) {
      sessionStorage.removeItem("battle:local-exit-room");
      return false;
    }
    return parsed.roomId === roomId || parsed.roomCode === roomCode;
  } catch {
    sessionStorage.removeItem("battle:local-exit-room");
    return false;
  }
}

export function BattlePage() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const [queueState, setQueueState] = useState<QueueState>("idle");
  const [queueMessage, setQueueMessage] = useState("Ready to enter ranked queue.");
  const [queueStartedAt, setQueueStartedAt] = useState<number | null>(null);
  const [queueElapsedSeconds, setQueueElapsedSeconds] = useState(0);
  const [matchedRoom, setMatchedRoom] = useState<{
    roomId: string;
    difficulty: Difficulty;
    timerSeconds: number;
    problem?: { title?: string };
  } | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [joinRoomId, setJoinRoomId] = useState("");

  const historyQuery = useQuery({
    queryKey: ["battleHistory"],
    queryFn: () => getMyBattleHistory(20),
  });
  const currentStateQuery = useQuery({
    queryKey: ["currentBattleState"],
    queryFn: getCurrentBattleState,
    refetchOnWindowFocus: true,
  });

  const history = historyQuery.data ?? [];
  const stats = useMemo(() => {
    const myRooms = history.filter((room) =>
      room.mode === "RANKED" &&
      room.players.some((player) => player.userId === user?.id),
    );
    const finished = myRooms.filter((room) => room.status === "FINISHED");
    const results = finished
      .map((room) => room.players.find((player) => player.userId === user?.id)?.result)
      .filter(Boolean) as BattleResult[];
    const wins = results.filter((result) => result === "WIN").length;
    const winRate = results.length ? Math.round((wins / results.length) * 100) : 0;

    return {
      played: results.length,
      winRate,
      recent: results.slice(0, 5),
    };
  }, [history, user?.id]);

  const createRoomMutation = useMutation({
    mutationFn: createPrivateBattleRoom,
    onSuccess: (room) => {
      navigate(`/battle/private/${room.roomCode ?? room.id}`);
    },
  });

  const connectRankedQueue = useCallback((shouldEnqueue: boolean) => {
    socketRef.current?.disconnect();

    const socket = io(BATTLE_SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (shouldEnqueue) {
        socket.emit("ranked:enqueue");
      }
    });

    socket.on("battle:ranked-queued", () => {
      setQueueState("queued");
      setQueueMessage("Searching for an opponent near your ELO...");
    });

    socket.on("battle:match-found", (payload) => {
      setQueueState("matched");
      setQueueMessage("Match found. Battle room is locked.");
      setQueueStartedAt(null);
      setQueueElapsedSeconds(0);
      setMatchedRoom(payload);
      navigate(`/battle/room/${payload.roomId}`);
    });

    socket.on("battle:error", (payload: { message?: string }) => {
      setQueueState("error");
      setQueueMessage(payload.message ?? "Battle queue failed.");
    });

    socket.on("connect_error", (error) => {
      setQueueState("error");
      setQueueMessage(error.message);
    });
  }, [accessToken, navigate]);

  useEffect(() => {
    const state = currentStateQuery.data;
    if (!state) return;

    if (state.room?.mode === "PRIVATE" && state.room.status === "ACTIVE") {
      navigate(`/battle/room/${state.room.id}`, { replace: true });
      return;
    }

    if (state.room?.mode === "PRIVATE") {
      if (shouldSuppressRoomRedirect(state.room.id, state.room.roomCode)) {
        return;
      }
      navigate(`/battle/private/${state.room.roomCode ?? state.room.id}`, {
        replace: true,
      });
      return;
    }

    if (state.room?.mode === "RANKED" && state.room.status === "ACTIVE") {
      setQueueState("matched");
      setQueueMessage("Match found. Battle room is locked.");
      setMatchedRoom({
        roomId: state.room.id,
        difficulty: state.room.difficulty,
        timerSeconds: state.room.timerSeconds,
        problem: state.room.problem,
      });
      navigate(`/battle/room/${state.room.id}`, { replace: true });
      return;
    }

    if (state.isQueued && queueState === "idle") {
      setQueueState("connecting");
      setQueueMessage("Restoring ranked queue...");
      setQueueStartedAt(Date.now());
      setQueueElapsedSeconds(0);
      connectRankedQueue(true);
    }
  }, [connectRankedQueue, currentStateQuery.data, navigate, queueState]);

  useEffect(() => {
    return () => {
      socketRef.current?.emit("ranked:dequeue");
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      !queueStartedAt ||
      (queueState !== "connecting" && queueState !== "queued")
    ) {
      return;
    }

    const updateElapsed = () => {
      setQueueElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - queueStartedAt) / 1000)),
      );
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [queueStartedAt, queueState]);

  const startMatchmaking = () => {
    setQueueState("connecting");
    setQueueMessage("Connecting to arena server...");
    setQueueStartedAt(Date.now());
    setQueueElapsedSeconds(0);
    setMatchedRoom(null);

    connectRankedQueue(true);
  };

  const cancelMatchmaking = () => {
    if (queueState === "matched") return;

    socketRef.current?.emit("ranked:dequeue");
    socketRef.current?.disconnect();
    socketRef.current = null;
    setMatchedRoom(null);
    setQueueStartedAt(null);
    setQueueElapsedSeconds(0);
    setQueueState("idle");
    setQueueMessage("Ready to enter ranked queue.");
  };

  const formattedQueueTime = `${String(Math.floor(queueElapsedSeconds / 60)).padStart(
    2,
    "0",
  )}:${String(queueElapsedSeconds % 60).padStart(2, "0")}`;

  const joinPrivateRoomById = () => {
    const nextRoomId = joinRoomId.trim();
    if (!nextRoomId) return;
    navigate(`/battle/private/${nextRoomId.toUpperCase()}`);
  };

  return (
    <section className="battle-page grid gap-5">
      <div className="battle-header">
        <div>
          <p className="kicker">Battle arena</p>
          <h2>Choose your fight</h2>
        </div>
        <div className="battle-header-mark">
          <Swords size={24} />
          Ranked and private duels
        </div>
      </div>

      <div className="battle-grid">
        <Panel className="battle-panel battle-online-panel p-5">
          <div className="battle-panel-heading">
            <RadioTower size={22} />
            <div>
              <h3>Online matchmaking</h3>
              <p>Queue into a ranked duel matched around your current rating.</p>
            </div>
          </div>

          <div className="battle-stats-card">
            <div>
              <span>ELO</span>
              <strong>{user?.eloRating ?? 300}</strong>
            </div>
            <div>
              <span>Played</span>
              <strong>{stats.played}</strong>
            </div>
            <div>
              <span>Win rate</span>
              <strong>{stats.winRate}%</strong>
            </div>
          </div>

          <div className="battle-form-row">
            <span>Last 5</span>
            <div className="battle-form-track">
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  className={resultClass(stats.recent[index])}
                  key={`${stats.recent[index] ?? "empty"}-${index}`}
                  title={stats.recent[index] ?? "No match"}
                />
              ))}
            </div>
          </div>

          <button
            className="matchmaking-button"
            disabled={queueState === "connecting" || queueState === "queued" || queueState === "matched"}
            onClick={startMatchmaking}
            type="button"
          >
            {queueState === "connecting" || queueState === "queued" ? (
              <Loader2 className="animate-spin" size={26} />
            ) : queueState === "matched" ? (
              <Trophy size={27} />
            ) : (
              <Zap size={28} />
            )}
            <span>
              {queueState === "queued" || queueState === "connecting"
                ? "Finding match"
                : queueState === "matched"
                  ? "Room locked"
                  : "Find ranked match"}
            </span>
          </button>

          <div className="battle-status-line">
            <Activity size={17} />
            <span>{queueMessage}</span>
          </div>

          {!matchedRoom && (queueState === "connecting" || queueState === "queued") && (
            <div className="queue-controls">
              <div className="queue-timer">
                <Clock3 size={16} />
                <span>{formattedQueueTime}</span>
              </div>
              <button
                aria-label="Cancel matchmaking"
                className="queue-cancel-button"
                onClick={cancelMatchmaking}
                type="button"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {matchedRoom && (
            <div className="battle-match-card battle-match-locked">
              <Trophy size={18} />
              <strong>{matchedRoom.problem?.title ?? "Battle problem"}</strong>
              <span>
                {matchedRoom.difficulty} · {Math.round(matchedRoom.timerSeconds / 60)} min
              </span>
            </div>
          )}
        </Panel>

        <Panel className="battle-panel battle-private-panel p-5">
          <div className="battle-panel-heading">
            <LockKeyhole size={22} />
            <div>
              <h3>Private room</h3>
              <p>Create a room or enter a room ID from your opponent.</p>
            </div>
          </div>

          <div className="battle-options">
            <label>
              Difficulty
              <Select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </label>
            <label>
              Timer
              <Select
                value={timerMinutes}
                onChange={(event) => setTimerMinutes(Number(event.target.value))}
              >
                <option value={10}>10 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </Select>
            </label>
          </div>

          <Button
            className="private-create-button"
            disabled={createRoomMutation.isPending}
            onClick={() => createRoomMutation.mutate({ difficulty, timerMinutes })}
            variant="primary"
          >
            {createRoomMutation.isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Link2 size={18} />
            )}
            Create room
          </Button>

          {createRoomMutation.error && (
            <p className="battle-note">
              {getAxiosMessage(createRoomMutation.error)}
            </p>
          )}

          <div className="private-join-panel">
            <label htmlFor="private-room-id">Join match by ID</label>
            <div className="private-join-row">
              <input
                id="private-room-id"
                onChange={(event) => setJoinRoomId(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") joinPrivateRoomById();
                }}
                placeholder="Paste room ID"
                value={joinRoomId}
              />
              <button
                disabled={!joinRoomId.trim()}
                onClick={joinPrivateRoomById}
                type="button"
              >
                <DoorOpen size={17} />
                Join
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
}
