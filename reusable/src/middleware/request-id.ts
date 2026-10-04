import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId =
    (req.headers["x-request-id"] as string) || randomUUID();

  req.headers["x-request-id"] = requestId;

   req.requestId = requestId;

  res.setHeader("X-Request-ID", requestId);

  next();
}