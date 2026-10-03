# Node.js Observability Demo

A containerized Node.js/TypeScript observability demo showing the three pillars of observability:

- **Logs** — Pino → Docker stdout → Grafana Alloy → Loki → Grafana
- **Metrics** — `prom-client` → Prometheus → Grafana
- **Traces** — OpenTelemetry → OpenTelemetry Collector → Jaeger
- **Correlation** — `traceId` and `spanId` are added to application logs so a request can be followed across logs and traces.

---

## Architecture

```text
                         Docker Compose
                               |
                     +---------+---------+
                     |                   |
                     v                   v
              Node.js Application    Prometheus
                     |                   ^
             +-------+-------+           |
             |               |           |
             | /metrics      |           |
             |               +-----------+
             |
       +-----+----------------------+
       |                            |
       v                            v
   Pino Logs                  OpenTelemetry
       |                            |
       v                            v
 Docker stdout                OTel Collector
       |                            |
       v                            v
 Grafana Alloy                    Jaeger
       |
       v
      Loki
       |
       +-------------+
                     |
                     v
                  Grafana
```

---

## Technology Stack

| Component | Purpose |
|---|---|
| Node.js + Express | Demo API |
| TypeScript | Application language |
| Pino / pino-http | Structured JSON logging |
| prom-client | Application metrics |
| OpenTelemetry | Application tracing/instrumentation |
| OpenTelemetry Collector | Receives and forwards telemetry |
| Jaeger | Trace storage and visualization |
| Prometheus | Metrics collection and querying |
| Grafana Alloy | Collects Docker container logs |
| Loki | Log aggregation |
| Grafana | Observability dashboards and exploration |
| Docker Compose | Runs the complete local observability stack |

---

# Logging

The application writes structured Pino logs to **stdout**.

It does **not** write application logs to `./logs/app.log` inside the container.

This follows the container logging model:

```text
Node.js
   |
   v
Pino
   |
   v
stdout / stderr
   |
   v
Docker logs
   |
   v
Grafana Alloy
   |
   v
Loki
   |
   v
Grafana
```

The logger enriches logs with the active OpenTelemetry context:

```json
{
  "level": 30,
  "traceId": "330f16c76c919760967d2993d1f99c56",
  "spanId": "e70814a6961d8c29",
  "msg": "Fetching user"
}
```

This allows a `traceId` found in logs to be used to locate the corresponding request trace.

---

# Tracing

The application loads OpenTelemetry instrumentation before the server:

```text
npm start
   |
   v
node --import ./dist/instrumentation.js ./dist/server.js
```

The trace pipeline is:

```text
Node.js
   |
   | OTLP HTTP
   v
otel-collector:4318
   |
   | OTLP gRPC
   v
jaeger:4317
```

The collector listens internally on:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
```

and exports traces to Jaeger:

```yaml
exporters:
  otlp:
    endpoint: jaeger:4317
    tls:
      insecure: true
```

Because the services run in the same Docker Compose network, they communicate using **Compose service names**, not `localhost`.

For example:

```text
http://otel-collector:4318
jaeger:4317
loki:3100
prometheus:9090
```

---

# Metrics

The Node.js application exposes Prometheus-compatible metrics through:

```text
GET /metrics
```

Flow:

```text
Node.js /metrics
       ^
       |
   Prometheus
       |
       v
    Grafana
