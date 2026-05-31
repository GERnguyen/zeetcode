import Redis from "ioredis";
import { serverConfig } from "./index";

export const redis = new Redis({
  host: serverConfig.REDIS_HOST,
  port: serverConfig.REDIS_PORT,
});
