import "express";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: import("pino").Logger;
    }
  }
}

export {};