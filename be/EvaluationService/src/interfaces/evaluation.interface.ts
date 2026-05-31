export interface TestCase {
  _id: string;
  input: string;
  output: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  diffculty: string;
  editorial?: string;
  testcases: TestCase[];
  createdAt: string;
  updatedAt: string;
}
export interface EvaluationJob {
  submissionId: string;
  code: string;
  language: "python" | "cpp";
  problem: Problem;
}

export interface EvaluationResult {
  status: "success" | "Time Limit Exceeded" | "failed";
  output: string;
  runtimeMs: number;
  errorStage?: "compile" | "runtime";
}
