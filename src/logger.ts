import pino from "pino";
import {
  context,
  trace
} from "@opentelemetry/api";

const transport = pino.transport({
  targets: [
    {
      target: "pino/file",
      options: {
        destination: "./logs/app.log",
        mkdir: true
      },
      level: process.env.LOG_LEVEL || "info"
    },
    {
      target: "pino/file",
      options: {
        destination: 1
      },
      level: process.env.LOG_LEVEL || "info"
    }
  ]
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",

    mixin() {
      const span = trace.getSpan(context.active());

      if (!span) {
        return {};
      }

      const spanContext = span.spanContext();

      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId
      };
    }
  },
  transport
);