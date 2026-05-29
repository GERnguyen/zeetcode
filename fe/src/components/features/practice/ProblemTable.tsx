import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProblemSummary } from "../../../types/domain";
import { cn } from "../../../lib/utils/cn";
import { Button } from "../../ui/Button";
import { Panel } from "../../ui/Panel";

type ProblemTableProps = {
  items: ProblemSummary[];
  loading: boolean;
  error: string;
  page: number;
  maxPage: number;
  onPageChange: (page: number) => void;
  onProblemClick: (problemId: string) => void;
};

export function ProblemTable({
  items,
  loading,
  error,
  page,
  maxPage,
  onPageChange,
  onProblemClick,
}: ProblemTableProps) {
  return (
    <>
      <Panel className="overflow-hidden p-0">
        <div className="grid min-h-14 grid-cols-[130px_minmax(0,1.4fr)_minmax(160px,0.8fr)_150px] items-center bg-[#2e3138] px-5 font-black max-lg:grid-cols-[70px_minmax(0,1fr)_110px]">
          <span>Status</span>
          <span>Problem</span>
          <span className="max-lg:hidden">Tags</span>
          <span>Difficulty</span>
        </div>
        {loading &&
          Array.from({ length: 6 }).map((_, index) => (
            <div
              className="h-[68px] animate-pulse border-t border-[var(--line)] bg-[#343740]"
              key={index}
            />
          ))}
        {!loading && error && <div className="p-5 text-[var(--muted)]">{error}</div>}
        {!loading &&
          !error &&
          items.map((problem) => (
            <button
              className="grid min-h-[68px] w-full grid-cols-[130px_minmax(0,1.4fr)_minmax(160px,0.8fr)_150px] items-center border-0 border-t border-[var(--line)] bg-[var(--panel)] px-5 text-left text-[var(--text)] hover:bg-[#214f53] max-lg:grid-cols-[70px_minmax(0,1fr)_110px]"
              key={problem.id}
              onClick={() => onProblemClick(problem.id)}
            >
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-md border-[3px] border-[#717680]",
                  problem.isSolved &&
                    "border-[var(--accent)] bg-[var(--accent)] text-[#102019]",
                )}
              >
                {problem.isSolved && <Check size={16} />}
              </span>
              <strong>{problem.title}</strong>
              <span className="text-[var(--muted)] max-lg:hidden">
                {problem.tags?.slice(0, 3).join(", ")}
              </span>
              <small className={`difficulty-${problem.difficulty} font-black`}>
                {problem.difficulty}
              </small>
            </button>
          ))}
      </Panel>

      <div className="flex items-center justify-center gap-3.5">
        <Button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={17} />
          Prev
        </Button>
        <span>
          Page {page} / {maxPage}
        </span>
        <Button
          disabled={page === maxPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight size={17} />
        </Button>
      </div>
    </>
  );
}
