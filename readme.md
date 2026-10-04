# Node.js Observability Platform

A Node.js/TypeScript monorepo demonstrating **end-to-end observability for distributed services**.

The project focuses on how application telemetry is generated, collected, transported, stored, queried, visualized, and correlated across multiple services.

The observability stack includes:

- **OpenTelemetry** — instrumentation and telemetry generation
- **OpenTelemetry Collector** — telemetry processing and routing
- **Grafana Alloy** — telemetry collection and forwarding
- **Prometheus** — metrics storage and querying
- **Loki** — log aggregation and querying
- **Jaeger** — distributed tracing
- **Grafana** — visualization and observability investigation
- **Pino** — structured application logging

The application consists of multiple Node.js services such as:

- Orders
- Payments
- Reusable shared package

---

# 1. Observability Architecture

The overall architecture looks like this:

```text
                         ┌───────────────────────┐
                         │       Grafana         │
                         │        :3001          │
                         │                       │
                         │  Dashboards / Explore│
                         └───────────┬───────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
            Prometheus             Loki                Jaeger
             Metrics               Logs                Traces
                 ▲                   ▲                   ▲
                 │                   │                   │
                 │                   │                   │
                 │              Grafana Alloy            │
                 │                   ▲                   │
                 │                   │                   │
                 │                   │                   │
                 └──────────┐        │        ┌──────────┘
                            │        │        │
                            ▼        ▼        ▼
                    OpenTelemetry Collector
                         :4317 / :4318
                            ▲
                            │
                  OpenTelemetry SDK
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
        ┌──────────┐                  ┌──────────┐
        │  Orders  │                  │ Payments │
        │  :5000   │                  │  :4000   │
        └──────────┘                  └──────────┘
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
                        PostgreSQL
```

The important concept is that **different observability tools have different responsibilities**.

---

# 2. What Is Observability?

Observability helps answer:

> **What is happening inside my application, and why?**

The three primary pillars are:

```text
                    Observability
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
          Logs        Metrics       Traces
            │            │            │
            ▼            ▼            ▼
          Loki       Prometheus     Jaeger
```

### Logs

Tell us:

> What happened?

Example:

```json
{
  "level": 30,
  "msg": "Order created",
  "traceId": "d63695cc92c8406f0205fe8d7aa467d4",
  "method": "POST",
  "path": "/create-order"
}
```

### Metrics

Tell us:

> How much? How often? How fast?

Examples:

```text
Request count
Request rate
Error rate
CPU
Memory
Latency
p50
p95
p99
```

### Traces

Tell us:

> Where did the request travel and where did it spend time?

Example:

```text
Client
  │
  ▼
Orders
  │
  ▼
Payments
  │
  ▼
PostgreSQL
```

---

# 3. OpenTelemetry

OpenTelemetry is the instrumentation and telemetry standard used by the application.

It can generate:

```text
Traces
Metrics
Logs
```

In this project, OpenTelemetry is primarily responsible for:

- HTTP instrumentation
- Span creation
- Trace context propagation
- Metrics
- Exporting telemetry

For example, when a request arrives:

```http
POST /create-order
```

OpenTelemetry creates a trace/span context.

Example:

```text
traceId = d63695cc92c8406f0205fe8d7aa467d4
spanId  = abc123
```

When Orders calls Payments, the trace context is propagated.

```text
Orders
traceId = d63695cc92c8406f0205fe8d7aa467d4
        │
        │ HTTP
        ▼
Payments
traceId = d63695cc92c8406f0205fe8d7aa467d4
```

This is what makes distributed tracing possible.

---

# 4. OpenTelemetry Collector

The OpenTelemetry Collector acts as a **telemetry processing and routing layer**.

Instead of every application directly connecting to every observability backend:

```text
Orders ───────► Jaeger
Orders ───────► Prometheus
Orders ───────► Loki

Payments ─────► Jaeger
Payments ─────► Prometheus
Payments ─────► Loki
```

the architecture uses:

