import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel
} from "@opentelemetry/api";

import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

diag.setLogger(
  new DiagConsoleLogger(),
  DiagLogLevel.DEBUG
);

const traceExporter = new OTLPTraceExporter({
  url: "http://127.0.0.1:4318/v1/traces"
});

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations()
  ]
});

sdk.start();

console.log("OpenTelemetry initialized");