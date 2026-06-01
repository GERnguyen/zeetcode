import { serverConfig } from "../../config";
import { LANGUAGE_CONFIG } from "../../config/language.config";
import { EvaluationJob, TestCase } from "../../interfaces/evaluation.interface";
import { createNewDockerContainer } from "./createContainer.util";

type TestCaseResultStatus = "AC" | "WA" | "TLE" | "RE" | "CE" | "BLOCKED";

type Verdict = "AC" | "WA" | "TLE" | "RE" | "CE";

export interface BatchEvaluationOutput {
  verdict: Verdict;
  testCaseResults: Record<string, TestCaseResultStatus>;
  passedTests: number;
  totalTests: number;
  runtimeMs: number;
  rawErrorOutput?: string;
  errorStage?: "compile" | "runtime";
}

type CaseRunResult = {
  index: number;
  exitCode: number;
  runtimeMs: number;
  stdout: string;
  stderr: string;
};

const compileErrorMarkerPrefix = "__JUDGE_COMPILE_ERROR_B64__:";
const caseRuntimeMarkerPrefix = "__JUDGE_CASE_RUNTIME_MS__:";
const caseExitMarkerPrefix = "__JUDGE_CASE_EXIT_CODE__:";
const caseStdoutMarkerPrefix = "__JUDGE_CASE_STDOUT_B64__:";
const caseStderrMarkerPrefix = "__JUDGE_CASE_STDERR_B64__:";

const bashConfig = ["/bin/bash", "-c"];

const writeFile = (fileName: string, content: string, label: string) => {
  const delimiter = `__JUDGE_EOF_${label}_${Math.random()
    .toString(36)
    .slice(2)}__`;

  return `cat <<'${delimiter}' > ${fileName}\n${content}\n${delimiter}`;
};

export async function runSubmissionInSingleContainer(options: {
  code: string;
  language: EvaluationJob["language"];
  testCases: TestCase[];
}): Promise<BatchEvaluationOutput> {
  const { code, language, testCases } = options;
  const languageConfig = LANGUAGE_CONFIG[language];
  const container = await createNewDockerContainer({
    imageName: languageConfig.imageName,
    cmdExecutable: buildBatchCommand(code, language, testCases, languageConfig.timeout),
    memoryLimit: serverConfig.JUDGE_MEMORY_MB * 1024 * 1024,
  });

  const outerTimeoutMs = Math.max(
    languageConfig.timeout * Math.max(testCases.length, 1) + 10000,
    15000,
  );
  let isContainerTimedOut = false;

  const killTimer = setTimeout(() => {
    isContainerTimedOut = true;
    container?.kill().catch(() => undefined);
  }, outerTimeoutMs);

  try {
    await container?.start();
    await container?.wait();

    const logs = await container?.logs({
      stdout: true,
      stderr: true,
    });
    const rawLogs = logs?.toString("utf8") ?? "";

    if (isContainerTimedOut) {
      return buildContainerTimeoutResult(testCases, outerTimeoutMs);
    }

    return buildEvaluationResult(rawLogs, testCases);
  } finally {
    clearTimeout(killTimer);
    await container?.remove({ force: true }).catch(() => undefined);
  }
}

function buildBatchCommand(
  code: string,
  language: EvaluationJob["language"],
  testCases: TestCase[],
  timeoutMs: number,
) {
  const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
  const runCommand = [
    "set -e",
    "mkdir -p /tmp/zeetcode/tests",
    "cd /tmp/zeetcode",
    writeFile(language === "cpp" ? "code.cpp" : "code.py", code, "CODE"),
    ...testCases.flatMap((testCase, index) => [
      writeFile(`tests/input_${index}.txt`, testCase.input, `INPUT_${index}`),
    ]),
    "echo '__JUDGE_STAGE__:compile'",
    "set +e",
    `${buildCompileCommand(language, timeoutSeconds)} 2> compile.err`,
    "compile_status=$?",
    "set -e",
    "if [ \"$compile_status\" -ne 0 ]; then",
    `  echo '${compileErrorMarkerPrefix}'$(base64 -w 0 compile.err)`,
    "  exit 0",
    "fi",
    "echo '__JUDGE_STAGE__:run'",
    ...testCases.flatMap((_, index) => buildCaseCommand(index, language, timeoutSeconds)),
  ].join("\n");

  return [...bashConfig, runCommand];
}

