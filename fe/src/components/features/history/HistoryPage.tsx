import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarClock, Swords, Trophy } from "lucide-react";
import { getMyBattleHistory } from "../../../lib/api/battles";
import { useAuthStore } from "../../../stores/authStore";
import type { BattleResult, BattleRoom } from "../../../types/domain";
import { Panel } from "../../ui/Panel";

function myResult(room: BattleRoom, userId?: string): BattleResult | undefined {
  return room.players.find((player) => player.userId === userId)?.result;
}

function opponentName(room: BattleRoom, userId?: string) {
  const opponent = room.players.find((player) => player.userId !== userId);
  return opponent?.username ?? opponent?.userId.slice(0, 8) ?? "Opponent";
}

function resultClass(result?: BattleResult) {
  if (result === "WIN") return "battle-form-win";
  if (result === "DRAW") return "battle-form-draw";
  if (result === "LOSS") return "battle-form-loss";
  return "battle-form-empty";
}

function resultLabel(result?: BattleResult) {
  if (result === "WIN") return "Win";
  if (result === "LOSS") return "Loss";
  if (result === "DRAW") return "Draw";
  return "Unknown";
}

export function HistoryPage() {
  const user = useAuthStore((state) => state.user);
  const historyQuery = useQuery({
    queryKey: ["battleHistory", 20],
    queryFn: () => getMyBattleHistory(20),
  });

  const rooms = historyQuery.data ?? [];
  const results = rooms
    .map((room) => myResult(room, user?.id))
    .filter(Boolean) as BattleResult[];
  const wins = results.filter((result) => result === "WIN").length;
  const losses = results.filter((result) => result === "LOSS").length;
  const winRate = results.length ? Math.round((wins / results.length) * 100) : 0;
  const recent = results.slice(0, 5);

  return (
    <section className="history-page grid gap-5">
      <div className="history-header">
        <div>
          <p className="kicker">Battle history</p>
          <h2>Recent matches</h2>
        </div>
        <div className="history-header-mark">
          <CalendarClock size={22} />
          Last 20 finished battles
        </div>
      </div>

      <Panel className="history-stats-panel p-5">
        <div className="history-stat">
          <span>Total</span>
          <strong>{results.length}</strong>
        </div>
        <div className="history-stat win">
          <span>Wins</span>
          <strong>{wins}</strong>
        </div>
        <div className="history-stat loss">
          <span>Losses</span>
          <strong>{losses}</strong>
        </div>
        <div className="history-stat">
          <span>Win rate</span>
          <strong>{winRate}%</strong>
        </div>
        <div className="history-form-card">
          <span>Last 5</span>
          <div className="battle-form-track">
            {Array.from({ length: 5 }).map((_, index) => (
              <i
                className={resultClass(recent[index])}
                key={`${recent[index] ?? "empty"}-${index}`}
                title={resultLabel(recent[index])}
              />
            ))}
          </div>
        </div>
      </Panel>

      <Panel className="history-list-panel">
        <div className="history-list-heading">
          <div>
            <h3>Matches</h3>
            <p>Finished battles only.</p>
          </div>
          <BarChart3 size={22} />
        </div>

        {historyQuery.isLoading && (
          <div className="history-empty">Loading match history...</div>
        )}
        {historyQuery.error && (
          <div className="history-empty">Cannot load match history.</div>
        )}
        {!historyQuery.isLoading && rooms.length === 0 && (
          <div className="history-empty">No finished battles yet.</div>
        )}

        <div className="history-match-list">
          {rooms.map((room) => {
            const result = myResult(room, user?.id);
            const me = room.players.find((player) => player.userId === user?.id);
            return (
              <div className="history-match-row" key={room.id}>
                <div className="history-match-main">
                  <Swords size={18} />
                  <div>
                    <strong>{room.problem?.title ?? "Battle problem"}</strong>
                    <span>
                      vs {opponentName(room, user?.id)} · {room.mode.toLowerCase()} ·{" "}
                      {room.difficulty}
                    </span>
                  </div>
                </div>
                <div className={`history-result ${result?.toLowerCase() ?? ""}`}>
                  {resultLabel(result)}
                </div>
                <div className="history-runtime">
                  {typeof me?.bestRuntimeMs === "number"
                    ? `${me.bestRuntimeMs} ms`
                    : "--"}
                </div>
                <div className="history-date">
                  {room.endedAt ? new Date(room.endedAt).toLocaleDateString() : "--"}
                </div>
                <Trophy size={17} />
              </div>
            );
          })}
        </div>
      </Panel>
    </section>
  );
}