```text
Orders ─────┐
            │
Payments ───┤
            ▼
     OTEL Collector
            │
      ┌─────┼─────┐
      ▼     ▼     ▼
   Jaeger Prometheus Loki
```

The Collector can perform:

- Receiving telemetry
- Processing telemetry
- Batching
- Filtering
- Enrichment
- Sampling
- Exporting

This provides a central telemetry pipeline.

---

# 5. Grafana Alloy

Grafana Alloy is a **telemetry collector/agent** from Grafana.

It is especially useful for collecting telemetry from infrastructure and applications and forwarding it to observability backends.

In this project, Alloy is primarily involved in the **log collection pipeline**.

The simplified flow is:

```text
Node.js Application
        │
        │ structured logs
        ▼
     Log source
        │
        ▼
   Grafana Alloy
        │
        │
        ▼
       Loki
        │
        ▼
     Grafana
```

Alloy can also collect and process other telemetry types depending on its configuration.

### Why use Alloy?

It provides a flexible telemetry agent that can:

- Discover log sources
- Collect logs
- Add labels
- Parse logs
- Filter logs
- Forward logs
- Integrate with Grafana's observability ecosystem

For example, an application may generate:

```json
{
  "level": 30,
  "service": "orders",
  "traceId": "d63695cc92c8406f0205fe8d7aa467d4",
  "method": "POST",
  "path": "/create-order",
  "statusCode": 201
}
```

Alloy can collect these logs and forward them to Loki.

---

# 6. Alloy vs OpenTelemetry Collector

These tools can look similar because both can collect and process telemetry.

Their roles in this project are separated conceptually:

```text
                 Application
                      │
             OpenTelemetry SDK
                      │
                      ▼
              OTEL Collector
                      │
                      ▼
                   Traces
                      │
                      ▼
                   Jaeger


              Application logs
                      │
                      ▼
                Grafana Alloy
                      │
                      ▼
                    Loki
```

### OpenTelemetry Collector

Primarily used here for:

```text
Application telemetry
        │
        ▼
OTLP
        │
        ▼
OTEL Collector
        │
        ▼
Telemetry backends
```

### Alloy

Primarily used here for:

```text
Application / system logs
        │
        ▼
      Alloy
        │
        ▼
      Loki
```

Both are capable of broader telemetry pipelines, but separating responsibilities makes the architecture easier to understand.

---

# 7. Prometheus

Prometheus is the **metrics monitoring and time-series database** in this architecture.

It stores numerical measurements over time.

Examples:

```text
http_requests_total
http_request_duration_seconds
http_request_errors_total
```

A request:

```http
POST /create-order
```

might produce:

```text
http_requests_total{service="orders",route="/create-order"} 150
```

Prometheus allows us to query these metrics using **PromQL**.

Example:

```promql
rate(http_requests_total[5m])
```

This answers:

> What is the request rate during the last five minutes?

---

# 8. What Prometheus Does NOT Do

Prometheus does not primarily store application logs.

It stores metrics.

```text
Logs       → Loki
Metrics    → Prometheus
Traces     → Jaeger
```

This separation is important.

---

# 9. Loki

Loki is the **log aggregation system**.

Applications generate structured logs using Pino.

Example:

```json
{
  "level": 30,
  "service": "orders",
  "traceId": "d63695cc92c8406f0205fe8d7aa467d4",
  "method": "POST",
  "path": "/create-order",
  "statusCode": 201
}
```

Alloy collects the logs and sends them to Loki.

Grafana can then query Loki using **LogQL**.

Example:

```logql
{job=~".+"} |= "/create-order"
```

Search using trace ID:

```logql
{job=~".+"} |= "d63695cc92c8406f0205fe8d7aa467d4"
```

This is extremely useful when investigating a distributed request.

---

# 10. Jaeger

Jaeger is the **distributed tracing backend**.

It stores and visualizes:

```text
Traces
Spans
Span relationships
Service dependencies
Latency
```

Example trace:

```text
Trace ID:
d63695cc92c8406f0205fe8d7aa467d4

Orders
│
├── POST /create-order
│
└── Payments
     │
     └── POST /payment
```