function buildCompileCommand(language: EvaluationJob["language"], timeoutSeconds: number) {
  if (language === "cpp") {
    return `timeout ${timeoutSeconds}s g++ code.cpp -O2 -std=c++17 -o run`;
  }

  return `timeout ${timeoutSeconds}s python3 -m py_compile code.py`;
}

function buildRuntimeCommand(language: EvaluationJob["language"]) {
  return language === "cpp" ? "./run" : "python3 code.py";
}

function buildCaseCommand(
  index: number,
  language: EvaluationJob["language"],
  timeoutSeconds: number,
) {
  return [
    `start_ns=$(date +%s%N)`,
    "set +e",
    `timeout ${timeoutSeconds}s ${buildRuntimeCommand(language)} < tests/input_${index}.txt > tests/out_${index}.txt 2> tests/err_${index}.txt`,
    "case_status=$?",
    "set -e",
    `end_ns=$(date +%s%N)`,
    `echo '${caseRuntimeMarkerPrefix}${index}:'$(((end_ns - start_ns) / 1000000))`,
    `echo '${caseExitMarkerPrefix}${index}:'$case_status`,
    `echo '${caseStdoutMarkerPrefix}${index}:'$(base64 -w 0 tests/out_${index}.txt)`,
    `echo '${caseStderrMarkerPrefix}${index}:'$(base64 -w 0 tests/err_${index}.txt)`,
    "if [ \"$case_status\" -ne 0 ]; then",
    "  exit 0",
    "fi",
  ];
}

function buildEvaluationResult(
  rawLogs: string,
  testCases: TestCase[],
): BatchEvaluationOutput {
  const compileError = extractCompileError(rawLogs);
  if (compileError !== undefined) {
    return {
      verdict: "CE",
      testCaseResults: markAll(testCases, "CE"),
      passedTests: 0,
      totalTests: testCases.length,
      runtimeMs: 0,
      rawErrorOutput: compileError,
      errorStage: "compile",
    };
  }

  const caseResults = extractCaseResults(rawLogs);
  const testCaseResults: Record<string, TestCaseResultStatus> = {};
  let verdict: Verdict = "AC";
  let passedTests = 0;
  let runtimeMs = 0;
  let rawErrorOutput: string | undefined;
  let errorStage: "runtime" | undefined;

  for (let index = 0; index < testCases.length; index += 1) {
    const testCase = testCases[index];
    const result = caseResults.get(index);

    if (!result) {
      testCaseResults[testCase._id] = "BLOCKED";
      continue;
    }

    runtimeMs += result.runtimeMs;

    if (isTimeoutExitCode(result.exitCode)) {
      testCaseResults[testCase._id] = "TLE";
      verdict = "TLE";
      rawErrorOutput = result.stderr || "Time Limit Exceeded";
      errorStage = "runtime";
      markRemainingAsBlocked(testCaseResults, testCases, index + 1);
      break;
    }

    if (result.exitCode !== 0) {
      testCaseResults[testCase._id] = "RE";
      verdict = "RE";
      rawErrorOutput = result.stderr || result.stdout || "Runtime Error";
      errorStage = "runtime";
      markRemainingAsBlocked(testCaseResults, testCases, index + 1);
      break;
    }

    if (normalizeForJudge(result.stdout) === normalizeForJudge(testCase.output)) {
      testCaseResults[testCase._id] = "AC";
      passedTests += 1;
      continue;
    }

    testCaseResults[testCase._id] = "WA";
    verdict = "WA";
  }

  return {
    verdict,
    testCaseResults,
    passedTests,
    totalTests: testCases.length,
    runtimeMs,
    rawErrorOutput,
    errorStage,
  };
}

