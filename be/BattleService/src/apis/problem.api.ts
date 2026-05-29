import axios, { AxiosResponse } from "axios";
import { serverConfig } from "../config";
import logger from "../config/logger.config";
import { InternalServerError } from "../utils/errors/app.error";
import { BattleDifficulty } from "../models/battle-room.model";

export interface IProblemDetails {
  id: string;
  title: string;
  description: string;
  difficulty: BattleDifficulty;
  category: string;
  tags: string[];
  isForBattle?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ProblemListResponse = {
  message: string;
  success: boolean;
  data: IProblemDetails[];
};

export async function getProblemsByDifficulty(
  difficulty: BattleDifficulty,
): Promise<IProblemDetails[]> {
  try {
    const response: AxiosResponse<ProblemListResponse> = await axios.get(
      `${serverConfig.PROBLEM_SERVICE_URL}/problems/difficulty/${difficulty}`,
    );

    if (response.data.success) {
      return response.data.data;
    }

    throw new InternalServerError("Failed to fetch problems by difficulty");
  } catch (error) {
    logger.error("Error fetching problems by difficulty", error);
    throw new InternalServerError("Failed to fetch problems by difficulty");
  }
}
