# Node.js Observability Platform

A Node.js/TypeScript monorepo demonstrating **production-oriented observability** for multiple services using:

- OpenTelemetry
- Prometheus
- Grafana
- Loki
- Grafana Alloy
- Jaeger
- Pino
- PostgreSQL

The project demonstrates how **metrics, logs, and distributed traces** can be collected and correlated across multiple Node.js services.

---

## Architecture

```text
                         ┌──────────────────────┐
                         │      Grafana          │
                         │      :3001            │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
            Prometheus            Loki              Jaeger
              :9090              :3100              :16686
                 ▲                  ▲                  ▲
                 │                  │                  │
                 │               Alloy                │
                 │              :12345                 │
                 │                  ▲                  │
                 │                  │                  │
                 └──────────┬───────┴───────┬──────────┘
                            │               │
                            ▼               ▼
                    ┌─────────────┐  ┌─────────────┐
                    │    Orders   │  │  Payments   │
                    │    :5000    │  │    :4000    │
                    └──────┬──────┘  └──────┬──────┘
                           │                 │
                           └────────┬────────┘
                                    │
                           OpenTelemetry
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  OTEL Collector     │
                         │      :4317/:4318    │
                         └─────────────────────┘
```

---

# Observability Architecture

The project follows the three major pillars of observability:

```text
                 Observability
                      │
          ┌───────────┼───────────┐
          │           │           │
        Logs       Metrics      Traces
          │           │           │
         Loki      Prometheus    Jaeger
          │           │           │
          └───────────┼───────────┘
                      │
                   Grafana
```

## 1. Logs

Application logs are generated using **Pino**.

Example:

```json
{
  "level": 30,
  "msg": "Order created",
  "traceId": "d63695cc92c8406f0205fe8d7aa467d4",
  "spanId": "abc123",
  "method": "POST",
  "path": "/create-order"
}
```

Logs are collected by **Grafana Alloy** and forwarded to **Loki**.

Grafana can then be used to search logs by:

- service
- HTTP method
- endpoint
- status code
- trace ID
- error
- timestamp

Example Loki query:

```logql
{job=~".+"}
|= "d63695cc92c8406f0205fe8d7aa467d4"
```

---

# 2. Metrics

Application metrics are generated using OpenTelemetry/Prometheus-compatible instrumentation.

Typical HTTP metrics include:

```text
http_requests_total
http_request_duration_seconds
http_request_errors_total
```

Metrics provide information such as:

- request count
- request rate
- HTTP success rate
- HTTP error rate
- latency
- p50 latency
- p95 latency
- p99 latency

Prometheus stores and queries these metrics.

Example:

```promql
rate(http_requests_total[5m])
```

For an individual service:

```promql
rate(http_requests_total{service_name="orders"}[5m])
```

---

# 3. Distributed Tracing

OpenTelemetry generates traces and spans for HTTP requests.

For example:

```text
Client
  │
  │ POST /create-order
  ▼
Orders
  │
  │ HTTP request
  │ traceId = d63695cc92c8406f0205fe8d7aa467d4
  ▼
Payments
  │
  ▼
PostgreSQL
```

The important concept is that the same:

```text
traceId
```

can be propagated across service boundaries.

Example:

```text
Orders
traceId = d63695cc92c8406f0205fe8d7aa467d4

        │
        ▼

Payments
traceId = d63695cc92c8406f0205fe8d7aa467d4
```

This allows a complete request to be investigated across services.

Jaeger provides the trace visualization.

---

# Monorepo Structure

The project uses an npm workspace-based monorepo.

```text
node-observability/
│
├── package.json
├── package-lock.json
│
├── reusable/
│   ├── package.json
│   ├── src/
│   └── dist/
│
├── orders/
│   ├── package.json
│   ├── src/
│   └── dist/
│
├── payments/
│   ├── package.json
│   ├── src/
│   └── dist/
│
└── observability/
    ├── prometheus/
    ├── loki/
    ├── alloy/
    ├── otel-collector/
    └── grafana/
```

## Workspace Concept

The root `package.json` defines the workspaces:

```json
{
  "workspaces": [
    "reusable",
    "orders",
    "payments"
  ]
}
```

This allows the services to share common code through the reusable workspace.

For example:

```text
                 @node-observability/reusable
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
           Orders                      Payments
```

Common observability functionality can live in the reusable package, such as:

- Pino configuration
- OpenTelemetry setup
- request ID middleware
- tracing utilities
- metrics middleware
- common logging utilities

This avoids duplicating the same observability implementation in every service.

---

# Prerequisites

Install:

- Node.js 24+
- npm
- Git

The observability stack requires the corresponding local container runtime.

---

# Install Dependencies

From the repository root:

```bash
npm ci
```

Because this is an npm workspace monorepo, dependencies for the workspaces are installed from the root.

---

# Build the Project

Build the reusable package first:

```bash
npm run build --workspace=@node-observability/reusable
```

Build Orders:

```bash
npm run build --workspace=orders
```

Build Payments:

```bash
npm run build --workspace=payments
```

Or, if the root project provides a build script:

```bash
npm run build
```

---

# Running the Services

## Orders

Orders runs on:

```text
http://localhost:5002
```

Example:

```http
POST http://localhost:5002/create-order
```

Example request:

```json
{
  "productId": 10,
  "quantity": 2,
  "userId": 1001
}
```

---

## Payments

Payments runs on:

```text
http://localhost:4002
```

---

# Running the Observability Stack

Start the observability infrastructure from the project's compose configuration.

After startup, verify the running components.

The main observability endpoints are:

