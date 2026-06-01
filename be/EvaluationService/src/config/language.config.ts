import { CPP_IMAGE, PYTHON_IMAGE } from "../utils/constants";
import { serverConfig } from ".";

export const LANGUAGE_CONFIG = {
    python: {
        timeout: serverConfig.JUDGE_TIMEOUT_MS,
        imageName: PYTHON_IMAGE
    },
    cpp: {
        timeout: serverConfig.JUDGE_TIMEOUT_MS,
        imageName: CPP_IMAGE
    }
}
