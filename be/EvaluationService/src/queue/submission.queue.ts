import { Queue } from "bullmq";
import { createNewRedisConnection } from "../config/redis.config";
import logger from "../config/logger.config";
import { SUBMISSION_QUEUE } from "../utils/constants";

export const submissionQueue = new Queue(SUBMISSION_QUEUE, {
  connection: createNewRedisConnection(),
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: "exponential",
      delay: 2000, // Initial delay of 2 seconds between retries
    },
  },
});

submissionQueue.on("error", (err) => {
  logger.error("Submission queue error:", err);
});

submissionQueue.on("waiting", (job) => {
  logger.info(`Job ${job.id} is waiting to be processed`);
});
