import mongoose from "mongoose";
import logger from "./logger.config";

const DB_CONNECT_RETRIES = Number(process.env.DB_CONNECT_RETRIES) || 5;
const DB_CONNECT_RETRY_DELAY_MS =
  Number(process.env.DB_CONNECT_RETRY_DELAY_MS) || 5000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async () => {
  const dbUrl = process.env.DB_URL || "";
  if (!dbUrl) {
    logger.error("DB_URL is not configured");
    process.exit(1);
  }

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connection is active");
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB connection re-established");
  });

  mongoose.connection.on("error", (err) => {
    logger.error(`MongoDB connection error: ${err}`);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB connection lost; mongoose will keep retrying");
  });

  for (let attempt = 1; attempt <= DB_CONNECT_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(dbUrl, {
        autoIndex: process.env.NODE_ENV !== "production",
        heartbeatFrequencyMS: 10000,
        maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 10,
        minPoolSize: Number(process.env.DB_MIN_POOL_SIZE) || 1,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });

      logger.info("Successfully connected to MongoDB");
      registerShutdownHandler();
      return;
    } catch (error) {
      logger.error(
        `Failed to connect to MongoDB on attempt ${attempt}/${DB_CONNECT_RETRIES}: ${error}`,
      );

      if (attempt === DB_CONNECT_RETRIES) {
        process.exit(1);
      }

      await sleep(DB_CONNECT_RETRY_DELAY_MS);
    }
  }
};

let shutdownHandlerRegistered = false;

function registerShutdownHandler() {
  if (shutdownHandlerRegistered) return;
  shutdownHandlerRegistered = true;

  const closeConnection = async (signal: string) => {
    await mongoose.connection.close();
    logger.info(`MongoDB connection closed after ${signal}`);
    process.exit(0);
  };

  process.once("SIGINT", () => closeConnection("SIGINT"));
  process.once("SIGTERM", () => closeConnection("SIGTERM"));
}
