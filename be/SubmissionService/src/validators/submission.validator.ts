import { z } from "zod";
import {
  SubmissionLanguage,
  SubmissionStatus,
  SubmissionVerdict,
  SubmissionTestCaseStatus,
} from "../models/submission.model";

// Schema for creating a new submission
export const createSubmissionSchema = z.object({
  problemId: z.string().min(1, "Problem ID is required"),
  code: z.string().min(1, "Code is required"),
  language: z.nativeEnum(SubmissionLanguage, {
    errorMap: () => ({ message: "Language must be either 'cpp' or 'python'" }),
  }),
});

// Schema for updating submission status
export const updateSubmissionStatusSchema = z
  .object({
    status: z.nativeEnum(SubmissionStatus).optional(),
    verdict: z.nativeEnum(SubmissionVerdict).nullable().optional(),
    testCaseResults: z
      .record(z.nativeEnum(SubmissionTestCaseStatus))
      .optional(),
    judgeMeta: z
      .object({
        score: z.number().min(0).optional(),
        passedTests: z.number().int().min(0).optional(),
        totalTests: z.number().int().min(0).optional(),
        runtimeMs: z.number().min(0).optional(),
        memoryKb: z.number().min(0).optional(),
        errorMessage: z.string().min(1).optional(),
        rawErrorOutput: z.string().optional(),
        errorStage: z.enum(["compile", "runtime"]).optional(),
        judgeVersion: z.string().min(1).optional(),
        judgedAt: z.coerce.date().optional(),
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.verdict !== undefined ||
      data.testCaseResults !== undefined ||
      data.judgeMeta !== undefined,
    {
      message:
        "At least one of status, verdict, testCaseResults, or judgeMeta is required",
    },
  );

// Schema for query parameters (if needed for filtering)
export const submissionQuerySchema = z.object({
  status: z.nativeEnum(SubmissionStatus).optional(),
  language: z.nativeEnum(SubmissionLanguage).optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1).max(100))
    .optional(),
  page: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1))
    .optional(),
});

export const submissionProblemParamsSchema = z.object({
  problemId: z.string().min(1, "Problem ID is required"),
});
