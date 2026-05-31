import { useCallback, useRef } from "react";
import { getSubmission } from "../lib/api/submissions";
import type { Submission } from "../types/domain";

export function useSubmissionPolling() {
  const timers = useRef<number[]>([]);

  const pollSubmission = useCallback((
    submissionId: string,
    onUpdate: (submission: Submission) => void,
    onSettled?: () => void,
  ) => {
    const poll = async () => {
      const submission = await getSubmission(submissionId);
      onUpdate(submission);
      if (
        submission.status !== "FINISHED" &&
        submission.status !== "INTERNAL_ERROR"
      ) {
        const timer = window.setTimeout(poll, 900);
        timers.current.push(timer);
      } else {
        onSettled?.();
      }
    };
    poll();
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  return { pollSubmission, clearTimers };
}
