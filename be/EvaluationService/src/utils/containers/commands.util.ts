const bashConfig = ["/bin/bash", "-c"];

export const commands = {
  python: function (code: string, input: string) {
    const runCommand = `echo '${code}' > code.py && echo '${input}' > input.txt && python3 code.py < input.txt`;
    return [...bashConfig, runCommand];
  },
  cpp: function (code: string, input: string) {
    const runCommand = `mkdir app && cd app && echo '${code}' > code.cpp && echo '${input}' > input.txt && g++ code.cpp -o run && ./run < input.txt`;
    return [...bashConfig, runCommand];
  },
};
