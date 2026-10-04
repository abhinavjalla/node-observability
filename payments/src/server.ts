import express from "express";
import { createRequire } from "node:module";
import { pool } from "./db.js";
import { SpanStatusCode } from "@opentelemetry/api";

import {
  logger,
  requestIdMiddleware,
  metricsMiddleware,
  register,
  tracer,
  httpLoggerMiddleware
} from "@node-observability/reusable";

const require = createRequire(import.meta.url);


const app = express();

app.use(express.json());

// Request ID
app.use(requestIdMiddleware);

// HTTP logging
app.use(httpLoggerMiddleware);

// Prometheus metrics
app.use(metricsMiddleware);

// Health endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
  });
});

app.get("/db-time", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT NOW() AS current_time
    `);

    res.json({
      service: "payments",
      databaseTime: result.rows[0].current_time
    });
  } catch (error) {
    req.log.error(
      {
        error,
      },
      "Failed to fetch database time"
    );

    res.status(500).json({
      error: "Failed to fetch database time"
    });
  }
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);

  res.end(await register.metrics());
});

const PORT = 4000;

app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
    },
    "Server started"
  );
});