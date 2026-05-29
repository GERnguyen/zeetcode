import dotenv from "dotenv";

type ServerConfig = {
  PORT: number;
  DB_URL: string;
  PROBLEM_SERVICE_URL: string;
  SUBMISSION_SERVICE_URL: string;
  JWT_ACCESS_SECRET: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  MATCHMAKING_INTERVAL_MS: number;
  DEFAULT_ELO: number;
};

function loadEnv() {
  dotenv.config();
  console.log("Environment variables loaded");
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3004,
  DB_URL: process.env.DB_URL || "",
  PROBLEM_SERVICE_URL:
    process.env.PROBLEM_SERVICE_URL || "http://localhost:3000/api/v1",
  SUBMISSION_SERVICE_URL:
    process.env.SUBMISSION_SERVICE_URL || "http://localhost:3001/api/v1",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  MATCHMAKING_INTERVAL_MS: Number(process.env.MATCHMAKING_INTERVAL_MS) || 2000,
  DEFAULT_ELO: Number(process.env.DEFAULT_ELO) || 300,
};
