import express from "express";
import { serverConfig } from "./config";
import v1Router from "./routers/v1/index.router";
import v2Router from "./routers/v2/index.router";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";
import logger from "./config/logger.config";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware";
import { startWorkers } from "./workers/evaluation.worker";
import { pullAllImages } from "./utils/containers/pullImage.util";
import { runCode } from "./utils/containers/codeRunner.util";
import { CPP_IMAGE } from "./utils/constants";
const app = express();

app.use(express.json());

/**
 * Registering all the routers and their corresponding routes with out app server object.
 */

app.use(attachCorrelationIdMiddleware);
app.use("/api/v1", v1Router);
app.use("/api/v2", v2Router);

/**
 * Add the error handler middleware
 */

app.use(appErrorHandler);
app.use(genericErrorHandler);

app.listen(serverConfig.PORT, async () => {
  logger.info(`Server is running on http://localhost:${serverConfig.PORT}`);
  logger.info(`Press Ctrl+C to stop the server.`);
  await startWorkers();
  logger.info(`Background workers started successfully.`);

  await pullAllImages();
  console.log("Image pulled successfully!");

  await testCppCode();
});

// async function testPyThonCode() {
//   const pythonCode = `

// import time
// i = 0
// while True:
//     i += 1
//     print(i)
//     time.sleep(1)

// print("Bye")
//     `;
//   // 1. Take the python code and dump in a file and run the python file in the container

//   await runCode({
//     code: pythonCode,
//     language: "python",
//     timeout: 3000, // 10 seconds
//   });
// }

async function testCppCode() {
  const cppCode = `
#include<iostream>

int main() {
    std::cout<<"Hello world"<<std::endl;

    for(int i = 0; i < 10; i++) {
        std::cout<<i<<std::endl;
    }
        return 0;
}`;
  await runCode({
    code: cppCode,
    language: "cpp",
    timeout: 1000,
    imageName: CPP_IMAGE,
  });
}
