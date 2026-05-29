import { Editor } from "@monaco-editor/react";
import { Code2, Loader2, Play, Send } from "lucide-react";
import type { Submission } from "../../../types/domain";
import { Button } from "../../ui/Button";
import { Select } from "../../ui/Form";
import { ResultLine } from "./ResultLine";

type ProblemEditorProps = {
  code: string;
  language: "python" | "cpp";
  runResult: Submission | null;
  submitResult: Submission | null;
  runBusy: boolean;
  submitBusy: boolean;
  runError: string;
  submitError: string;
  onCodeChange: (value: string) => void;
  onLanguageChange: (value: "python" | "cpp") => void;
  onRun: () => void;
  onSubmit: () => void;
};

export function ProblemEditor({
  code,
  language,
  runResult,
  submitResult,
  runBusy,
  submitBusy,
  runError,
  submitError,
  onCodeChange,
  onLanguageChange,
  onRun,
  onSubmit,
}: ProblemEditorProps) {
  return (
    <div className="editor-shell min-h-0 overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)]">
      <div className="editor-toolbar flex min-h-13 items-center justify-between gap-2.5 border-b border-[var(--line)] px-3 max-md:grid max-md:py-3">
        <div className="flex items-center gap-2.5">
          <Code2 size={17} />
          <span>solution.{language === "cpp" ? "cpp" : "py"}</span>
        </div>
        <div className="flex items-center gap-2.5 max-sm:grid">
          <Select
            value={language}
            onChange={(event) =>
              onLanguageChange(event.target.value as "python" | "cpp")
            }
          >
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </Select>
          <Button
            className="run-action-button"
            disabled={runBusy || submitBusy}
            onClick={onRun}
          >
            {runBusy ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Play size={17} />
            )}
            {runBusy ? "Running..." : "Run"}
          </Button>
          <Button
            className="submit-action-button"
            disabled={runBusy || submitBusy}
            variant="primary"
            onClick={onSubmit}
          >
            {submitBusy ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <Send size={17} />
            )}
            {submitBusy ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
      <Editor
        height="620px"
        theme="vs-dark"
        language={language === "cpp" ? "cpp" : "python"}
        value={code}
        onChange={(value) => onCodeChange(value ?? "")}
        options={{ minimap: { enabled: false }, fontSize: 14 }}
      />
      <div className="result-panel grid min-h-20 content-center gap-2 border-t border-[var(--line)] px-3.5 py-2.5">
        <ResultLine busy={runBusy} error={runError} label="Run" submission={runResult} />
        <ResultLine
          busy={submitBusy}
          error={submitError}
          label="Submit"
          submission={submitResult}
        />
      </div>
    </div>
  );
}
