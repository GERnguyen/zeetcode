import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, FileText, History, ListFilter } from "lucide-react";
import { type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSubmissionPolling } from "../../../hooks/useSubmissionPolling";
import { getProblemDetail } from "../../../lib/api/problems";
import {
  createSubmission,
  getMyProblemSubmissions,
  runSampleTests,
} from "../../../lib/api/submissions";
import { getAxiosMessage } from "../../../lib/api/http";
import { cn } from "../../../lib/utils/cn";
import type { Submission } from "../../../types/domain";
import { Button } from "../../ui/Button";
import { Panel } from "../../ui/Panel";
import { EditorialContent } from "./EditorialContent";
import { ProblemContent } from "./ProblemContent";
import { ProblemEditor } from "./ProblemEditor";
import { SubmissionHistory } from "./SubmissionHistory";

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

type Tab = "description" | "editorial" | "submissions";
const minDescriptionWidth = 340;
const minEditorWidth = 520;
const resizeHandleWidth = 12;

export function ProblemWorkspace() {
  const { problemId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pollSubmission } = useSubmissionPolling();
  const [tab, setTab] = useState<Tab>("description");
  const [language, setLanguage] = useState<"python" | "cpp">("python");
  const [code, setCode] = useState(starterCodeByLanguage.python);
  const [runResult, setRunResult] = useState<Submission | null>(null);
  const [submitResult, setSubmitResult] = useState<Submission | null>(null);
  const [descriptionWidth, setDescriptionWidth] = useState(520);

  const problemQuery = useQuery({
    queryKey: ["problemDetail", problemId],
    queryFn: () => getProblemDetail(problemId),
    enabled: Boolean(problemId),
  });

  const submissionsQuery = useQuery({
    queryKey: ["problemSubmissions", problemId],
    queryFn: () => getMyProblemSubmissions(problemId),
    enabled: Boolean(problemId),
  });

  const refreshSubmissions = () => {
    queryClient.invalidateQueries({ queryKey: ["problemSubmissions", problemId] });
    queryClient.invalidateQueries({ queryKey: ["acceptedProblems"] });
  };

  const runMutation = useMutation({
    mutationFn: () => runSampleTests({ problemId, code, language }),
    onMutate: () => {
      setRunResult(null);
    },
    onSuccess: (submission) => {
      setRunResult(submission);
      pollSubmission(submission.id, setRunResult, refreshSubmissions);
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => createSubmission({ problemId, code, language }),
    onMutate: () => {
      setSubmitResult(null);
    },
    onSuccess: (submission) => {
      setSubmitResult(submission);
      pollSubmission(submission.id, setSubmitResult, refreshSubmissions);
    },
  });

  useEffect(() => {
    setRunResult(null);
    setSubmitResult(null);
  }, [problemId]);

  const problem = problemQuery.data;
  const isPendingSubmission = (submission: Submission | null) =>
    submission?.status === "QUEUED" || submission?.status === "RUNNING";
  const runBusy = runMutation.isPending || isPendingSubmission(runResult);
  const submitBusy = submitMutation.isPending || isPendingSubmission(submitResult);

  const beginResize = (startEvent: ReactPointerEvent<HTMLButtonElement>) => {
    const workspace = startEvent.currentTarget.closest(
      ".workspace-grid",
    ) as HTMLElement | null;
    if (!workspace) {
      return;
    }

    startEvent.currentTarget.setPointerCapture(startEvent.pointerId);
    const bounds = workspace.getBoundingClientRect();

    const resize = (event: PointerEvent) => {
      const maxDescriptionWidth = Math.max(
        minDescriptionWidth,
        bounds.width - minEditorWidth - resizeHandleWidth,
      );
      const nextWidth = Math.min(
        Math.max(event.clientX - bounds.left, minDescriptionWidth),
        maxDescriptionWidth,
      );
      setDescriptionWidth(nextWidth);
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

  return (
    <section
      className="workspace-grid grid h-[calc(100dvh-104px)] gap-0 max-xl:h-auto max-xl:grid-cols-1"
      style={
        {
          "--description-width": `${descriptionWidth}px`,
        } as CSSProperties
      }
    >
      <Panel className="min-h-0 overflow-auto p-4">
        <div className="workspace-tabs sticky -top-4 z-10 -mx-4 -mt-4 mb-4 flex min-h-13 items-center gap-1 border-b border-[var(--line)] px-2.5">
          <Button variant="ghost" onClick={() => navigate("/practice")}>
            <ChevronLeft size={17} />
            Back
          </Button>
          {[
            ["description", FileText, "Question"],
            ["editorial", ListFilter, "Editorial"],
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

        {problemQuery.isLoading && <ProblemSkeleton />}
        {problemQuery.error && (
          <div className="p-5 text-[var(--muted)]">Cannot load problem.</div>
        )}
        {problem && tab === "description" && <ProblemContent problem={problem} />}
        {problem && tab === "editorial" && <EditorialContent problem={problem} />}
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
          runResult={runResult}
          submitResult={submitResult}
          runBusy={runBusy}
          submitBusy={submitBusy}
          runError={runMutation.error ? getAxiosMessage(runMutation.error) : ""}
          submitError={
            submitMutation.error ? getAxiosMessage(submitMutation.error) : ""
          }
          onCodeChange={setCode}
          onLanguageChange={(value) => {
            setLanguage(value);
            setCode(starterCodeByLanguage[value]);
            setRunResult(null);
            setSubmitResult(null);
          }}
          onRun={() => runMutation.mutate()}
          onSubmit={() => submitMutation.mutate()}
        />
      </div>
    </section>
  );
}

function ProblemSkeleton() {
  return (
    <div className="grid gap-3">
      <div className="h-8 rounded-xl bg-[#343740]" />
      <div className="h-8 rounded-xl bg-[#343740]" />
      <div className="h-8 rounded-xl bg-[#343740]" />
      <div className="h-8 rounded-xl bg-[#343740]" />
    </div>
  );
}
