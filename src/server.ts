import express from "express";
import { createRequire } from "node:module";

import { logger } from "./logger.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { metricsMiddleware } from "./middleware/metrics.js";
import { register } from "./metrics/metrics.js";
import { tracer } from "./tracing.js";

const require = createRequire(import.meta.url);

const pinoHttp = require("pino-http");

const app = express();

app.use(express.json());

// Request ID
app.use(requestIdMiddleware);

// HTTP logging
app.use(
  pinoHttp({
    logger,
  })
);

// Prometheus metrics
app.use(metricsMiddleware);

// Health endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
  });
});

// User endpoint
app.get("/users/:id", async (req, res) => {
  console.log("Creating get-user span");

  const span = tracer.startSpan("get-user");

  console.log("Span created:", span.spanContext());

  try {
    const userId = req.params.id;

    span.setAttribute("user.id", userId);

    req.log.info("Fetching user");

    res.json({
      id: userId,
      name: "John",
      email: "john@example.com",
    });
  } finally {
    span.end();

    console.log("Span ended");
  }
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);

  res.end(await register.metrics());
});

const PORT = 3000;

app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
    },
    "Server started"
  );
});