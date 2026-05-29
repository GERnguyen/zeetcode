import axios, { AxiosResponse } from "axios";
import { serverConfig } from "../config";
import logger from "../config/logger.config";
import { InternalServerError } from "../utils/errors/app.error";

export type UserEloResponse = {
  success: boolean;
  data: {
    id: string;
    eloRating: number;
  };
};

const serviceHeaders = () => ({
  "x-service-token": serverConfig.USER_SERVICE_TOKEN,
});

export async function getUserElo(userId: string): Promise<number> {
  try {
    const response: AxiosResponse<UserEloResponse> = await axios.get(
      `${serverConfig.USER_SERVICE_URL}/users/${userId}/elo`,
      { headers: serviceHeaders() },
    );

    if (response.data.success) {
      return response.data.data.eloRating;
    }

    throw new InternalServerError("Failed to get user elo");
  } catch (error) {
    logger.error("Error fetching user elo", error);
    throw new InternalServerError("Failed to get user elo");
  }
}

export async function updateUserElo(
  userId: string,
  delta: number,
): Promise<number> {
  try {
    const response: AxiosResponse<UserEloResponse> = await axios.patch(
      `${serverConfig.USER_SERVICE_URL}/users/${userId}/elo`,
      { delta },
      { headers: serviceHeaders() },
    );

    if (response.data.success) {
      return response.data.data.eloRating;
    }

    throw new InternalServerError("Failed to update user elo");
  } catch (error) {
    logger.error("Error updating user elo", error);
    throw new InternalServerError("Failed to update user elo");
  }
}
