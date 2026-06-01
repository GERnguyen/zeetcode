import logger from "../../config/logger.config";
import { serverConfig } from "../../config";
import Docker from "dockerode";

export interface CreateContainerOptions {
  imageName: string;
  cmdExecutable: string[];
  memoryLimit?: number;
}

export async function createNewDockerContainer(
  options: CreateContainerOptions,
) {
  try {
    const docker = new Docker();
    const container = await docker.createContainer({
      Image: options.imageName,
      Cmd: options.cmdExecutable,
      HostConfig: {
        Memory: options.memoryLimit,
        PidsLimit: 100,
        CpuQuota: serverConfig.JUDGE_CPU_QUOTA,
        CpuPeriod: 100000, // Set the CPU period to 100ms
        SecurityOpt: ["no-new-privileges"], // Prevent privilege escalation
        NetworkMode: "none", // Disable networking for the container
      },
      OpenStdin: false,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
    });

    logger.info(`Docker container created with ID: ${container.id}`);

    return container;
  } catch (error) {
    logger.error("Error creating Docker container:", error);
    return null;
  }
}
