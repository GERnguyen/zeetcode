import { Copy } from "lucide-react";
import type { Submission } from "../../../types/domain";
import { cn } from "../../../lib/utils/cn";

type SubmissionHistoryProps = {
  submissions: Submission[];
  onUseCode: (submission: Submission) => void;
};

export function SubmissionHistory({
  submissions,
  onUseCode,
}: SubmissionHistoryProps) {
  const judgedSubmissions = submissions.filter(
    (submission) => !submission.isPracticeRun,
  );

  if (judgedSubmissions.length === 0) {
    return <div className="p-5 text-[var(--muted)]">No submissions yet.</div>;
  }

  return (
    <div className="grid gap-2">
      {judgedSubmissions.map((submission) => (
        <button
          className={cn(
            "submission-row grid min-h-13 w-full grid-cols-[minmax(0,1fr)_90px_80px_80px_28px] items-center gap-2.5 rounded-xl border border-[var(--line)] px-3 text-left text-[var(--text)] max-md:grid-cols-[minmax(0,1fr)_80px_28px]",
            submission.verdict === "AC" && "submission-row-ac",
            submission.verdict === "WA" && "submission-row-wa",
            submission.verdict &&
              submission.verdict !== "AC" &&
              submission.verdict !== "WA" &&
              "submission-row-error",
          )}
          key={submission.id}
          onClick={() => onUseCode(submission)}
        >
          <span>{new Date(submission.createdAt).toLocaleString()}</span>
          <strong>{submission.verdict ?? submission.status}</strong>
          <small className="max-md:hidden">{submission.language}</small>
          <small className="max-md:hidden">{submission.judgeMeta?.runtimeMs ?? 0} ms</small>
          <Copy size={15} />
        </button>
      ))}
    </div>
  );
}
