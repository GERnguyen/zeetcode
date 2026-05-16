import axios, { AxiosResponse } from "axios";
import { serverConfig } from "../config";
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

export async function getProblemById(
  problemId: string,
): Promise<IProblemDetails | null> {
  try {
    const response: AxiosResponse<IProblemResponse> = await axios.get(
      `${serverConfig.PROBLEM_SERVICE_URL}/problems/${problemId}` 
    );
    if (response.data.success) {
        return response.data.data as IProblemDetails;
    }

    throw new Error(`Failed to fetch problem with ID ${problemId}: ${response.data.message}`);

  } catch (error) {
    logger.error(`Error fetching problem with ID ${problemId}:`, error);
    return null;
  }
}