| Tool | URL | Purpose |
|---|---|---|
| Grafana | http://localhost:3001 | Visualization |
| Prometheus | http://localhost:9090 | Metrics |
| Jaeger | http://localhost:16686 | Distributed traces |
| Loki | http://localhost:3100 | Logs |
| Alloy | http://localhost:12345 | Telemetry collection |

---

# Grafana

Open:

```text
http://localhost:3001
```

Grafana is the main visualization and investigation interface.

It can connect to:

```text
Prometheus
Loki
Jaeger
```

This allows metrics, logs, and traces to be investigated from a common interface.

---

# Prometheus

Open:

```text
http://localhost:9090
```

Prometheus stores application metrics.

Example query:

```promql
rate(http_requests_total[5m])
```

Orders:

```promql
rate(http_requests_total{service_name="orders"}[5m])
```

HTTP error rate:

```promql
rate(http_request_errors_total[5m])
```

Latency can be analyzed using histogram metrics.

Example:

```promql
histogram_quantile(
  0.95,
  rate(http_request_duration_seconds_bucket[5m])
)
```

This represents approximately **p95 HTTP latency**.

---

# Loki

Loki stores application logs.

Logs are collected by Grafana Alloy and sent to Loki.

Example query:

```logql
{job=~".+"}
```

Search for an endpoint:

```logql
{job=~".+"} |= "/create-order"
```

Search by trace ID:

```logql
{job=~".+"} |= "d63695cc92c8406f0205fe8d7aa467d4"
```

This is particularly useful for following one request across multiple services.

---

# Jaeger

Open:

```text
http://localhost:16686
```

Jaeger provides distributed trace visualization.

A trace can look like:

```text
Trace
│
├── Orders
│    └── POST /create-order
│
├── Payments
│    └── POST /payment
│
└── PostgreSQL
     └── database operation
```

Each operation is represented as a span.

The trace ID connects all spans belonging to the same distributed request.

---

# Trace Correlation

One of the primary goals of this project is to correlate:

```text
Logs
  +
Metrics
  +
Traces
```

using a common request context.

For example:

```text
traceId:
d63695cc92c8406f0205fe8d7aa467d4
```

The same trace ID can appear in:

```text
Orders logs
Payments logs
Jaeger trace
```

This makes it possible to start with an HTTP request and follow it through the entire system.

Example investigation:

```text
POST /create-order
        │
        ▼
     Orders
        │
        │ traceId
        ▼
    Payments
        │
        ▼
   PostgreSQL
```

If the request is slow, the investigation can move from:

```text
Grafana
   │
   ├── Metrics → identify latency
   │
   ├── Loki → inspect application logs
   │
   └── Jaeger → identify slow span
```

---

# OpenTelemetry Collector

The OpenTelemetry Collector acts as the telemetry pipeline between applications and observability backends.

```text
Orders ─────┐
            │
Payments ───┤
            ▼
     OpenTelemetry
        Collector
            │
       ┌────┼────┐
       ▼    ▼    ▼
    Jaeger  ...  Metrics/Logs
```

The application does not need to know the details of every backend.

Instead:

```text
Application
     │
     ▼
OpenTelemetry Collector
     │
     ├── Traces → Jaeger
     ├── Metrics → Prometheus
     └── Logs → Loki/Alloy pipeline
```

This provides a cleaner and more flexible observability architecture.

---

# Grafana Investigation Workflow

A typical investigation starts with an HTTP request.

### Step 1 — Generate traffic

```http
POST http://localhost:5002/create-order
```

### Step 2 — Check Metrics

Open Grafana → Explore → Prometheus.

Check:

```promql
rate(http_requests_total{service_name="orders"}[5m])
```

### Step 3 — Check Logs

Open Grafana → Explore → Loki.

Search:

```logql
{job=~".+"} |= "/create-order"
```

### Step 4 — Find Trace ID

From the log:

```text
traceId=d63695cc92c8406f0205fe8d7aa467d4
```

Search Loki:

```logql
{job=~".+"} |= "d63695cc92c8406f0205fe8d7aa467d4"
```

### Step 5 — Open the Trace

Use the trace ID in Jaeger/Grafana to inspect:

```text
Orders
   ↓
Payments
   ↓
Database
```

This gives a complete view of the request.

---

# Service Endpoints

```text
Orders
http://localhost:5002

Payments
http://localhost:4002

Grafana
http://localhost:3001

Prometheus
http://localhost:9090

Jaeger
http://localhost:16686

Loki
http://localhost:3100

Alloy
http://localhost:12345
```

---

# Key Concepts Demonstrated

This project demonstrates:

- Structured logging with Pino
- Request IDs
- Trace IDs
- Span IDs
- OpenTelemetry instrumentation
- HTTP instrumentation
- Distributed tracing
- Trace context propagation
- HTTP metrics
- Request latency
- Error metrics
- Prometheus
- Loki
- Grafana
- Grafana Alloy
- Jaeger
- OpenTelemetry Collector
- Service-to-service observability
- Log/trace correlation
- npm workspace monorepo
- Shared reusable Node.js packages

---

# Goal of the Project

The main objective is to demonstrate how a multi-service Node.js application can be made **observable end-to-end**.

The expected flow is:

```text
                    USER REQUEST
                         │
                         ▼
                ┌────────────────┐
                │     Orders     │
                └───────┬────────┘
                        │
                 trace context
                        │
                        ▼
                ┌────────────────┐
                │    Payments    │
                └───────┬────────┘
                        │
                        ▼
                   PostgreSQL


        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
      Logs           Metrics           Traces
        │               │                │
      Loki          Prometheus         Jaeger
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                     Grafana
```

The end goal is to be able to answer:

> **What happened to this request?**

by following a single request across **services, logs, metrics, traces, and database operations**.