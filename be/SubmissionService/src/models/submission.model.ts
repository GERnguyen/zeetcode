import mongoose, { Document } from "mongoose";

export enum SubmissionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
}

export enum SubmissionLanguage {
  PYTHON = "python",
  CPP = "cpp",
}

export interface ISubmissionData {
  testCaseId: string;
  status: string;
}

export interface ISubmission extends Document {
  problemId: string;
  code: string;
  language: SubmissionLanguage;
  status: SubmissionStatus;
  submissionData: ISubmissionData;
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
    submissionData: {
      type: Object,
      required: [true, "Submission data is required"],
      default: {},
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