function buildContainerTimeoutResult(
  testCases: TestCase[],
  runtimeMs: number,
): BatchEvaluationOutput {
  const testCaseResults: Record<string, TestCaseResultStatus> = {};
  if (testCases[0]) {
    testCaseResults[testCases[0]._id] = "TLE";
  }
  markRemainingAsBlocked(testCaseResults, testCases, 1);

  return {
    verdict: "TLE",
    testCaseResults,
    passedTests: 0,
    totalTests: testCases.length,
    runtimeMs,
    rawErrorOutput: "Time Limit Exceeded",
    errorStage: "runtime",
  };
}

function extractCompileError(rawLogs: string) {
  const line = rawLogs.split("\n").map(sanitizeLogLine).find((value) => {
    return value.includes(compileErrorMarkerPrefix);
  });

  if (!line) {
    return undefined;
  }

  const markerIndex = line.indexOf(compileErrorMarkerPrefix);
  return decodeBase64(line.slice(markerIndex + compileErrorMarkerPrefix.length));
}

function extractCaseResults(rawLogs: string) {
  const results = new Map<number, Partial<CaseRunResult>>();

  for (const rawLine of rawLogs.split("\n")) {
    const line = sanitizeLogLine(rawLine);
    collectCaseNumberValue(line, caseRuntimeMarkerPrefix, results, (result, value) => {
      result.runtimeMs = Number(value) || 0;
    });
    collectCaseNumberValue(line, caseExitMarkerPrefix, results, (result, value) => {
      result.exitCode = Number(value) || 0;
    });
    collectCaseNumberValue(line, caseStdoutMarkerPrefix, results, (result, value) => {
      result.stdout = decodeBase64(value);
    });
    collectCaseNumberValue(line, caseStderrMarkerPrefix, results, (result, value) => {
      result.stderr = decodeBase64(value);
    });
  }

  const completeResults = new Map<number, CaseRunResult>();
  for (const [index, result] of results.entries()) {
    if (result.exitCode === undefined || result.runtimeMs === undefined) {
      continue;
    }

    completeResults.set(index, {
      index,
      exitCode: result.exitCode,
      runtimeMs: result.runtimeMs,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    });
  }

  return completeResults;
}

function collectCaseNumberValue(
  line: string,
  prefix: string,
  results: Map<number, Partial<CaseRunResult>>,
  apply: (result: Partial<CaseRunResult>, value: string) => void,
) {
  const prefixIndex = line.indexOf(prefix);
  if (prefixIndex === -1) {
    return;
  }

  const payload = line.slice(prefixIndex + prefix.length);
  const separatorIndex = payload.indexOf(":");
  if (separatorIndex === -1) {
    return;
  }

  const index = Number(payload.slice(0, separatorIndex));
  if (!Number.isInteger(index)) {
    return;
  }

  const value = payload.slice(separatorIndex + 1);
  const result = results.get(index) ?? { index };
  apply(result, value);
  results.set(index, result);
}

function decodeBase64(value: string) {
  return Buffer.from(value, "base64").toString("utf8");
}

function sanitizeLogLine(line: string) {
  return line
    .replace(/\x00/g, "")
    .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "");
}

function normalizeForJudge(output: string): string {
  return output
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trimEnd();
}

function isTimeoutExitCode(exitCode: number) {
  return exitCode === 124 || exitCode === 137 || exitCode === 143;
}

function markAll(testCases: TestCase[], status: TestCaseResultStatus) {
  return testCases.reduce<Record<string, TestCaseResultStatus>>((acc, testCase) => {
    acc[testCase._id] = status;
    return acc;
  }, {});
}

function markRemainingAsBlocked(
  testCaseResults: Record<string, TestCaseResultStatus>,
  testCases: TestCase[],
  startIndex: number,
) {
  for (let index = startIndex; index < testCases.length; index += 1) {
    testCaseResults[testCases[index]._id] = "BLOCKED";
  }
}
