// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";
import path from "path";

type ServerConfig = {
  PORT: number;
  DB_URL: string;
  PROBLEM_SERVICE_URL: string;
  PROBLEM_SERVICE_TOKEN: string;
  JWT_ACCESS_SECRET: string;
  INTERNAL_SERVICE_TOKEN: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
};

function loadEnv() {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3001,
  DB_URL: process.env.DB_URL || "",
  PROBLEM_SERVICE_URL:
    process.env.PROBLEM_SERVICE_URL || "http://localhost:3000/api/v1",
  PROBLEM_SERVICE_TOKEN: process.env.PROBLEM_SERVICE_TOKEN || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || "",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
};
