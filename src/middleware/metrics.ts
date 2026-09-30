import type { Request, Response, NextFunction } from "express";

import {
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestErrors,
} from "../metrics/metrics.js";

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();

  res.once("finish", () => {
    const duration =
      Number(process.hrtime.bigint() - start) / 1_000_000_000;

    const method = req.method;

    const route =
      req.route?.path ??
      req.path;

    const statusCode = String(res.statusCode);

    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      duration
    );

    if (res.statusCode >= 400) {
      httpRequestErrors.inc({
        method,
        route,
        status_code: statusCode,
      });
    }
  });

  next();
}