import dotenv from "dotenv";
import path from "path";

type ServerConfig = {
  PORT: number;
  DB_URL: string;
  PROBLEM_SERVICE_URL: string;
  PROBLEM_SERVICE_TOKEN: string;
  SUBMISSION_SERVICE_URL: string;
  USER_SERVICE_URL: string;
  USER_SERVICE_TOKEN: string;
  JWT_ACCESS_SECRET: string;
  FRONTEND_ORIGIN: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  MATCHMAKING_INTERVAL_MS: number;
};

function loadEnv() {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  console.log("Environment variables loaded");
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3004,
  DB_URL: process.env.DB_URL || "",
  PROBLEM_SERVICE_URL:
    process.env.PROBLEM_SERVICE_URL || "http://localhost:3000/api/v1",
  PROBLEM_SERVICE_TOKEN: process.env.PROBLEM_SERVICE_TOKEN || "",
  SUBMISSION_SERVICE_URL:
    process.env.SUBMISSION_SERVICE_URL || "http://localhost:3001/api/v1",
  USER_SERVICE_URL:
    process.env.USER_SERVICE_URL || "http://localhost:3003/api/v1",
  USER_SERVICE_TOKEN: process.env.USER_SERVICE_TOKEN || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  MATCHMAKING_INTERVAL_MS: Number(process.env.MATCHMAKING_INTERVAL_MS) || 2000,
};
