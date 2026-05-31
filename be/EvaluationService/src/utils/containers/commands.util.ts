const bashConfig = ["/bin/bash", "-c"];
const runtimePrefix = "__JUDGE_RUNTIME_MS__:";

const writeFile = (fileName: string, content: string, label: string) => {
  const delimiter = `__JUDGE_EOF_${label}_${Math.random()
    .toString(36)
    .slice(2)}__`;

  return `cat <<'${delimiter}' > ${fileName}\n${content}\n${delimiter}`;
};

export const commands = {
  python: function (code: string, input: string) {
    const runCommand = [
      "set -e",
      writeFile("code.py", code, "PY_CODE"),
      writeFile("input.txt", input, "PY_INPUT"),
      "echo '__JUDGE_STAGE__:compile'",
      "python3 -m py_compile code.py",
      "echo '__JUDGE_STAGE__:run'",
      "start_ns=$(date +%s%N)",
      "set +e",
      "python3 code.py < input.txt",
      "status=$?",
      "set -e",
      "end_ns=$(date +%s%N)",
      `echo '${runtimePrefix}'$(((end_ns - start_ns) / 1000000))`,
      "exit $status",
    ].join("\n");

    return [...bashConfig, runCommand];
  },
  cpp: function (code: string, input: string) {
    const runCommand = [
      "set -e",
      "mkdir -p app",
      "cd app",
      writeFile("code.cpp", code, "CPP_CODE"),
      writeFile("input.txt", input, "CPP_INPUT"),
      "echo '__JUDGE_STAGE__:compile'",
      "g++ code.cpp -o run",
      "echo '__JUDGE_STAGE__:run'",
      "start_ns=$(date +%s%N)",
      "set +e",
      "./run < input.txt",
      "status=$?",
      "set -e",
      "end_ns=$(date +%s%N)",
      `echo '${runtimePrefix}'$(((end_ns - start_ns) / 1000000))`,
      "exit $status",
    ].join("\n");

    return [...bashConfig, runCommand];
  },
};
