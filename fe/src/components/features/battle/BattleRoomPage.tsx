import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, Clock3, FileText, History, LogOut, RadioTower, UserRound, X } from "lucide-react";
import { type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { useSubmissionPolling } from "../../../hooks/useSubmissionPolling";
import { getBattleRoom } from "../../../lib/api/battles";
import { BATTLE_SOCKET_URL } from "../../../lib/api/config";
import { getProblemDetail } from "../../../lib/api/problems";
import { getMyProblemSubmissions, runSampleTests } from "../../../lib/api/submissions";
import { getAxiosMessage } from "../../../lib/api/http";
import { cn } from "../../../lib/utils/cn";
import { useAuthStore } from "../../../stores/authStore";
import type { BattlePlayer, BattleRoom, Submission } from "../../../types/domain";
import { Button } from "../../ui/Button";
import { Panel } from "../../ui/Panel";
import { ProblemContent } from "../practice/ProblemContent";
import { ProblemEditor } from "../practice/ProblemEditor";
import { SubmissionHistory } from "../practice/SubmissionHistory";

const starterCodeByLanguage = {
  python: `def solve():
    # Read stdin and print the answer.
    pass

if __name__ == "__main__":
    solve()
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Read stdin and print the answer.
    return 0;
}
`,
};

type Tab = "description" | "submissions";
type ConsoleAction = "run" | "submit";
const minDescriptionWidth = 340;
const minEditorWidth = 520;
const resizeHandleWidth = 12;

function activePlayers(players: BattlePlayer[]) {
  return players.filter((player) => !player.hasLeft);
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function playerName(player?: BattlePlayer) {
  return player?.username ?? (player?.userId ? player.userId.slice(0, 8) : "Opponent");
}

function resultText(room: BattleRoom | null, userId?: string) {
  if (!room || room.status !== "FINISHED") return "";
  const me = room.players.find((player) => player.userId === userId);
  if (!me?.result) return "Match finished";
  if (me.result === "DRAW") return "Draw";
  return me.result === "WIN" ? "Victory" : "Defeat";
}

function resultTitle(room: BattleRoom | null, userId?: string) {
  if (!room || room.status !== "FINISHED") return "";
  const winner = room.players.find((player) => player.userId === room.winnerUserId);
  if (!room.winnerUserId) return "Draw";
  if (room.winnerUserId === userId) return "You win";
  return `${playerName(winner)} wins`;
}

function resultDescription(room: BattleRoom | null, userId?: string) {
  if (!room || room.status !== "FINISHED") return "";
  const me = room.players.find((player) => player.userId === userId);
  if (!room.winnerUserId) return "Both players finished with the same result.";
  if (room.winnerUserId === userId) {
    return me?.result === "WIN"
      ? "The battle is over. Your result has been recorded."
      : "The battle is over.";
  }
  return "The battle is over. Your opponent has the better result.";
}

export function BattleRoomPage() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const socketRef = useRef<Socket | null>(null);
  const opponentNameRef = useRef("Opponent");
  const { pollSubmission } = useSubmissionPolling();
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [tab, setTab] = useState<Tab>("description");
  const [language, setLanguage] = useState<"python" | "cpp">("python");
  const [code, setCode] = useState(starterCodeByLanguage.python);
  const [runResult, setRunResult] = useState<Submission | null>(null);
  const [submitResult, setSubmitResult] = useState<Submission | null>(null);
  const [consoleAction, setConsoleAction] = useState<ConsoleAction | null>(null);
  const [consoleError, setConsoleError] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [latestOpponentEvent, setLatestOpponentEvent] = useState("Waiting for opponent activity.");
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [opponentLeaveNotice, setOpponentLeaveNotice] = useState("");
  const [descriptionWidth, setDescriptionWidth] = useState(520);

  const roomQuery = useQuery({
    queryKey: ["battleRoom", roomId],
    queryFn: () => getBattleRoom(roomId),
    enabled: Boolean(roomId),
  });

  useEffect(() => {
    if (roomQuery.data) {
      setRoom(roomQuery.data);
      if (roomQuery.data.endsAt) {
        setRemainingSeconds(
          Math.max(0, Math.ceil((new Date(roomQuery.data.endsAt).getTime() - Date.now()) / 1000)),
        );
      }
    }
  }, [roomQuery.data]);

  const problemId = room?.problem?.id ?? "";
  const problemQuery = useQuery({
    queryKey: ["problemDetail", problemId],
    queryFn: () => getProblemDetail(problemId),
    enabled: Boolean(problemId),
  });
  const submissionsQuery = useQuery({
    queryKey: ["battleProblemSubmissions", problemId],
    queryFn: () => getMyProblemSubmissions(problemId),
    enabled: Boolean(problemId),
  });

  const runMutation = useMutation({
    mutationFn: () => runSampleTests({ problemId, code, language }),
    onMutate: () => {
      setConsoleAction("run");
      setRunResult(null);
      setConsoleError("");
    },
    onSuccess: (submission) => {
      setRunResult(submission);
      pollSubmission(submission.id, setRunResult);
    },
    onError: (error) => setConsoleError(getAxiosMessage(error)),
  });

  const players = useMemo(() => activePlayers(room?.players ?? []), [room]);
  const me = players.find((player) => player.userId === user?.id);
  const opponent = players.find((player) => player.userId !== user?.id);
  useEffect(() => {
    opponentNameRef.current = playerName(opponent);
  }, [opponent]);
  const runBusy =
    runMutation.isPending ||
    runResult?.status === "QUEUED" ||
    runResult?.status === "RUNNING";
  const submitPending =
    submitBusy ||
    submitResult?.status === "QUEUED" ||
    submitResult?.status === "RUNNING";
  const consoleResult =
    consoleAction === "run" ? runResult : consoleAction === "submit" ? submitResult : null;
  const consoleBusy = consoleAction === "run" ? runBusy : consoleAction === "submit" ? submitPending : false;
  const hasAccepted =
    typeof me?.bestRuntimeMs === "number" || submitResult?.verdict === "AC";
  useEffect(() => {
    if (!roomId || !accessToken) return;

    const socket = io(BATTLE_SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("room:join", { roomId });
    });
    socket.on("battle:room-joined", (nextRoom: BattleRoom) => {
      setRoom(nextRoom);
      if (nextRoom.status === "FINISHED") {
        setLatestOpponentEvent("Match finished.");
      }
    });
    socket.on("battle:room-updated", (nextRoom: BattleRoom) => {
      setRoom(nextRoom);
    });
    socket.on("battle:timer", (payload: { remainingSeconds: number }) => {
      setRemainingSeconds(payload.remainingSeconds);
    });
    socket.on("battle:opponent-submitted", () => {
      setLatestOpponentEvent(`${opponentNameRef.current} submitted a solution.`);
    });
    socket.on("battle:opponent-verdict", (payload: { verdict?: string; runtimeMs?: number }) => {
      setLatestOpponentEvent(
        `${opponentNameRef.current} got ${payload.verdict ?? "a verdict"}${
          typeof payload.runtimeMs === "number" ? ` in ${payload.runtimeMs} ms` : ""
        }.`,
      );
    });
    socket.on("battle:opponent-left", (payload: { forfeited?: boolean }) => {
      if (payload.forfeited) {
        const message = `${opponentNameRef.current} left before getting accepted. If you also finish without an accepted solution, the battle will be a draw.`;
        setLatestOpponentEvent(message);
        setOpponentLeaveNotice(message);
        return;
      }
      setLatestOpponentEvent(`${opponentNameRef.current} left the room.`);
    });
    socket.on("battle:submitted", (payload: { submissionId: string }) => {
      setSubmitBusy(false);
      pollSubmission(payload.submissionId, setSubmitResult, () => {
        queryClient.invalidateQueries({
          queryKey: ["battleProblemSubmissions", problemId],
        });
      });
    });
    socket.on("battle:verdict", (payload: { verdict?: string; runtimeMs?: number }) => {
      setLatestOpponentEvent(
        `Your latest verdict: ${payload.verdict ?? "pending"}${
          typeof payload.runtimeMs === "number" ? ` · ${payload.runtimeMs} ms` : ""
        }.`,
      );
    });
    socket.on("battle:result", (nextRoom: BattleRoom) => {
      setRoom(nextRoom);
      setRemainingSeconds(0);
      setLatestOpponentEvent("Match finished.");
    });
    socket.on("battle:error", (payload: { message?: string }) => {
      setConsoleError(payload.message ?? "Battle action failed.");
      setSubmitBusy(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, pollSubmission, problemId, queryClient, roomId]);

  const submitBattle = () => {
    if (!room?.id || room.status !== "ACTIVE") return;
    setConsoleAction("submit");
    setConsoleError("");
    setSubmitResult(null);
    setSubmitBusy(true);
    socketRef.current?.emit("room:submit", {
      roomId: room.id,
      code,
      language,
    });
  };

  const leaveBattle = () => {
    setLeaveConfirmOpen(true);
  };

  const confirmLeaveBattle = () => {
    setLeaveConfirmOpen(false);
    if (room?.id) {
      const fallback = window.setTimeout(() => {
        navigate("/battle", { replace: true });
      }, 900);

      socketRef.current
        ?.timeout(800)
        .emit("room:leave", { roomId: room.id }, () => {
          window.clearTimeout(fallback);
          navigate("/battle", { replace: true });
        });
      return;
    }
    navigate("/battle", { replace: true });
  };

  const beginResize = (startEvent: ReactPointerEvent<HTMLButtonElement>) => {
    const workspace = startEvent.currentTarget.closest(".workspace-grid") as HTMLElement | null;
    if (!workspace) return;

    startEvent.currentTarget.setPointerCapture(startEvent.pointerId);
    const bounds = workspace.getBoundingClientRect();
    const resize = (event: PointerEvent) => {
      const maxDescriptionWidth = Math.max(
        minDescriptionWidth,
        bounds.width - minEditorWidth - resizeHandleWidth,
      );
      setDescriptionWidth(
        Math.min(Math.max(event.clientX - bounds.left, minDescriptionWidth), maxDescriptionWidth),
      );
    };
    const stopResize = () => {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      document.body.classList.remove("is-resizing-workspace");
    };
    document.body.classList.add("is-resizing-workspace");
    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  };

  const problem = problemQuery.data;
  const finishedText = resultText(room, user?.id);
  const showResult = room?.status === "FINISHED";

  return (
    <section className="battle-room-page grid gap-3">
      <Panel className="battle-island">
        <div className="battle-island-item timer">
          <Clock3 size={18} />
          <strong>{formatTime(remainingSeconds)}</strong>
        </div>
        <div className="battle-island-item opponent">
          <UserRound size={18} />
          <div>
            <span>{playerName(opponent)}</span>
            <strong>Elo: {opponent?.eloBefore ?? "--"}</strong>
          </div>
        </div>
        <div className="battle-island-item event">
          <RadioTower size={18} />
          <span>{finishedText || latestOpponentEvent}</span>
        </div>
        <Button className="battle-leave-button" onClick={leaveBattle} variant="secondary">
          <LogOut size={17} />
          Leave room
        </Button>
      </Panel>

      <section
        className="workspace-grid grid h-[calc(100dvh-176px)] gap-0 max-xl:h-auto max-xl:grid-cols-1"
        style={{ "--description-width": `${descriptionWidth}px` } as CSSProperties}
      >
        <Panel className="problem-content-panel min-h-0 overflow-auto p-4">
          <div className="workspace-tabs sticky -top-4 z-10 -mx-4 -mt-4 mb-4 flex min-h-13 items-center gap-1 border-b border-[var(--line)] px-2.5">
            <Button variant="ghost" onClick={() => navigate("/battle")}>
              <ChevronLeft size={17} />
              Back
            </Button>
            {[
              ["description", FileText, "Question"],
              ["submissions", History, "Submissions"],
            ].map(([id, Icon, label]) => (
              <button
                aria-selected={tab === id}
                className={cn(
                  "workspace-tab inline-flex min-h-9 items-center gap-2 rounded-xl border-0 px-3 font-bold text-[var(--muted)]",
                  tab === id && "workspace-tab-active",
                )}
                key={id as string}
                onClick={() => setTab(id as Tab)}
              >
                <Icon size={16} />
                {label as string}
              </button>
            ))}
          </div>

          {roomQuery.isLoading && <div className="p-5 text-[var(--muted)]">Loading battle...</div>}
          {roomQuery.error && <div className="p-5 text-[var(--muted)]">Cannot load battle room.</div>}
          {problemQuery.isLoading && <div className="p-5 text-[var(--muted)]">Loading problem...</div>}
          {problem && tab === "description" && <ProblemContent problem={problem} />}
          {tab === "submissions" && (
            <SubmissionHistory
              submissions={submissionsQuery.data ?? []}
              onUseCode={(submission) => {
                setCode(submission.code);
                setLanguage(submission.language);
              }}
            />
          )}
        </Panel>

        <button
          aria-label="Resize description and editor panels"
          className="workspace-resize-handle"
          onPointerDown={beginResize}
          type="button"
        />

        <div className="min-h-0">
          <ProblemEditor
            code={code}
            language={language}
            runBusy={runBusy}
            submitBusy={submitPending}
            onCodeChange={setCode}
            onLanguageChange={(value) => {
              setLanguage(value);
              setCode(starterCodeByLanguage[value]);
              setRunResult(null);
              setSubmitResult(null);
              setConsoleAction(null);
            }}
            consoleBusy={consoleBusy}
            consoleError={consoleError}
            consoleLabel={consoleAction === "run" ? "Run" : consoleAction === "submit" ? "Submit" : "Battle"}
            consoleResult={consoleResult}
            onRun={() => {
              if (problemId) runMutation.mutate();
            }}
            onSubmit={submitBattle}
          />
        </div>
      </section>

      {showResult && (
        <div className="battle-result-backdrop">
          <Panel className="battle-result-modal">
            <p className="kicker">Battle result</p>
            <h2>{resultTitle(room, user?.id)}</h2>
            <p>{resultDescription(room, user?.id)}</p>
            <div className="battle-result-players">
              {room.players.map((player) => (
                <div
                  className={cn(
                    "battle-result-player",
                    player.userId === room.winnerUserId && "winner",
                    !room.winnerUserId && "draw",
                  )}
                  key={player.userId}
                >
                  <strong>{playerName(player)}</strong>
                  <span>{player.result ?? "DRAW"}</span>
                </div>
              ))}
            </div>
            <Button variant="primary" onClick={() => navigate("/battle")}>
              Back to battle
            </Button>
          </Panel>
        </div>
      )}

      {leaveConfirmOpen && (
        <div className="battle-dialog-backdrop">
          <Panel className="battle-dialog">
            <button
              aria-label="Close"
              className="battle-dialog-close"
              onClick={() => setLeaveConfirmOpen(false)}
              type="button"
            >
              <X size={17} />
            </button>
            <div className="battle-dialog-icon">
              <AlertTriangle size={24} />
            </div>
            <h2>{hasAccepted ? "Leave battle?" : "Forfeit battle?"}</h2>
            <p>
              {hasAccepted
                ? "You already have an accepted solution. You can leave now and your result will still count."
                : "You do not have an accepted solution yet. Leaving now records a forfeit. If your opponent also has no accepted solution, the battle ends in a draw."}
            </p>
            <div className="battle-dialog-actions">
              <Button variant="ghost" onClick={() => setLeaveConfirmOpen(false)}>
                Stay
              </Button>
              <Button className="battle-dialog-danger" onClick={confirmLeaveBattle}>
                Leave battle
              </Button>
            </div>
          </Panel>
        </div>
      )}

      {opponentLeaveNotice && (
        <div className="battle-dialog-backdrop">
          <Panel className="battle-dialog">
            <button
              aria-label="Close"
              className="battle-dialog-close"
              onClick={() => setOpponentLeaveNotice("")}
              type="button"
            >
              <X size={17} />
            </button>
            <div className="battle-dialog-icon">
              <RadioTower size={24} />
            </div>
            <h2>Opponent left</h2>
            <p>{opponentLeaveNotice}</p>
            <div className="battle-dialog-actions">
              <Button variant="primary" onClick={() => setOpponentLeaveNotice("")}>
                Keep solving
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </section>
  );
}
