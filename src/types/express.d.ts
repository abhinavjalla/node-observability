import "express";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: {
        info: (obj: unknown, msg?: string, ...args: unknown[]) => void;
        error: (obj: unknown, msg?: string, ...args: unknown[]) => void;
        warn: (obj: unknown, msg?: string, ...args: unknown[]) => void;
        debug: (obj: unknown, msg?: string, ...args: unknown[]) => void;
      };
    }
  }
}

export {};