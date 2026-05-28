import { InternalServerError } from "../errors/app.error";
import { commands } from "./commands.util";
import { createNewDockerContainer } from "./createContainer.util";

const allowListedLanguage = ["python", "cpp"];
const stageMarkerPrefix = "__JUDGE_STAGE__:";

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
    memoryLimit: 1024 * 1024 * 1024, // 1GB
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

  const containerLogs = processLogs(logs);
  const errorStage = determineErrorStage(containerLogs);
  const runtimeMs = Date.now() - startedAt;

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

function processLogs(logs: Buffer | undefined) {
  const normalizedLogs = logs?.toString("utf8") ?? "";

  return normalizedLogs
    .replace(/\x00/g, "") // Remove null bytes
    .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "") // Remove control characters except \n (0x0A)
    .split("\n")
    .filter((line) => !line.startsWith(stageMarkerPrefix))
    .join("\n")
    .trim();
}

function determineErrorStage(logs: string) {
  return logs.includes(`${stageMarkerPrefix}run`)
    ? ("runtime" as const)
    : ("compile" as const);
}
