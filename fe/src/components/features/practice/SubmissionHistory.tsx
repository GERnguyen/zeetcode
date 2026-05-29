import { Copy } from "lucide-react";
import type { Submission } from "../../../types/domain";

type SubmissionHistoryProps = {
  submissions: Submission[];
  onUseCode: (submission: Submission) => void;
};

export function SubmissionHistory({
  submissions,
  onUseCode,
}: SubmissionHistoryProps) {
  if (submissions.length === 0) {
    return <div className="p-5 text-[var(--muted)]">No submissions yet.</div>;
  }

  return (
    <div className="grid gap-2">
      {submissions.map((submission) => (
        <button
          className="grid min-h-13 w-full grid-cols-[minmax(0,1fr)_90px_80px_80px_28px] items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[#202329] px-3 text-left text-[var(--text)]"
          key={submission.id}
          onClick={() => onUseCode(submission)}
        >
          <span>{new Date(submission.createdAt).toLocaleString()}</span>
          <strong>{submission.verdict ?? submission.status}</strong>
          <small>{submission.language}</small>
          <small>{submission.judgeMeta?.runtimeMs ?? 0} ms</small>
          <Copy size={15} />
        </button>
      ))}
    </div>
  );
}
