import "express";
import "pino-http";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}