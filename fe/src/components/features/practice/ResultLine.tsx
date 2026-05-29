import { CheckCircle2, Clock3, Loader2 } from "lucide-react";
import type { Submission } from "../../../types/domain";

export function ResultLine({
  label,
  submission,
}: {
  label: string;
  submission: Submission | null;
}) {
  if (!submission) {
    return (
      <p className="flex items-center gap-2 text-[var(--muted)]">
        <Clock3 size={15} />
        {label}: idle
      </p>
    );
  }

  const done =
    submission.status === "FINISHED" || submission.status === "INTERNAL_ERROR";

  return (
    <p className="flex items-center gap-2 text-[var(--muted)]">
      {done ? <CheckCircle2 size={15} /> : <Loader2 size={15} />}
      {label}: {submission.verdict ?? submission.status} ·{" "}
      {submission.judgeMeta?.passedTests ?? 0}/
      {submission.judgeMeta?.totalTests ?? 0} ·{" "}
      {submission.judgeMeta?.runtimeMs ?? 0} ms
    </p>
  );
}