```

Application metrics include concepts such as:

```text
http_requests_total
http_request_errors_total
http_request_duration_seconds
```

These can be used to demonstrate traffic, errors, and request latency.

---

# Project Structure

```text
node-observability/
|
|-- src/
|   |-- server.ts
|   |-- instrumentation.ts
|   `-- ...
|
|-- Dockerfile
|-- compose.yml
|-- package.json
|-- package-lock.json
|-- tsconfig.json
|
|-- prometheus.yml
|-- otel-collector-config.yml
|-- loki-config.yml
|-- alloy-config.alloy
|
`-- README.md
```

---

# Prerequisites

Install:

- Docker Desktop
- Docker Compose

Verify:

```bash
docker --version
docker compose version
```

When using Docker Compose, a local Node.js installation is not required to run the complete application stack.

---

# Run the Complete Stack

Build and start all services:

```bash
docker compose up -d --build
```

Docker Compose will:

1. Build the Node.js TypeScript application.
2. Start the Node.js container.
3. Start the OpenTelemetry Collector.
4. Start Jaeger.
5. Start Prometheus.
6. Start Loki.
7. Start Grafana Alloy.
8. Start Grafana.
9. Create a shared Docker network for service-to-service communication.

---

# Check Running Services

```bash
docker compose ps
```

A cleaner Docker view:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected services:

```text
node-observability
otel-collector
jaeger
prometheus
loki
alloy
grafana
```

---

# Service URLs

| Service | URL |
|---|---|
| Node.js API | `http://localhost:3000` |
| Grafana | `http://localhost:3001` |
| Prometheus | `http://localhost:9090` |
| Jaeger | `http://localhost:16686` |
| Loki | `http://localhost:3100` |
| Alloy UI | `http://localhost:12345` |

The OTel Collector ports do not need to be published to the host when only Docker Compose services send telemetry to it.

---

# View Application Logs

```bash
docker compose logs node-observability
```

Follow logs continuously:

```bash
docker compose logs -f node-observability
```

Because Pino writes to stdout, the structured application logs appear directly in Docker logs.

---

# Generate Demo Traffic

Call the application endpoint:

```bash
curl http://localhost:3000/users/128
```

Optionally provide a request ID:

```bash
curl -H "x-request-id: demo-request-123" http://localhost:3000/users/128
```

Then inspect:

1. Node.js structured logs
2. Prometheus metrics
3. Jaeger traces
4. Loki logs in Grafana
5. `traceId` correlation between logs and traces

---

# Demo Walkthrough

## 1. Show the API

Call:

```text
GET /users/128
```

Explain that one HTTP request generates multiple observability signals.

---

## 2. Show Logs

Run:

```bash
docker compose logs -f node-observability
```

Point out:

```text
requestId
traceId
spanId
method
route
statusCode
responseTime
```

---

## 3. Show Metrics

Open:

```text
http://localhost:9090
```

Example metrics:

```text
http_requests_total
http_request_errors_total
http_request_duration_seconds
```

Example PromQL:

```promql
sum(rate(http_requests_total[1m]))
```

Error rate:

```promql
sum(rate(http_request_errors_total[1m]))
```

P95 latency:

```promql
histogram_quantile(
  0.95,
  sum by (le) (
    rate(http_request_duration_seconds_bucket[5m])
  )
)
```

---

## 4. Show Traces

Open:

```text
http://localhost:16686
```

Select the Node.js service and locate the request trace.

Example:

```text
Trace
 |
 +-- HTTP request span
 |
 +-- Express/router span
 |
 `-- custom application span
```

Explain the difference between:

```text
Trace ID
    |
    +-- Span 1
    +-- Span 2
    +-- Span 3
```

A trace represents the complete request journey.

A span represents one operation within that journey.

---

## 5. Correlate Logs and Traces

Copy a `traceId` from a Pino log.

Use that trace identifier to locate or compare the corresponding request in Jaeger.

```text
Log
 |
 | traceId
 v
Trace
```

This is one of the most important parts of the demo.

---

# Grafana

Open:

```text
http://localhost:3001
```

Grafana can be configured with:

```text
Prometheus → Metrics
Loki       → Logs
Jaeger     → Traces
```

This provides a single interface for exploring the application's observability data.

---

# Docker Networking

Do not use `localhost` for communication between containers.

Inside the Node.js container:

```text
localhost
```

means the Node.js container itself.

Use the Compose service name instead:

```text
otel-collector:4318
```

Similarly:

```text
jaeger:4317
loki:3100
prometheus:9090
```

Docker Compose automatically provides DNS resolution for service names on the Compose network.

Architecture:

```text
node-observability
        |
        | otel-collector:4318
        v
