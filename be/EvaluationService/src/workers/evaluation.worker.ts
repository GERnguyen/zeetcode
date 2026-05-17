import logger from "../config/logger.config";
import { SUBMISSION_QUEUE } from "../utils/constants";
import { Worker } from "bullmq";
import { createNewRedisConnection } from "../config/redis.config";

async function setupEvaluationWorker() {
    const worker = new Worker(SUBMISSION_QUEUE, async (job) => {
        logger.info(`Processing job ${job.id}`);
    }, {
        connection: createNewRedisConnection(),
    });

    worker.on("error", (err) => {
        logger.error("Evaluation worker error:", err);
    });

    worker.on("completed", (job) => {
        logger.info(`Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
        if (!job) {
            logger.error("Evaluation worker failed with unknown job error:", err);
            return;
        }
        logger.error(`Job ${job.id} failed with error:`, err);
    }); 

    logger.info("Evaluation worker setup complete");
}

export async function startWorkers() {
    await setupEvaluationWorker();

}