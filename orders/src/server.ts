import express from "express";
import { createRequire } from "node:module";
import { faker } from "@faker-js/faker";
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

// User endpoint
app.get("/users/:id", async (req, res) => {
  console.log("Creating get-user span");

  const span = tracer.startSpan("get-user");

  console.log("Span created:", span.spanContext());

  try {
    const userId = Number(req.params.id);

    span.setAttribute("user.id", userId);

    // Intentionally fail users with IDs between 30 and 50
    if (userId >= 30 && userId <= 50) {
      span.setAttribute("error", true);
      span.setAttribute("error.type", "INVALID_USER_ID");

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Invalid user ID",
      });

      req.log.error(
        {
          userId,
          statusCode: 400,
        },
        "Invalid user ID"
      );

      return res.status(400).json({
        error: "Invalid user ID",
        id: userId,
      });
    }

    // Generate random user data
    const name = faker.person.fullName();

    const email = faker.internet.email({
      firstName: name.split(" ")[0],
      lastName: name.split(" ").slice(1).join(" "),
    });

    // Application log
    req.log.info(
      {
        userId,
        userName: name,
        userEmail: email,
      },
      "Fetching user"
    );

    // Successful response
    res.json({
      id: userId,
      name,
      email,
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