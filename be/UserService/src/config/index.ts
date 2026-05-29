// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";
import type { StringValue } from "ms";

type ServerConfig = {
  PORT: number;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: StringValue;
  JWT_REFRESH_EXPIRES_IN: StringValue;
  BCRYPT_SALT_ROUNDS: number;
  EMAIL_TOKEN_EXPIRES_MINUTES: number;
  MAIL_USER: string;
  MAIL_PASS: string;
  MAIL_FROM: string;
  FRONTEND_URL: string;
  DATABASE_URL: string;
  DIRECT_URL: string;
  INTERNAL_SERVICE_TOKEN: string;
};

function loadEnv() {
  dotenv.config();
  console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3001,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "default_access_secret",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
  JWT_ACCESS_EXPIRES_IN:
    (process.env.JWT_ACCESS_EXPIRES_IN as StringValue) || "15m",
  JWT_REFRESH_EXPIRES_IN:
    (process.env.JWT_REFRESH_EXPIRES_IN as StringValue) || "7d",
  BCRYPT_SALT_ROUNDS: Number(process.env.SALT_ROUNDS) || 10,
  EMAIL_TOKEN_EXPIRES_MINUTES:
    Number(process.env.EMAIL_TOKEN_EXPIRES_MINUTES) || 30,
  MAIL_USER: process.env.MAIL_USER || "",
  MAIL_PASS: process.env.MAIL_PASS || "",
  MAIL_FROM: process.env.MAIL_FROM || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  DIRECT_URL:
    process.env.DIRECT_URL || "postgresql://user:password@localhost:5432/mydb",
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://user:password@localhost:5432/mydb",
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || "",
};
