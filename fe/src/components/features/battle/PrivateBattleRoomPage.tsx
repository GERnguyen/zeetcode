import {
  CheckCircle2,
  Copy,
  Crown,
  Loader2,
  LogOut,
  ShieldAlert,
  Swords,
  Timer,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { BATTLE_SOCKET_URL } from "../../../lib/api/config";
import { useAuthStore } from "../../../stores/authStore";
import type { BattlePlayer, BattleRoom } from "../../../types/domain";
import { Button } from "../../ui/Button";
import { Panel } from "../../ui/Panel";

function activePlayers(players: BattlePlayer[]) {
  return players.filter((player) => !player.hasLeft);
}

function playerDisplayName(player: BattlePlayer, currentUsername?: string) {
  if (player.username) return player.username;
  if (currentUsername && player.userId) return currentUsername;
  return player.userId.slice(0, 8);
}

export function PrivateBattleRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [statusText, setStatusText] = useState("Opening private room...");
  const [errorText, setErrorText] = useState("");
  const [copied, setCopied] = useState(false);

  const players = useMemo(() => activePlayers(room?.players ?? []), [room]);
  const isOwner = Boolean(room?.ownerId && room.ownerId === user?.id);
  const isReady = room?.status === "READY" && players.length === 2;
  const isClosed = room?.status === "CANCELED" || room?.status === "FINISHED";
  const displayRoomId = room?.roomCode ?? roomId ?? "";

  const getRoomStatusText = (nextRoom: BattleRoom) => {
    if (nextRoom.status === "ACTIVE") return "Match started.";
    if (nextRoom.status === "READY") {
      return nextRoom.ownerId === user?.id
        ? "Opponent joined. Ready to start."
        : "Joined room. Waiting for owner to start.";
    }
    return nextRoom.ownerId === user?.id
      ? "Waiting for opponent..."
      : "Joined room. Waiting for owner.";
  };

  const rememberLocalExit = () => {
    if (!displayRoomId) return;
    sessionStorage.setItem(
      "battle:local-exit-room",
      JSON.stringify({
        roomId: room?.id,
        roomCode: room?.roomCode ?? roomId,
        until: Date.now() + 2500,
      }),
    );
  };

  useEffect(() => {
    if (!roomId || !accessToken) return;

    const socket = io(BATTLE_SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    const syncRoom = (nextRoom: BattleRoom) => {
      setRoom(nextRoom);
      setErrorText("");
      setStatusText(getRoomStatusText(nextRoom));
      if (nextRoom.status === "ACTIVE") {
        navigate(`/battle/room/${nextRoom.id}`);
      }
    };

    socket.on("connect", () => {
      setStatusText("Joining private room...");
      socket.emit("private:join", { roomId });
    });

    socket.on("battle:private-joined", syncRoom);
    socket.on("battle:room-joined", syncRoom);
    socket.on("battle:room-updated", syncRoom);
    socket.on("battle:room-started", syncRoom);
    socket.on("battle:private-left", () => {
      navigate("/battle");
    });
    socket.on("battle:room-canceled", (nextRoom: BattleRoom) => {
      setRoom(nextRoom);
      setStatusText("Room canceled.");
      navigate("/battle");
    });
    socket.on("battle:error", (payload: { message?: string }) => {
      const message = payload.message ?? "Private room failed.";
      setErrorText(message);
      setStatusText("Could not enter this room.");
      if (
        message === "Room is not joinable" ||
        message === "Battle room not found" ||
        message === "Room is already full"
      ) {
        window.setTimeout(() => navigate("/battle"), 700);
      }
    });
    socket.on("connect_error", (error) => {
      setErrorText(error.message);
      setStatusText("Could not connect to battle server.");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, navigate, roomId, user?.id]);

  const copyRoomId = async () => {
    if (!displayRoomId) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(displayRoomId);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = displayRoomId;
        textArea.setAttribute("readonly", "true");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = displayRoomId;
      textArea.setAttribute("readonly", "true");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const startMatch = () => {
    if (!roomId || !isReady) return;
    socketRef.current?.emit("private:start", { roomId });
  };

  const cancelRoom = () => {
    if (!roomId) return;
    rememberLocalExit();
    const fallback = window.setTimeout(() => navigate("/battle"), 900);
    socketRef.current
      ?.timeout(800)
      .emit("private:cancel", { roomId }, () => {
        window.clearTimeout(fallback);
        navigate("/battle");
      });
  };

  const leaveRoom = () => {
    if (!roomId) return;
    rememberLocalExit();
    const fallback = window.setTimeout(() => navigate("/battle"), 900);
    socketRef.current
      ?.timeout(800)
      .emit("private:leave", { roomId }, () => {
        window.clearTimeout(fallback);
        navigate("/battle");
      });
  };

  return (
    <section className="private-lobby-page">
      <Panel className="private-lobby-card p-5">
        <div className="private-lobby-header">
          <div>
            <p className="kicker">Private room</p>
            <h2>{room?.status === "ACTIVE" ? "Battle is live" : "Ready room"}</h2>
          </div>
          <div className="private-lobby-status">
            {room ? <CheckCircle2 size={20} /> : <Loader2 className="animate-spin" size={20} />}
            <span>{statusText}</span>
          </div>
        </div>

        {errorText && (
          <div className="private-lobby-error">
            <ShieldAlert size={18} />
            <span>{errorText}</span>
          </div>
        )}

        <div className="private-lobby-grid">
          <div className="private-lobby-main">
            <div className="private-versus-row">
              {[0, 1].map((slot) => {
                const player = players[slot];
                const ownerSlot = player?.userId === room?.ownerId;
                return (
                  <div className={player ? "private-player-card filled" : "private-player-card"} key={slot}>
                    <div className="private-player-icon">
                      {player ? <UserRound size={26} /> : <Loader2 className="animate-spin" size={24} />}
                    </div>
                    <div>
                      <strong>
                        {player
                          ? playerDisplayName(
                              player,
                              player.userId === user?.id ? user?.username : undefined,
                            )
                          : "Waiting..."}
                      </strong>
                      <span>{ownerSlot ? "Room owner" : player ? "Challenger" : "Invite pending"}</span>
                    </div>
                    {ownerSlot && <Crown size={18} />}
                  </div>
                );
              })}
            </div>

            <div className="private-room-specs">
              <div>
                <Swords size={18} />
                <span>{room?.difficulty ?? "medium"}</span>
              </div>
              <div>
                <Timer size={18} />
                <span>{Math.round((room?.timerSeconds ?? 0) / 60) || "--"} min</span>
              </div>
              <div>
                <UsersRound size={18} />
                <span>{players.length}/2 players</span>
              </div>
            </div>
          </div>

          <div className="private-lobby-side">
            {isOwner && (
              <>
                <span>Room ID</span>
                <div className="private-invite-link">
                  <input readOnly value={displayRoomId} />
                  <button
                    className={copied ? "copied" : undefined}
                    disabled={!displayRoomId}
                    onClick={copyRoomId}
                    type="button"
                  >
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </>
            )}

            <Button
              className="private-start-button"
              disabled={!isOwner || !isReady || isClosed}
              onClick={startMatch}
              variant="primary"
            >
              <Swords size={20} />
              Start match
            </Button>

            {isOwner ? (
              <Button
                className="private-danger-button"
                disabled={!room || room.status === "ACTIVE" || isClosed}
                onClick={cancelRoom}
                variant="secondary"
              >
                <XCircle size={18} />
                Cancel room
              </Button>
            ) : (
              <Button
                className="private-danger-button"
                disabled={!room || room.status === "ACTIVE" || isClosed}
                onClick={leaveRoom}
                variant="secondary"
              >
                <LogOut size={18} />
                Leave room
              </Button>
            )}
          </div>
        </div>
      </Panel>
    </section>
  );
}
