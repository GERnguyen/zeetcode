import { Editor } from "@monaco-editor/react";
import { Code2, Play, Send } from "lucide-react";
import type { Submission } from "../../../types/domain";
import { Button } from "../../ui/Button";
import { Select } from "../../ui/Form";
import { ResultLine } from "./ResultLine";

type ProblemEditorProps = {
  code: string;
  language: "python" | "cpp";
  runResult: Submission | null;
  submitResult: Submission | null;
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
  onCodeChange,
  onLanguageChange,
  onRun,
  onSubmit,
}: ProblemEditorProps) {
  return (
    <div className="min-h-0 overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)]">
      <div className="flex min-h-13 items-center justify-between gap-2.5 border-b border-[var(--line)] bg-[#202227] px-3">
        <div className="flex items-center gap-2.5">
          <Code2 size={17} />
          <span>solution.{language === "cpp" ? "cpp" : "py"}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Select
            value={language}
            onChange={(event) =>
              onLanguageChange(event.target.value as "python" | "cpp")
            }
          >
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </Select>
          <Button onClick={onRun}>
            <Play size={17} />
            Run
          </Button>
          <Button variant="primary" onClick={onSubmit}>
            <Send size={17} />
            Submit
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
      <div className="grid min-h-20 content-center gap-2 border-t border-[var(--line)] bg-[#1e2025] px-3.5 py-2.5">
        <ResultLine label="Run" submission={runResult} />
        <ResultLine label="Submit" submission={submitResult} />
      </div>
    </div>
  );
}
