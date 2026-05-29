import type { Difficulty } from "../../../types/domain";

type CompletionRingProps = {
  solved: number;
  total: number;
  stats: Record<Difficulty, number>;
  solvedStats: Record<Difficulty, number>;
};

export function CompletionRing({
  solved,
  total,
  stats,
  solvedStats,
}: CompletionRingProps) {
  const percent = total ? solved / total : 0;
  const circumference = 2 * Math.PI * 76;

  return (
    <div className="completion-panel grid grid-cols-[150px_220px] items-center justify-end gap-6 rounded-[var(--radius)] p-4 max-sm:grid-cols-1">
      <div className="grid gap-3.5 text-2xl">
        {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
          <div className="completion-stat grid grid-cols-[90px_1fr] rounded-xl px-3 py-2" key={level}>
            <strong className={`difficulty-${level}`}>
              {level === "medium" ? "med" : level}
            </strong>
            <span>
              {solvedStats[level] ?? 0}/{stats[level] ?? 0}
            </span>
          </div>
        ))}
      </div>
      <div className="completion-ring relative grid size-[220px] place-items-center">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 180 180"
          aria-label="Practice completion"
        >
          <circle
            className="fill-none stroke-[rgba(184,132,50,0.42)] stroke-[10] [stroke-linecap:round]"
            cx="90"
            cy="90"
            r="76"
          />
          <circle
            className="fill-none stroke-[var(--accent)] stroke-[10] transition-[stroke-dashoffset] [stroke-linecap:round]"
            cx="90"
            cy="90"
            r="76"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent)}
          />
        </svg>
        <div className="grid text-center">
          <strong className="text-4xl">
            {solved}/{total}
          </strong>
          <span className="text-[var(--muted)]">Solved</span>
        </div>
      </div>
    </div>
  );
}
