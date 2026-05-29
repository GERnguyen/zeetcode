export type Difficulty = "easy" | "medium" | "hard";

export type Verdict = "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE" | "PE";

export type SubmissionStatus =
  | "QUEUED"
  | "RUNNING"
  | "FINISHED"
  | "INTERNAL_ERROR";

export type User = {
  id: string;
  username: string;
  email: string;
  eloRating?: number;
  profileVisibility: "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";
};

export type ProblemSummary = {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  isSolved?: boolean;
};

export type ProblemDetail = ProblemSummary & {
  description: string;
  editorial?: {
    videoLink?: string;
    text?: string;
  };
  examples: Array<{ input: string; output: string }>;
};

export type Submission = {
  id: string;
  problemId: string;
  code: string;
  language: "python" | "cpp";
  status: SubmissionStatus;
  verdict: Verdict | null;
  isPracticeRun?: boolean;
  createdAt: string;
  judgeMeta?: {
    runtimeMs?: number;
    passedTests?: number;
    totalTests?: number;
    rawErrorOutput?: string;
  };
};

export type ProblemListResponse = {
  problems: ProblemSummary[];
  total: number;
  stats: Record<Difficulty, number>;
};

export type AcceptedProblemsResponse = {
  problemIds: string[];
  stats: {
    totalSolved: number;
    byDifficulty: Record<Difficulty, number>;
  };
};
