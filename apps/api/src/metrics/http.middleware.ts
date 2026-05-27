import type { Request, Response, NextFunction } from "express";
import { httpRequestDuration, httpRequestsTotal } from "./registry.js";

/**
 * Express middleware that records HTTP request duration and total count per route.
 * Uses `res.on('finish')` so timing includes the full response write, and
 * `process.hrtime.bigint()` for nanosecond precision with no I/O overhead.
 */
export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = (req.route?.path as string | undefined) ?? req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestsTotal.inc(labels);
  });

  next();
}
