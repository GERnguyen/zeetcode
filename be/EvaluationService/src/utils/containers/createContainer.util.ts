import logger from "../../config/logger.config";
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
        CpuQuota: 50000, // Limit CPU usage to 50% of a single CPU core
        CpuPeriod: 100000, // Set the CPU period to 100ms
        SecurityOpt: ["no-new-privileges"], // Prevent privilege escalation
        NetworkMode: "none", // Disable networking for the container
      },
      OpenStdin: true, // keep stdin open to allow interaction with the container
      AttachStdin: true,
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
