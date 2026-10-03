# Node.js Observability Demo

A production-style Node.js observability demo covering the three core pillars of observability:

- **Logs** — Pino
- **Metrics** — Prometheus
- **Traces** — OpenTelemetry + Jaeger
- **Log aggregation** — Grafana Alloy + Loki
- **Visualization** — Grafana

The project also demonstrates **trace correlation**, allowing logs and traces from the same request to be connected using `traceId` and `spanId`.

---

## Architecture

```text
                    Node.js Application
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
        Logs            Metrics           Traces
          |                |                |
        Pino          prom-client      OpenTelemetry
          |                |                |
          v                v                v
     Grafana Alloy     Prometheus      OTel Collector
          |                               |
          v                               v
         Loki                           Jaeger
          |                |                |
          +----------------+----------------+
                           |
                           v
                        Grafana
```

### Observability flow

#### Logs

```text
Node.js
   |
 Pino
   |
 stdout
   |
Grafana Alloy
   |
 Loki
   |
Grafana
```

#### Metrics

```text
Node.js
   |
prom-client
   |
/metrics
   |
Prometheus
   |
Grafana
```

#### Traces

```text
Node.js
   |
OpenTelemetry
   |
OTLP HTTP
   |
OTel Collector
   |
OTLP gRPC
   |
Jaeger
   |
Grafana / Jaeger UI
```

---

# Technology Stack

| Component | Purpose |
|---|---|
| Node.js | Application runtime |
| TypeScript | Application development |
| Express | HTTP API |
| Pino | Structured logging |
| OpenTelemetry | Distributed tracing |
| OTel Collector | Telemetry collection and routing |
| Prometheus | Metrics collection |
| Grafana Alloy | Log collection |
| Loki | Log aggregation |
| Jaeger | Distributed tracing UI |
| Grafana | Observability dashboard |
| Docker Compose | Local environment orchestration |

---

# Project Structure

```text
node-observability/
│
├── src/
│   ├── server.ts
│   ├── instrumentation.ts
│   │
│   ├── logger/
│   │   └── logger.ts
│   │
│   ├── metrics/
│   │   └── metrics.ts
│   │
│   ├── observability/
│   │   └── trace-context.ts
│   │
│   └── middleware/
│       ├── request-id.ts
│       └── metrics.ts
│
├── otel-collector-config.yml
├── prometheus.yml
├── loki-config.yml
├── alloy-config.alloy
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── package.json
├── tsconfig.json
└── README.md
```

---

# 1. Prerequisites

Install:

- Node.js
- npm
- Docker Desktop
- Git

Verify:

```bash
node --version
npm --version
docker --version
docker compose version
```

---

# 2. Install Dependencies

Clone the repository:

```bash
git clone https://github.com/abhinavjalla/node-observability.git
```

Navigate into the project:

```bash
cd node-observability
```

Install dependencies:

```bash
npm install
```

---

# 3. Run Locally Without Docker

Build the TypeScript application:

```bash
npm run build
```

Start the application:

```bash
npm start
```

The application runs on:

```text
http://localhost:3000
```

For development:

```bash
npm run dev
```

---

# 4. Run the Complete Observability Stack

The recommended way to run the complete demo is Docker Compose.

Start all services:

```bash
docker compose up -d --build
```

Check running containers:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Stop everything:

```bash
docker compose down
```

Rebuild and start:

```bash
docker compose up -d --build
```

---

# 5. Services

| Service | Purpose | URL |
|---|---|---|
| Node.js | Application API | http://localhost:3000 |
| Prometheus | Metrics | http://localhost:9090 |
| Grafana | Dashboard | http://localhost:3001 |
| Jaeger | Traces | http://localhost:16686 |
| Loki | Log aggregation | http://localhost:3100 |
| Alloy | Log collection | http://localhost:12345 |

The OpenTelemetry Collector is used internally by the application and does not need to expose its OTLP ports to the host.

---

# 6. Docker Networking

Inside Docker Compose, services communicate using **service names**, not `localhost`.

For example:

```text
Node.js
   |
   | http://otel-collector:4318
   v
OTel Collector
```

Similarly:

```text
OTel Collector → jaeger:4317

Alloy → loki:3100

Grafana → prometheus:9090

Grafana → loki:3100

Grafana → jaeger:16686
```

`localhost` refers to the current container itself.

---

# 7. Logging

The application uses **Pino** for structured JSON logging.

Example:

```json
{
  "level": 30,
  "time": 1760000000000,
  "msg": "User request received",
  "traceId": "abc123...",
  "spanId": "def456..."
}
```

The important fields are:

```text
traceId
spanId
```

These allow logs to be correlated with distributed traces.

### Log flow

```text
Node.js
   |
 Pino
   |
 stdout
   |
Grafana Alloy
   |
 Loki
   |
Grafana
```

For containerized applications, writing logs to stdout is preferred over writing application logs to files inside the container.

---

# 8. Metrics

The application uses `prom-client` to expose application metrics.

Metrics endpoint:

```text
GET /metrics
```

Example:

```text
http_requests_total
http_request_errors_total
http_request_duration_seconds
```

Prometheus periodically scrapes this endpoint.

```text
Node.js
   |
   | GET /metrics
   v
Prometheus
   |
   v
Grafana
```

---

# 9. Useful Prometheus Queries

### Request rate

```promql
sum(rate(http_requests_total[1m]))
```

### Error rate

```promql
sum(rate(http_request_errors_total[1m]))
```

### Requests by endpoint

