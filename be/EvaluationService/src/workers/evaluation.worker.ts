import logger from "../config/logger.config";
import { SUBMISSION_QUEUE } from "../utils/constants";
import { Job, Worker } from "bullmq";
import { createNewRedisConnection } from "../config/redis.config";
import {
  EvaluationJob,
  EvaluationResult,
  TestCase,
} from "../interfaces/evaluation.interface";
import { runCode } from "../utils/containers/codeRunner.util";
import { LANGUAGE_CONFIG } from "../config/language.config";
import { updateSubmission } from "../api/submission.api";

function matchTestCasesWithResults(
  testCases: TestCase[],
  results: EvaluationResult[],
) {
  const output: Record<string, string> = {};
  if (results.length !== testCases.length) {
    console.log("WA");
    return;
  }
  testCases.map((testCase, index) => {
    let retval = "";
    if (results[index].status === "time_limit_exceeded") {
      retval = "TLE";
    } else if (results[index].status === "failed") {
      retval = "Error";
    } else {
      // match the output with the test case output
      if (results[index].output === testCase.output) {
        retval = "AC";
      } else {
        retval = "WA";
      }
    }

    console.log("retval", retval);
    output[testCase._id] = retval;
  });

  return output;
}

async function setupEvaluationWorker() {
  const worker = new Worker(
    SUBMISSION_QUEUE,
    async (job: Job) => {
      logger.info(`Processing job ${job.id}`);
      const data: EvaluationJob = job.data;

      console.log("data", data);
      console.log("data.problem.testcases", data.problem.testcases);

      try {
        const testCasesRunnerPromise = data.problem.testcases.map(
          (testcase) => {
            return runCode({
              code: data.code,
              language: data.language,
              timeout: LANGUAGE_CONFIG[data.language].timeout,
              imageName: LANGUAGE_CONFIG[data.language].imageName,
              input: testcase.input,
            });
          },
        );

        const testCasesRunnerResults: EvaluationResult[] = await Promise.all(
          testCasesRunnerPromise,
        );

        console.log("testCasesRunnerResults", testCasesRunnerResults);

        const output = matchTestCasesWithResults(
          data.problem.testcases,
          testCasesRunnerResults,
        );

        console.log("output", output);

        await updateSubmission(data.submissionId, "completed", output || {});
      } catch (error) {
        logger.error(`Evaluation job failed: ${job}`, error);
        return;
      }
    },
    {
      connection: createNewRedisConnection(),
    },
  );

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