The trace allows us to identify:

- Which service was slow
- Which operation failed
- How long each operation took
- Which service called another service
- Where an error originated

---

# 11. Grafana

Grafana is the **central visualization and investigation layer**.

It can connect to:

```text
Prometheus
Loki
Jaeger
```

This allows engineers to investigate the same application from different perspectives.

```text
                   Grafana
                      │
       ┌──────────────┼──────────────┐
       │              │              │
       ▼              ▼              ▼
   Prometheus       Loki           Jaeger
    Metrics         Logs           Traces
```

Grafana provides:

- Dashboards
- Metrics visualization
- Log search
- Trace exploration
- Alerts
- Correlation between telemetry types

---

# 12. End-to-End Request Flow

Consider:

```http
POST /create-order
```

The complete flow is:

```text
                         Client
                           │
                           │ POST /create-order
                           ▼
                     ┌───────────┐
                     │  Orders   │
                     └─────┬─────┘
                           │
                 traceId = ABC123
                           │
                           ▼
                     ┌───────────┐
                     │ Payments  │
                     └─────┬─────┘
                           │
                           ▼
                       PostgreSQL
```

At the same time, telemetry is generated.

### Logs

```text
Orders ──► Alloy ──► Loki
Payments ─► Alloy ──► Loki
```

### Metrics

```text
Orders
  │
  ▼
OpenTelemetry
  │
  ▼
OTEL Collector
  │
  ▼
Prometheus
```

### Traces

```text
Orders
  │
  ▼
OpenTelemetry
  │
  ▼
OTEL Collector
  │
  ▼
Jaeger
```

Grafana brings these views together.

---

# 13. Trace ID Correlation

One of the most important concepts demonstrated by this project is **trace correlation**.

Suppose a request starts with:

```text
traceId =
d63695cc92c8406f0205fe8d7aa467d4
```

Orders creates the request:

```text
Orders
POST /create-order
traceId=d63695cc92c8406f0205fe8d7aa467d4
```

Orders calls Payments:

```text
Payments
POST /payment
traceId=d63695cc92c8406f0205fe8d7aa467d4
```

Now the same trace ID can be searched in Loki:

```logql
{job=~".+"} |= "d63695cc92c8406f0205fe8d7aa467d4"
```

And the same trace can be opened in Jaeger.

This creates a connection between:

```text
HTTP request
      │
      ├── Logs
      │
      ├── Metrics
      │
      └── Trace
```

---

# 14. Observability Investigation Example

Suppose users report:

> Create order is slow.

Start with metrics.

### Step 1 — Metrics

Prometheus shows:

```text
p95 latency = 2.8 seconds
```

Now we know there is a latency problem.

### Step 2 — Logs

Search Loki:

```logql
{job=~".+"} |= "/create-order"
```

Find:

```text
traceId=d63695cc92c8406f0205fe8d7aa467d4
```

### Step 3 — Trace

Search the trace in Jaeger.

You may find:

```text
Orders                150 ms
   │
   └── Payments       2,400 ms
          │
          └── Database 2,300 ms
```

Now the problem becomes clear:

```text
Create Order
     │
     ▼
   Orders
     │
     ▼
 Payments
     │
     ▼
 PostgreSQL
     │
     └── Slow database operation
```

This is the value of combining logs, metrics, and traces.

---

# 15. Monorepo Structure

The application is maintained as an npm workspace monorepo.

```text
node-observability/
│
├── package.json
├── package-lock.json
│
├── reusable/
│   ├── package.json
│   └── src/
│
├── orders/
│   ├── package.json
│   └── src/
│
├── payments/
│   ├── package.json
│   └── src/
│
└── observability/
    ├── alloy/
    ├── loki/
    ├── prometheus/
    └── otel-collector/
```

The reusable workspace contains common functionality shared by the services.

For example:

```text
@node-observability/reusable
          │
          ├── Logging
          ├── OpenTelemetry
          ├── Metrics
          ├── Middleware
          └── Trace utilities
                    │
             ┌──────┴──────┐
             ▼             ▼
          Orders        Payments
```

