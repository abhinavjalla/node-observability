import { createRequire } from "node:module";
import { logger } from "../logger.js";

const require = createRequire(import.meta.url);
const pinoHttp = require("pino-http");

export const httpLoggerMiddleware = pinoHttp({
  logger
});