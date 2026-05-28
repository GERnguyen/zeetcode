import axios from "axios";
import { serverConfig } from "../config";
import { InternalServerError } from "../utils/errors/app.error";
import logger from "../config/logger.config";

export type SubmissionUpdatePayload = {
  status?: "QUEUED" | "RUNNING" | "FINISHED" | "INTERNAL_ERROR";
  verdict?: "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE" | "PE" | null;
  testCaseResults?: Record<string, string>;
  judgeMeta?: {
    score?: number;
    passedTests?: number;
    totalTests?: number;
    runtimeMs?: number;
    memoryKb?: number;
    errorMessage?: string;
    rawErrorOutput?: string;
    errorStage?: "compile" | "runtime";
    judgeVersion?: string;
    judgedAt?: string;
  };
};

export async function updateSubmission(
  submissionId: string,
  payload: SubmissionUpdatePayload,
) {
  try {
    const url = `${serverConfig.SUBMISSION_SERVICE_URL}/submissions/${submissionId}/status`;
    logger.info("Updating submission status", { url });
    const response = await axios.patch(url, payload);

    if (response.status !== 200) {
      throw new InternalServerError("Failed to update submission");
    }
    console.log("Submission updated successfully", response.data);
    return;
  } catch (error) {
    logger.error(`Failed to update submission: ${error}`);
    throw new InternalServerError("Failed to update submission");
  }
}