```promql
sum by (route) (
  rate(http_requests_total[5m])
)
```

### Requests by status code

```promql
sum by (status_code) (
  rate(http_requests_total[5m])
)
```

### P95 latency

```promql
histogram_quantile(
  0.95,
  sum by (le) (
    rate(http_request_duration_seconds_bucket[5m])
  )
)
```

---

# 10. Distributed Tracing

OpenTelemetry is used to generate distributed traces.

The application exports traces using OTLP HTTP:

```text
Node.js
   |
   | OTLP HTTP
   v
OTel Collector
   |
   | OTLP gRPC
   v
Jaeger
```

The application uses:

```text
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
```

The important concept is that the Node.js application does not need to know where Jaeger is located.

The OTel Collector acts as the telemetry gateway.

---

# 11. Trace Correlation

A request can generate:

```text
Trace
 └── Span
      └── Application logs
```

Example:

```text
Trace ID:
abc123

Span ID:
def456
```

The same `traceId` can appear in application logs.

This makes it possible to move from:

```text
Grafana → Log → traceId → Jaeger → Trace
```

---

# 12. Demo Request

Send a request:

```bash
curl http://localhost:3000/users/128
```

Or with a request ID:

```bash
curl -H "x-request-id: demo-request-123" \
     http://localhost:3000/users/128
```

This request generates:

```text
1 request
   |
   +---- Log
   |
   +---- Metrics
   |
   +---- Trace
```

---

# 13. Demo Walkthrough

## Step 1 — Generate traffic

Call:

```bash
curl http://localhost:3000/users/128
```

Generate several requests:

```bash
curl http://localhost:3000/users/128
curl http://localhost:3000/users/129
curl http://localhost:3000/users/130
```

---

## Step 2 — Check application logs

Check:

```bash
docker logs node-observability
```

You should see structured JSON logs containing fields such as:

```text
traceId
spanId
method
url
statusCode
responseTime
```

---

## Step 3 — Check Prometheus

Open:

```text
http://localhost:9090
```

Try:

```promql
http_requests_total
```

Then:

```promql
rate(http_requests_total[1m])
```

---

## Step 4 — Check Jaeger

Open:

```text
http://localhost:16686
```

Search for the Node.js service.

Select a trace and inspect:

```text
Trace
 ├── HTTP request
 ├── Express processing
 └── Application spans
```

---

## Step 5 — Check Grafana

Open:

```text
http://localhost:3001
```

Configure the following data sources:

```text
Prometheus
Loki
Jaeger
```

Grafana can then provide a unified observability view.

---

# 14. Grafana Data Sources

### Prometheus

URL:

```text
http://prometheus:9090
```

Used for:

```text
Metrics
```

### Loki

URL:

```text
http://loki:3100
```

Used for:

```text
Logs
```

### Jaeger

URL:

```text
http://jaeger:16686
```

Used for:

```text
Traces
```

---

# 15. Dockerfile

The project uses a multi-stage Docker build.

```dockerfile
# =========================
# Build stage
# =========================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build


# =========================
# Production stage
# =========================
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["npm", "start"]
```

The build stage installs development dependencies such as TypeScript and compiles the application.

The production stage contains only the compiled application and production dependencies.

---

# 16. Docker Compose

The complete environment contains:

```text
node-observability
otel-collector
prometheus
jaeger
loki
alloy
grafana
```

Start:

```bash
docker compose up -d --build
```

Check:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs -f node-observability
```

View all logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

---

# 17. Troubleshooting

## Check containers

```bash
docker compose ps
```

## Check application logs

```bash
docker compose logs node-observability
```

## Check OTel Collector

```bash
docker compose logs otel-collector
```

## Check Prometheus

```bash
docker compose logs prometheus
```

## Check Loki

```bash
docker compose logs loki
```

## Check Alloy

```bash
docker compose logs alloy
```

## Check Grafana

```bash
docker compose logs grafana
```

---

# 18. Common Docker Networking Mistake

Do not configure:

```text
http://localhost:4318
```

inside the Node.js container.

Use:

```text
http://otel-collector:4318
```

because `otel-collector` is the Compose service name.

Similarly, do not use:

```text
http://localhost:3100
```

for Loki from another container.

Use:

```text
http://loki:3100
```

---

# 19. Observability Mental Model

Think about observability using three questions:

### Logs

> **What happened?**

Example:

```text
User request failed
statusCode: 500
traceId: abc123
```

### Metrics

> **How often is it happening?**

Example:

```text
500 errors
120 requests/sec
P95 latency = 450ms
```

### Traces

> **Where did the request spend its time or fail?**

Example:

```text
API
 |
 +-- Authentication
 |
 +-- Database
 |
 +-- External API
```

### Correlation

> **Which logs belong to this request?**

Using:

```text
traceId
spanId
requestId
```

---

# 20. Complete Architecture Summary

```text
                    Node.js Application
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
        Logs            Metrics           Traces
          |                |                |
        Pino          prom-client      OpenTelemetry
          |                |                |
          v                v                v
     Grafana Alloy     Prometheus      OTel Collector
          |                               |
          v                               v
         Loki                           Jaeger
          |                |                |
          +----------------+----------------+
                           |
                           v
                        Grafana
```

The application produces three primary telemetry signals:

```text
                 Node.js
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
       Logs       Metrics     Traces
        |           |           |
       Loki     Prometheus    Jaeger
        \           |           /
         \          |          /
          +---------+---------+
                    |
                 Grafana
```

This demonstrates how logs, metrics, and traces work together to provide a complete view of application behavior.