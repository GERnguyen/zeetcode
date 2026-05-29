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

type TestCaseResultStatus = "AC" | "WA" | "TLE" | "RE" | "CE" | "BLOCKED";

function normalizeForJudge(output: string): string {
  return output
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trimEnd();
}

async function evaluateTestCasesSequentially(
  code: string,
  language: EvaluationJob["language"],
  testCases: TestCase[],
) {
  const testCaseResults: Record<string, TestCaseResultStatus> = {};
  const totalTests = testCases.length;
  let passedTests = 0;
  let runtimeMs = 0;
  let verdict: "AC" | "WA" | "TLE" | "RE" | "CE" = "AC";
  let rawErrorOutput: string | undefined;
  let errorStage: "compile" | "runtime" | undefined;

  for (let index = 0; index < testCases.length; index += 1) {
    const testCase = testCases[index];

    const result: EvaluationResult = await runCode({
      code,
      language,
      timeout: LANGUAGE_CONFIG[language].timeout,
      imageName: LANGUAGE_CONFIG[language].imageName,
      input: testCase.input,
    });
    runtimeMs += result.runtimeMs;

    if (result.status === "success") {
      const normalizedActual = normalizeForJudge(result.output);
      const normalizedExpected = normalizeForJudge(testCase.output);

      if (normalizedActual === normalizedExpected) {
        testCaseResults[testCase._id] = "AC";
        passedTests += 1;
      } else {
        testCaseResults[testCase._id] = "WA";
        verdict = "WA";
      }
      continue;
    }

    if (result.status === "Time Limit Exceeded") {
      testCaseResults[testCase._id] = "TLE";
      verdict = "TLE";
      for (
        let blockedIndex = index + 1;
        blockedIndex < testCases.length;
        blockedIndex += 1
      ) {
        testCaseResults[testCases[blockedIndex]._id] = "BLOCKED";
      }
      break;
    }

    errorStage = result.errorStage ?? "runtime";
    rawErrorOutput = result.output;
    verdict = errorStage === "compile" ? "CE" : "RE";
    testCaseResults[testCase._id] = verdict;

    for (
      let blockedIndex = index + 1;
      blockedIndex < testCases.length;
      blockedIndex += 1
    ) {
      testCaseResults[testCases[blockedIndex]._id] = "BLOCKED";
    }
    break;
  }

  return {
    verdict,
    testCaseResults,
    passedTests,
    totalTests,
    runtimeMs,
    rawErrorOutput,
    errorStage,
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

        const output = await evaluateTestCasesSequentially(
          data.code,
          data.language,
          data.problem.testcases,
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
            runtimeMs: output.runtimeMs,
            rawErrorOutput: output.rawErrorOutput,
            errorStage: output.errorStage,
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
            rawErrorOutput:
              error instanceof Error
                ? (error.stack ?? error.message)
                : "Evaluation failed",
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
