import axios, { AxiosResponse } from "axios";
import { serverConfig } from "../config";
import { InternalServerError } from "../utils/errors/app.error";
import logger from "../config/logger.config";

export interface ITestCase {
  input: string;
  output: string;
}

export interface IProblemDetails {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  tags: string[];
  isForBattle?: boolean;
  createdAt: Date;
  updatedAt: Date;
  editorial?: string;
  testcases: ITestCase[];
}

export interface IProblemResponse {
  message: string;
  success: boolean;
  data: IProblemDetails | IProblemDetails[];
}

export interface IProblemBatchLookupResponse {
  message: string;
  success: boolean;
  data: IProblemDetails[];
}

export async function getProblemById(
  problemId: string,
): Promise<IProblemDetails | null> {
  try {
    const response: AxiosResponse<IProblemResponse> = await axios.get(
      `${serverConfig.PROBLEM_SERVICE_URL}/problems/${problemId}/judge`,
      {
        headers: {
          "x-service-token": serverConfig.PROBLEM_SERVICE_TOKEN,
        },
      },
    );
    if (response.data.success) {
      return response.data.data as IProblemDetails;
    }

    throw new InternalServerError(
      `Failed to fetch problem with ID ${problemId}: ${response.data.message}`,
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    logger.error(`Error fetching problem with ID ${problemId}:`, error);
    throw new InternalServerError(
      `Failed to fetch problem with ID ${problemId}`,
    );
  }
}

export async function getProblemsByIds(
  ids: string[],
): Promise<IProblemDetails[]> {
  if (ids.length === 0) {
    return [];
  }

  try {
    const response: AxiosResponse<IProblemBatchLookupResponse> =
      await axios.post(`${serverConfig.PROBLEM_SERVICE_URL}/problems/batch`, {
        ids,
      });

    if (response.data.success) {
      return response.data.data;
    }

    throw new InternalServerError("Failed to fetch problems by ids");
  } catch (error) {
    logger.error("Error fetching problems by ids:", error);
    throw new InternalServerError("Failed to fetch problems by ids");
  }
}
