import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel
} from "@opentelemetry/api";

import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

diag.setLogger(
  new DiagConsoleLogger(),
  DiagLogLevel.DEBUG
);

const traceExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    "http://otel-collector:4318/v1/traces"
});

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "orders"
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations()
  ]
});

sdk.start();

console.log("OpenTelemetry initialized for orders");