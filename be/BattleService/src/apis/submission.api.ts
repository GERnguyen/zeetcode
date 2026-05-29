import axios, { AxiosResponse } from "axios";
import { serverConfig } from "../config";
import { InternalServerError } from "../utils/errors/app.error";
import logger from "../config/logger.config";

export type SubmissionStatus =
  | "QUEUED"
  | "RUNNING"
  | "FINISHED"
  | "INTERNAL_ERROR";

export type SubmissionVerdict =
  | "AC"
  | "WA"
  | "TLE"
  | "MLE"
  | "RE"
  | "CE"
  | "PE";

export type SubmissionJudgeMeta = {
  runtimeMs?: number;
};

export interface SubmissionResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: SubmissionStatus;
    verdict: SubmissionVerdict | null;
    judgeMeta?: SubmissionJudgeMeta;
  };
}

export async function createSubmission(
  payload: {
    problemId: string;
    code: string;
    language: string;
  },
  accessToken: string,
): Promise<SubmissionResponse["data"]> {
  try {
    const response: AxiosResponse<SubmissionResponse> = await axios.post(
      `${serverConfig.SUBMISSION_SERVICE_URL}/submissions`,
      payload,
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.data.success) {
      throw new InternalServerError("Failed to create submission");
    }

    return response.data.data;
  } catch (error) {
    logger.error("Error creating submission", error);
    throw new InternalServerError("Failed to create submission");
  }
}

export async function getSubmissionById(
  submissionId: string,
): Promise<SubmissionResponse["data"] | null> {
  try {
    const response: AxiosResponse<SubmissionResponse> = await axios.get(
      `${serverConfig.SUBMISSION_SERVICE_URL}/submissions/${submissionId}`,
    );

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    logger.error("Error fetching submission", error);
    return null;
  }
}
