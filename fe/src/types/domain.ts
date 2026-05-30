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
  createdAt?: string;
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

export type BattleResult = "WIN" | "LOSS" | "DRAW";
export type BattleMode = "RANKED" | "PRIVATE";
export type BattleStatus =
  | "WAITING"
  | "READY"
  | "ACTIVE"
  | "FINISHED"
  | "CANCELED";

export type BattlePlayer = {
  userId: string;
  username?: string;
  joinedAt: string;
  leftAt?: string;
  hasLeft?: boolean;
  bestRuntimeMs?: number;
  lastVerdict?: Verdict | null;
  lastSubmissionId?: string;
  lastSubmittedAt?: string;
  result?: BattleResult;
  eloBefore?: number;
  eloAfter?: number;
  eloDelta?: number;
};

export type BattleRoom = {
  id: string;
  mode: BattleMode;
  status: BattleStatus;
  difficulty: Difficulty;
  timerSeconds: number;
  roomCode?: string;
  inviteCode?: string;
  ownerId?: string;
  problem?: {
    id: string;
    title: string;
    difficulty: Difficulty;
  };
  players: BattlePlayer[];
  startedAt?: string;
  endsAt?: string;
  endedAt?: string;
  winnerUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};
