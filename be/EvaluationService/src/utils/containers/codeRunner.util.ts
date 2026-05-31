import { InternalServerError } from "../errors/app.error";
import { serverConfig } from "../../config";
import { commands } from "./commands.util";
import { createNewDockerContainer } from "./createContainer.util";

const allowListedLanguage = ["python", "cpp"];
const stageMarkerPrefix = "__JUDGE_STAGE__:";
const runtimeMarkerPrefix = "__JUDGE_RUNTIME_MS__:";

export interface RunCodeResult {
  status: "success" | "Time Limit Exceeded" | "failed";
  output: string;
  runtimeMs: number;
  errorStage?: "compile" | "runtime";
}

export interface RunCodeOptions {
  code: string;
  language: "python" | "cpp";
  timeout: number;
  imageName: string;
  input: string;
}

export async function runCode(options: RunCodeOptions): Promise<RunCodeResult> {
  const { code, language, timeout, imageName, input } = options;

  if (!allowListedLanguage.includes(language)) {
    throw new InternalServerError(`Invalid language: ${language}`);
  }

  const container = await createNewDockerContainer({
    imageName: imageName,
    cmdExecutable: commands[language](code, input),
    memoryLimit: serverConfig.JUDGE_MEMORY_MB * 1024 * 1024,
  });

  let isTimeLimitExceeded = false;
  const startedAt = Date.now();

  const timeLimitExceededTimeout = setTimeout(() => {
    console.log("Time limit exceeded");
    isTimeLimitExceeded = true;
    container?.kill();
  }, timeout);

  console.log("Container created successfully", container?.id);

  await container?.start();

  const status = await container?.wait();

  if (isTimeLimitExceeded) {
    const runtimeMs = Date.now() - startedAt;
    await container?.remove();
    clearTimeout(timeLimitExceededTimeout);
    return {
      status: "Time Limit Exceeded",
      output: "Time Limit Exceeded",
      runtimeMs,
    };
  }

  const logs = await container?.logs({
    stdout: true,
    stderr: true,
  });

  const rawLogs = logs?.toString("utf8") ?? "";
  const measuredRuntimeMs = extractMeasuredRuntimeMs(rawLogs);
  const containerLogs = processLogs(rawLogs);
  const errorStage = determineErrorStage(rawLogs);
  const runtimeMs = measuredRuntimeMs ?? Date.now() - startedAt;

  await container?.remove();

  clearTimeout(timeLimitExceededTimeout);

  if (status.StatusCode == 0) {
    // success
    return {
      status: "success",
      output: containerLogs,
      runtimeMs,
    };
  } else {
    console.log("Container exited with error");
    return {
      status: "failed",
      output: containerLogs,
      runtimeMs,
      errorStage,
    };
  }
}

function processLogs(logs: string) {
  const normalizedLogs = logs;

  return normalizedLogs
    .replace(/\x00/g, "") // Remove null bytes
    .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "") // Remove control characters except \n (0x0A)
    .split("\n")
    .filter((line) => !line.startsWith(stageMarkerPrefix))
    .filter((line) => !line.startsWith(runtimeMarkerPrefix))
    .join("\n")
    .trim();
}

function extractMeasuredRuntimeMs(logs: string) {
  const runtimeLine = logs
    .split("\n")
    .find((line) => line.startsWith(runtimeMarkerPrefix));
  if (!runtimeLine) {
    return null;
  }

  const runtimeMs = Number(runtimeLine.slice(runtimeMarkerPrefix.length));
  return Number.isFinite(runtimeMs) ? runtimeMs : null;
}

function determineErrorStage(logs: string) {
  return logs.includes(`${stageMarkerPrefix}run`)
    ? ("runtime" as const)
    : ("compile" as const);
}
