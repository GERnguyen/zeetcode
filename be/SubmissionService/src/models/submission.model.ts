import mongoose, { Document } from "mongoose";

export enum SubmissionStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  WRONG_ANSWER = "wrong_answer",
  COMPILING = "compiling",
  TIME_LIMIT_EXCEEDED = "time_limit_exceeded",
  RUNTIME_ERROR = "runtime_error",
  COMPILE_ERROR = "compile_error",
}

export enum SubmissionLanguage {
  PYTHON = "python",
  CPP = "cpp",
}

export interface ISubmission extends Document {
  problemId: string;
  code: string;
  language: SubmissionLanguage;
  status: SubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new mongoose.Schema<ISubmission>(
  {
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
      default: SubmissionStatus.PENDING,
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

submissionSchema.index({ createdAt: -1, status: 1 });

export const Submission = mongoose.model<ISubmission>(
  "Submission",
  submissionSchema,
);