This prevents duplication of common observability code.

---

# 16. Running the Project

## Install dependencies

From the repository root:

```bash
npm ci
```

## Build reusable package

```bash
npm run build --workspace=@node-observability/reusable
```

## Build Orders

```bash
npm run build --workspace=orders
```

## Build Payments

```bash
npm run build --workspace=payments
```

---

# 17. Start the Application and Observability Stack

Start the project using the provided compose configuration.

```bash
docker compose up -d --build
```

Check running services:

```bash
docker ps
```

Stop the project:

```bash
docker compose down
```

---

# 18. Application URLs

Orders:

```text
http://localhost:5002
```

Payments:

```text
http://localhost:4002
```

Grafana:

```text
http://localhost:3001
```

Prometheus:

```text
http://localhost:9090
```

Jaeger:

```text
http://localhost:16686
```

Loki:

```text
http://localhost:3100
```

Alloy:

```text
http://localhost:12345
```

---

# 19. Generate Test Traffic

Example:

```bash
curl -X POST http://localhost:5002/create-order \
  -H "Content-Type: application/json" \
  -d '{"productId":10,"quantity":2,"userId":1001}'
```

This should generate:

```text
HTTP request
      │
      ├── Application logs
      │
      ├── Metrics
      │
      └── Distributed trace
```

---

# 20. Useful Queries

## Prometheus

Request rate:

```promql
rate(http_requests_total[5m])
```

Orders request rate:

```promql
rate(http_requests_total{service_name="orders"}[5m])
```

p95 latency:

```promql
histogram_quantile(
  0.95,
  rate(http_request_duration_seconds_bucket[5m])
)
```

---

## Loki

Search Orders:

```logql
{job=~".+"} |= "orders"
```

Search endpoint:

```logql
{job=~".+"} |= "/create-order"
```

Search trace:

```logql
{job=~".+"} |= "d63695cc92c8406f0205fe8d7aa467d4"
```

---

# 21. Observability Components Summary

| Component | Primary Responsibility |
|---|---|
| Pino | Structured application logging |
| OpenTelemetry | Application instrumentation |
| OTEL Collector | Receive/process/export telemetry |
| Grafana Alloy | Collect/process/forward telemetry, especially logs |
| Prometheus | Metrics storage and PromQL |
| Loki | Log aggregation and LogQL |
| Jaeger | Distributed tracing |
| Grafana | Visualization and investigation |

---

# 22. Complete Telemetry Pipeline

The complete architecture can be summarized as:

```text
                    NODE.JS SERVICES
                  ┌───────────────────┐
                  │                   │
                  │ Orders            │
                  │ Payments          │
                  │                   │
                  └─────────┬─────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
           Logs          Metrics         Traces
             │              │              │
             ▼              ▼              ▼
           Pino       OpenTelemetry    OpenTelemetry
             │              │              │
             ▼              └──────┬───────┘
      Grafana Alloy               │
             │                    ▼
             ▼             OTEL Collector
           Loki                    │
             │               ┌────┴─────┐
             │               │          │
             │               ▼          ▼
             │            Jaeger    Prometheus
             │               │          │
             └───────────────┴────┬─────┘
                                  │
                                  ▼
                               Grafana
```

The key idea is:

> **Applications generate telemetry, collectors transport and process it, specialized backends store it, and Grafana provides a unified investigation experience.**

---

# 23. Learning Objectives

This project is intended to provide practical understanding of:

- Application observability
- Structured logging
- Metrics
- Distributed tracing
- OpenTelemetry
- OTLP
- OpenTelemetry Collector
- Grafana Alloy
- Prometheus
- Loki
- LogQL
- PromQL
- Jaeger
- Grafana
- Trace ID propagation
- Span relationships
- Service-to-service tracing
- Log and trace correlation
- HTTP latency monitoring
- Error monitoring
- p95/p99 latency
- Observability architecture
- Monorepo-based reusable observability libraries

