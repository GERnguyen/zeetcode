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
  const testCaseResults: Record<string, string> = {};
  const totalTests = testCases.length;
  let passedTests = 0;

  if (results.length !== testCases.length) {
    return {
      verdict: "WA" as const,
      testCaseResults,
      passedTests: 0,
      totalTests,
    };
  }

  testCases.forEach((testCase, index) => {
    let caseVerdict = "WA";
    if (results[index].status === "Time Limit Exceeded") {
      caseVerdict = "TLE";
    } else if (results[index].status === "failed") {
      caseVerdict = "RE";
    } else if (results[index].output === testCase.output) {
      caseVerdict = "AC";
      passedTests += 1;
    }

    testCaseResults[testCase._id] = caseVerdict;
  });

  let verdict: "AC" | "WA" | "TLE" | "RE" = "AC";
  if (Object.values(testCaseResults).includes("RE")) {
    verdict = "RE";
  } else if (Object.values(testCaseResults).includes("TLE")) {
    verdict = "TLE";
  } else if (Object.values(testCaseResults).includes("WA")) {
    verdict = "WA";
  }

  return {
    verdict,
    testCaseResults,
    passedTests,
    totalTests,
  };
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
        await updateSubmission(data.submissionId, {
          status: "RUNNING",
        });

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

        await updateSubmission(data.submissionId, {
          status: "FINISHED",
          verdict: output.verdict,
          testCaseResults: output.testCaseResults,
          judgeMeta: {
            score: output.totalTests
              ? Number(
                  ((output.passedTests / output.totalTests) * 100).toFixed(2),
                )
              : 0,
            passedTests: output.passedTests,
            totalTests: output.totalTests,
            judgeVersion: "v1",
            judgedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error(`Evaluation job failed: ${job}`, error);
        await updateSubmission(data.submissionId, {
          status: "INTERNAL_ERROR",
          verdict: "RE",
          judgeMeta: {
            errorMessage:
              error instanceof Error ? error.message : "Evaluation failed",
            judgeVersion: "v1",
            judgedAt: new Date().toISOString(),
          },
        });
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
