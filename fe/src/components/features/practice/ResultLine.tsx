import { AlertTriangle, CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import type { Submission } from "../../../types/domain";
import { cn } from "../../../lib/utils/cn";

export function ResultLine({
  busy,
  error,
  label,
  submission,
}: {
  busy: boolean;
  error: string;
  label: string;
  submission: Submission | null;
}) {
  if (error) {
    return (
      <div className="result-line result-line-error">
        <AlertTriangle size={16} />
        <span className="result-label">{label}</span>
        <span className="result-message">{error}</span>
      </div>
    );
  }

  if (busy && !submission) {
    return (
      <div className="result-line result-line-running">
        <Loader2 className="animate-spin" size={16} />
        <span className="result-label">{label}</span>
        <span className="result-message">Waiting for judge...</span>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="result-line">
        <Clock3 size={16} />
        <span className="result-label">{label}</span>
        <span className="result-message">Idle</span>
      </div>
    );
  }

  const done =
    submission.status === "FINISHED" || submission.status === "INTERNAL_ERROR";
  const accepted = submission.verdict === "AC";
  const failed =
    submission.status === "INTERNAL_ERROR" ||
    (submission.verdict !== null && submission.verdict !== "AC");
  const passedTests = submission.judgeMeta?.passedTests ?? 0;
  const totalTests = submission.judgeMeta?.totalTests ?? 0;
  const runtimeMs = submission.judgeMeta?.runtimeMs;
  const summary = done
    ? `${submission.verdict ?? submission.status} · ${passedTests}/${totalTests} tests${
        typeof runtimeMs === "number" ? ` · ${runtimeMs} ms` : ""
      }`
    : `${submission.status} · judging`;

  return (
    <div
      className={cn(
        "result-line",
        !done && "result-line-running",
        accepted && "result-line-success",
        failed && "result-line-error",
      )}
    >
      {!done && <Loader2 className="animate-spin" size={16} />}
      {done && accepted && <CheckCircle2 size={16} />}
      {done && failed && <XCircle size={16} />}
      {done && !accepted && !failed && <CheckCircle2 size={16} />}
      <span className="result-label">{label}</span>
      <span className="result-message">{summary}</span>
      {submission.judgeMeta?.rawErrorOutput && (
        <code className="result-error-output">
          {submission.judgeMeta.rawErrorOutput}
        </code>
      )}
    </div>
  );
}
