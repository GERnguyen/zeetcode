import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, FileText, History, ListFilter } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSubmissionPolling } from "../../../hooks/useSubmissionPolling";
import { getProblemDetail } from "../../../lib/api/problems";
import {
  createSubmission,
  getMyProblemSubmissions,
  runSampleTests,
} from "../../../lib/api/submissions";
import { cn } from "../../../lib/utils/cn";
import type { Submission } from "../../../types/domain";
import { Button } from "../../ui/Button";
import { Panel } from "../../ui/Panel";
import { EditorialContent } from "./EditorialContent";
import { ProblemContent } from "./ProblemContent";
import { ProblemEditor } from "./ProblemEditor";
import { SubmissionHistory } from "./SubmissionHistory";

const starterCode = `def solve():
    # Read stdin and print the answer.
    pass

if __name__ == "__main__":
    solve()
`;

type Tab = "description" | "editorial" | "submissions";

export function ProblemWorkspace() {
  const { problemId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pollSubmission } = useSubmissionPolling();
  const [tab, setTab] = useState<Tab>("description");
  const [code, setCode] = useState(starterCode);
  const [language, setLanguage] = useState<"python" | "cpp">("python");
  const [runResult, setRunResult] = useState<Submission | null>(null);
  const [submitResult, setSubmitResult] = useState<Submission | null>(null);

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
    onSuccess: (submission) => {
      setRunResult(submission);
      pollSubmission(submission.id, setRunResult, refreshSubmissions);
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => createSubmission({ problemId, code, language }),
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

  return (
    <section className="grid h-[calc(100dvh-104px)] grid-cols-[minmax(380px,0.82fr)_minmax(520px,1.18fr)] gap-3 max-xl:grid-cols-1">
      <Panel className="min-h-0 overflow-auto p-4">
        <div className="sticky -top-4 z-10 -mx-4 -mt-4 mb-4 flex min-h-13 items-center gap-1 border-b border-[var(--line)] bg-[#202227] px-2.5">
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
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-xl px-3 font-bold text-[var(--muted)]",
                tab === id && "bg-[#30333a] text-[var(--text)]",
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

      <div className="min-h-0">
        <ProblemEditor
          code={code}
          language={language}
          runResult={runResult}
          submitResult={submitResult}
          onCodeChange={setCode}
          onLanguageChange={setLanguage}
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
