// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";
import path from "path";

type ServerConfig = {
  PORT: number;
  DB_URL: string;
  PROBLEM_SERVICE_URL: string;
  SUBMISSION_SERVICE_URL: string;
  SUBMISSION_SERVICE_TOKEN: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  JUDGE_MEMORY_MB: number;
  JUDGE_CPU_QUOTA: number;
  JUDGE_TIMEOUT_MS: number;
  JUDGE_WORKER_CONCURRENCY: number;
  JUDGE_RUNNER_MODE: "batch" | "legacy";
};

function loadEnv() {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3002,
  DB_URL: process.env.DB_URL || "",
  PROBLEM_SERVICE_URL:
    process.env.PROBLEM_SERVICE_URL || "http://localhost:3000/api/v1",
  SUBMISSION_SERVICE_URL:
    process.env.SUBMISSION_SERVICE_URL || "http://localhost:3001/api/v1",
  SUBMISSION_SERVICE_TOKEN: process.env.SUBMISSION_SERVICE_TOKEN || "",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  JUDGE_MEMORY_MB: Number(process.env.JUDGE_MEMORY_MB) || 256,
  JUDGE_CPU_QUOTA: Number(process.env.JUDGE_CPU_QUOTA) || 100000,
  JUDGE_TIMEOUT_MS: Number(process.env.JUDGE_TIMEOUT_MS) || 8000,
  JUDGE_WORKER_CONCURRENCY:
    Number(process.env.JUDGE_WORKER_CONCURRENCY) || 1,
  JUDGE_RUNNER_MODE:
    process.env.JUDGE_RUNNER_MODE === "legacy" ? "legacy" : "batch",
};
