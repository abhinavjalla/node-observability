import client from "prom-client";

// Collect Node.js default metrics:
// CPU, memory, event loop, GC, etc.
client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
});

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,

  buckets: [
    0.01,  // 10ms
    0.05,  // 50ms
    0.1,   // 100ms
    0.25,  // 250ms
    0.5,   // 500ms
    1,     // 1 second
  ],
});

export const httpRequestErrors = new client.Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP requests resulting in errors",
  labelNames: ["method", "route", "status_code"] as const,
});

export const register = client.register;