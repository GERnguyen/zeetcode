import mongoose, { Document } from "mongoose";

export enum SubmissionStatus {
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  FINISHED = "FINISHED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export enum SubmissionVerdict {
  AC = "AC",
  WA = "WA",
  TLE = "TLE",
  MLE = "MLE",
  RE = "RE",
  CE = "CE",
  PE = "PE",
}

export enum SubmissionTestCaseStatus {
  AC = "AC",
  WA = "WA",
  TLE = "TLE",
  MLE = "MLE",
  RE = "RE",
  CE = "CE",
  PE = "PE",
  BLOCKED = "BLOCKED",
}

export enum SubmissionLanguage {
  PYTHON = "python",
  CPP = "cpp",
}

export interface ISubmissionData {
  testCaseId: string;
  status: string;
}

export interface ISubmissionJudgeMeta {
  score?: number;
  passedTests?: number;
  totalTests?: number;
  runtimeMs?: number;
  memoryKb?: number;
  errorMessage?: string;
  rawErrorOutput?: string;
  errorStage?: "compile" | "runtime";
  judgeVersion?: string;
  judgedAt?: Date;
}

export interface ISubmissionEvaluationUpdate {
  status?: SubmissionStatus;
  verdict?: SubmissionVerdict | null;
  testCaseResults?: Record<string, SubmissionTestCaseStatus>;
  judgeMeta?: ISubmissionJudgeMeta;
}

export interface ISubmission extends Document {
  userId: string;
  problemId: string;
  code: string;
  language: SubmissionLanguage;
  status: SubmissionStatus;
  verdict: SubmissionVerdict | null;
  testCaseResults?: Record<string, SubmissionTestCaseStatus>;
  judgeMeta?: ISubmissionJudgeMeta;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new mongoose.Schema<ISubmission>(
  {
    userId: { type: String, required: [true, "User ID is required"] },
    problemId: { type: String, required: [true, "Problem ID is required"] },
    code: { type: String, required: [true, "Code is required"] },
    language: {
      type: String,
      required: [true, "Language is required"],
      enum: Object.values(SubmissionLanguage),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(SubmissionStatus),
      default: SubmissionStatus.QUEUED,
    },
    verdict: {
      type: String,
      enum: Object.values(SubmissionVerdict),
      default: null,
    },
    testCaseResults: {
      type: Map,
      of: String,
      default: undefined,
    },
    judgeMeta: {
      score: { type: Number, default: undefined },
      passedTests: { type: Number, default: undefined },
      totalTests: { type: Number, default: undefined },
      runtimeMs: { type: Number, default: undefined },
      memoryKb: { type: Number, default: undefined },
      errorMessage: { type: String, default: undefined },
      rawErrorOutput: { type: String, default: undefined },
      errorStage: {
        type: String,
        enum: ["compile", "runtime"],
        default: undefined,
      },
      judgeVersion: { type: String, default: undefined },
      judgedAt: { type: Date, default: undefined },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, record: any) => {
        delete record.__v;
        // normalize Mongo _id to id (string)
        record.id = record._id ? String(record._id) : record._id;
        delete record._id;
        return record;
      },
    },
  },
);

submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ problemId: 1, createdAt: -1 });
submissionSchema.index({ status: 1, verdict: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, verdict: 1, problemId: 1 });

export const Submission = mongoose.model<ISubmission>(
  "Submission",
  submissionSchema,
);
