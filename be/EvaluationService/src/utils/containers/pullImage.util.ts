import Docker from "dockerode";
import { CPP_IMAGE, PYTHON_IMAGE } from "../constants";
import logger from "../../config/logger.config";

export async function pullImage(imageName: string) {
  const docker = new Docker();

  return new Promise<void>((resolve, reject) => {
    docker.pull(imageName, (err: Error, stream: NodeJS.ReadableStream) => {
      if (err) {
        reject(err);
        return;
      }

      docker.modem.followProgress(stream, onFinished, onProgress);

      function onFinished(err: Error | null, output: any) {
        if (err) {
          reject(err);
        } else {
          resolve(output);
        }
      }

      function onProgress(event: any) {
        console.log(event.status);
      }
    });
  });
}

export async function pullAllImages() {
    const images = [PYTHON_IMAGE, CPP_IMAGE]

    // paralelly pull all images
    const promises = images.map(image => pullImage(image));

    try {
        const results = await Promise.allSettled(promises);
        logger.info("Image pull results:", results);    
    } catch (error) {
        logger.error("Error pulling images:", error);
    }
    
}
