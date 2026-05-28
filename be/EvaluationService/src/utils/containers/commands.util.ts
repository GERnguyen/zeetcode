const bashConfig = ["/bin/bash", "-c"];

export const commands = {
  python: function (code: string, input: string) {
    const runCommand = `echo '${code}' > code.py && echo '${input}' > input.txt && echo '__JUDGE_STAGE__:compile' && python3 -m py_compile code.py && echo '__JUDGE_STAGE__:run' && python3 code.py < input.txt`;
    return [...bashConfig, runCommand];
  },
  cpp: function (code: string, input: string) {
    const runCommand = `mkdir app && cd app && echo '${code}' > code.cpp && echo '${input}' > input.txt && echo '__JUDGE_STAGE__:compile' && g++ code.cpp -o run && echo '__JUDGE_STAGE__:run' && ./run < input.txt`;
    return [...bashConfig, runCommand];
  },
};