otel-collector
        |
        | jaeger:4317
        v
jaeger
```

---

# Dockerfile

The application uses a multi-stage Docker build.

```text
Builder
   |
   | npm ci
   | npm run build
   v
dist/
   |
   v
Production image
   |
   | production dependencies
   | compiled dist/
   v
npm start
```

The runtime command remains:

```bash
npm start
```

which executes:

```json
{
  "start": "node --import ./dist/instrumentation.js ./dist/server.js"
}
```

This ensures OpenTelemetry instrumentation is loaded before the Express application.

---

# Docker Compose Commands

Start:

```bash
docker compose up -d
```

Build and start:

```bash
docker compose up -d --build
```

Check services:

```bash
docker compose ps
```

View all logs:

```bash
docker compose logs
```

Follow logs:

```bash
docker compose logs -f
```

View one service:

```bash
docker compose logs -f node-observability
```

Restart one service:

```bash
docker compose restart node-observability
```

Stop and remove the Compose containers/network:

```bash
docker compose down
```

Rebuild only the Node.js service:

```bash
docker compose build node-observability
```

Recreate it:

```bash
docker compose up -d node-observability
```

---

# Troubleshooting

## Container name already exists

Example:

```text
Conflict. The container name "/jaeger" is already in use
```

Remove the old container:

```bash
docker rm -f jaeger
```

---

## Port already allocated

Example:

```text
Bind for 0.0.0.0:4317 failed: port is already allocated
```

If the collector only receives telemetry from other Compose services, don't publish its OTLP ports to the Windows host.

The collector can still listen internally on:

```text
4317
4318
```

---

## Check Docker ports

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

On Windows:

```powershell
netstat -ano | findstr :4317
```

---

## OTel Collector config mount error

Make sure the host filename in `compose.yml` exactly matches the actual file:

```yaml
volumes:
  - ./otel-collector-config.yml:/etc/otelcol-contrib/config.yaml:ro
```

`.yml` and `.yaml` are both valid YAML extensions, but the filename must match exactly.

---

## Pino permission error

If you see:

```text
EACCES: permission denied, mkdir './logs'
```

don't write logs to `./logs` in the container for this setup.

Pino should write structured logs to stdout:

```text
Pino
  ↓
stdout
  ↓
Docker
  ↓
Alloy
  ↓
Loki
```

---

# Observability Mental Model

One API request generates three primary telemetry signals:

```text
                    One API Request
                          |
            +-------------+-------------+
            |             |             |
            v             v             v
           Logs         Metrics       Traces
            |             |             |
            v             v             v
          Alloy       Prometheus      OTel
            |                         Collector
            v                             |
           Loki                           v
            |                           Jaeger
            +-------------+-------------+
                          |
                          v
                       Grafana
```

The goal is to answer production questions:

### Logs

**What happened?**

```text
User request failed
Database timeout
Invalid request
```

### Metrics

**How often and how badly is it happening?**

```text
Request rate
Error rate
Latency
P95
P99
```

### Traces

**Where did the request spend time or fail?**

```text
HTTP request
    ↓
Middleware
    ↓
Controller
    ↓
Database/external call
```

### Correlation

**Which logs belong to this exact request?**

```text
traceId
   |
   +── Application log
   +── HTTP span
   +── Custom span
   +── Downstream span
```

---

# Complete Startup

The entire local observability environment can now be started with:

```bash
docker compose up -d --build
```

Then:

```bash
docker compose ps
```

Generate traffic:

```bash
curl http://localhost:3000/users/128
```

And investigate the same request across:

```text
Logs
  ↓
Metrics
  ↓
Traces
  ↓
Grafana
```

This provides a complete local Node.js observability demonstration using Docker Compose.