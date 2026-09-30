# Node.js Observability

A production-oriented Node.js observability setup demonstrating the three pillars of observability:

* **Logs** — Pino + Grafana Alloy + Loki
* **Metrics** — prom-client + Prometheus
* **Traces** — OpenTelemetry + OpenTelemetry Collector + Jaeger
* **Visualization** — Grafana

The project demonstrates how logs, metrics, and distributed traces can be collected, stored, queried, and visualized locally using Docker.

---

## Architecture

```text
                         ┌─────────────────────┐
                         │       Node.js       │
                         │    User Service     │
                         │     :3000           │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              │                     │                     │
              ▼                     ▼                     ▼
        ┌───────────┐        ┌──────────────┐      ┌──────────────┐
        │   Pino    │        │ prom-client  │      │ OpenTelemetry│
        │   Logs    │        │   Metrics    │      │    Traces    │
        └─────┬─────┘        └──────┬───────┘      └──────┬───────┘
              │                     │                     │
              ▼                     ▼                     ▼
        ┌───────────┐        ┌──────────────┐      ┌─────────────────┐
        │ app.log   │        │ /metrics     │      │ OTel Collector  │
        └─────┬─────┘        └──────┬───────┘      │    :4317/:4318  │
              │                     │               └────────┬────────┘
              ▼                     ▼                        │
        ┌───────────┐        ┌──────────────┐                 ▼
        │   Alloy   │        │  Prometheus  │          ┌───────────┐
        │  Collector│        │    :9090     │          │   Jaeger  │
        └─────┬─────┘        └──────┬───────┘          │   :16686  │
              │                     │                  └─────┬─────┘
              ▼                     │                        │
        ┌───────────┐                │                        │
        │   Loki    │                │                        │
        │   :3100   │                │                        │
        └─────┬─────┘                │                        │
              │                     │                        │
              └─────────────────────┼────────────────────────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │   Grafana   │
                             │    :3001    │
                             └─────────────┘
```

---

# Observability Flow

## Logs

```text
Node.js
   │
   ▼
Pino
   │
   ▼
logs/app.log
   │
   ▼
Grafana Alloy
   │
   ▼
Loki
   │
   ▼
Grafana
```

Pino writes structured JSON logs to:

```text
logs/app.log
```

The logs contain OpenTelemetry correlation information:

```json
{
  "traceId": "a666743613bfbbc3f2aa148e7cad033b",
  "spanId": "b34a6d6641f59edc",
  "msg": "Fetching user"
}
```

This allows application logs to be correlated with distributed traces.

---

# Metrics

```text
Node.js
   │
   │ /metrics
   ▼
Prometheus
   │
   ▼
Grafana
```

The Node.js application exposes Prometheus metrics through:

```text
GET /metrics
```

Example metrics include:

```text
http_requests_total
http_request_errors_total
http_request_duration_seconds
```

Prometheus periodically scrapes the `/metrics` endpoint.

---

# Traces

```text
Node.js
   │
   │ OpenTelemetry
   ▼
OTel Collector
   │
   ▼
Jaeger
   │
   ▼
Grafana / Jaeger UI
```

OpenTelemetry instruments HTTP requests and application operations.

A request such as:

```text
GET /users/131
```

can produce a trace containing multiple spans:

```text
Trace
│
├── GET
│
├── request handler - /users/:id
│
└── get-user
```

All spans belonging to the same request share the same Trace ID.

---

# Components

| Component               | Purpose                     |      Port |
| ----------------------- | --------------------------- | --------: |
| Node.js                 | Application                 |      3000 |
| Grafana Alloy           | Log collection              |  Internal |
| Loki                    | Log storage                 |      3100 |
| Prometheus              | Metrics storage             |      9090 |
| OpenTelemetry Collector | Trace collection/processing | 4317/4318 |
| Jaeger                  | Trace storage/UI            |     16686 |
| Grafana                 | Visualization               |      3001 |

---

# Prerequisites

Install the following:

* Node.js
* npm
* Docker Desktop
* Git

Verify:

```powershell
node --version
npm --version
docker --version
docker compose version
```

Docker Desktop must be running.

---

# Project Structure

A simplified project structure:

```text
node-observability/
│
├── src/
│   ├── instrumentation.ts
│   ├── logger.ts
│   ├── metrics.ts
│   └── ...
│
├── logs/
│   └── app.log
│
├── alloy-config.alloy
├── loki-config.yml
├── prometheus.yml
├── otel-collector-config.yml
├── package.json
├── tsconfig.json
└── README.md
```

---

# Running the Node.js Application

Install dependencies:

```powershell
npm install
```

Build the TypeScript application:

```powershell
npm run build
```

Start the application with OpenTelemetry instrumentation:

```powershell
node -r ./dist/instrumentation.js ./dist/index.js
```

The application should be available at:

```text
http://localhost:3000
```

---

# Test the Application

Test the user API:

```powershell
Invoke-RestMethod http://localhost:3000/users/131
```

Test Prometheus metrics:

```powershell
Invoke-WebRequest http://localhost:3000/metrics
```

Check the log file:

```powershell
Get-Content .\logs\app.log -Tail 20
```

---

# OpenTelemetry Collector

The OpenTelemetry Collector receives telemetry from the Node.js application.

The main pipeline is:

```text
Node.js
   │
   ▼
OTLP
   │
   ▼
OpenTelemetry Collector
   │
   ▼
Jaeger
```

The Collector exposes:

```text
4317 - OTLP gRPC
4318 - OTLP HTTP
```

The Collector forwards traces to Jaeger.

---

# Jaeger

Jaeger provides trace visualization.

Open:

```text
http://localhost:16686
```

After generating a request:

```powershell
Invoke-RestMethod http://localhost:3000/users/131
```

search for the service and inspect the generated trace.

A trace should contain spans similar to:

```text
GET /users/:id
│
├── request handler - /users/:id
│
└── get-user
```

---

# Prometheus

Prometheus collects metrics from:

```text
http://localhost:3000/metrics
```

Prometheus UI:

```text
http://localhost:9090
```

Example PromQL:

```promql
rate(http_requests_total[5m])
```

Request error rate:

```promql
rate(http_request_errors_total[5m])
```

Average request latency:

```promql
rate(http_request_duration_seconds_sum[5m])
/
rate(http_request_duration_seconds_count[5m])
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

# Loki

Loki stores application logs.

Health check:

```powershell
curl http://localhost:3100/ready
```

Expected:

```text
ready
```

Loki API:

```text
http://localhost:3100
```

Example LogQL query:

```logql
{service="user-service"}
```

Search for a particular message:

```logql
{service="user-service"} |= "Fetching user"
```

Search using a Trace ID:

```logql
{service="user-service"} |= "a666743613bfbbc3f2aa148e7cad033b"
```

---

# Grafana Alloy

Grafana Alloy tails the Pino log file and sends logs to Loki.

Current flow:

```text
logs/app.log
     │
     ▼
Grafana Alloy
     │
     ▼
Loki
```

Alloy reads:

```text
/var/log/node-observability/app.log
```

which is mapped from the local project:

```text
./logs/app.log
```

The Alloy configuration uses:

```alloy
loki.write "local" {
  endpoint {
    url = "http://host.docker.internal:3100/loki/api/v1/push"
  }
}

loki.source.file "node_logs" {
  targets = [
    {
      __path__ = "/var/log/node-observability/app.log",
      service = "user-service",
      environment = "development",
    },
  ]

  forward_to = [loki.write.local.receiver]
}
```

---

# Starting Loki

Create/start Loki:

```powershell
docker run -d `
  --name loki `
  -p 3100:3100 `
  -v "${PWD}\loki-config.yml:/etc/loki/config.yml" `
  -v loki-data:/loki `
  --entrypoint /usr/bin/loki `
  grafana/loki:latest `
  "-config.file=/etc/loki/config.yml"
```

Verify:

```powershell
curl http://localhost:3100/ready
```

---

# Starting Grafana Alloy

Start Alloy:

```powershell
docker run -d `
  --name alloy `
  -v "${PWD}\alloy-config.alloy:/etc/alloy/config.alloy" `
  -v "${PWD}\logs:/var/log/node-observability" `
  grafana/alloy:latest `
  run /etc/alloy/config.alloy
```

Check:

```powershell
docker ps --filter "name=alloy"
```

Check logs:

```powershell
docker logs alloy
```

You should see:

```text
Alloy is running
```

and:

```text
start tailing file
```

---

# Starting Prometheus

Start Prometheus using the project's Prometheus configuration:

```powershell
docker run -d `
  --name prometheus `
  -p 9090:9090 `
  -v "${PWD}\prometheus.yml:/etc/prometheus/prometheus.yml" `
  prom/prometheus:latest
```

Open:

```text
http://localhost:9090
```

Check:

**Status → Targets**

The Node.js application's `/metrics` endpoint should be listed as a target.

---

# Starting Jaeger

Start Jaeger:

```powershell
docker run -d `
  --name jaeger `
  -p 16686:16686 `
  jaegertracing/all-in-one:latest
```

Open:

```text
http://localhost:16686
```

---

# Starting Grafana

Start Grafana:

```powershell
docker run -d `
  --name grafana `
  -p 3001:3000 `
  grafana/grafana:latest
```

Open:

```text
http://localhost:3001
```

Default credentials:

```text
Username: admin
Password: admin
```

Grafana will ask you to change the password during initial login.

---

# Grafana Data Sources

Grafana should be configured with three data sources.

## Loki

For Loki:

```text
http://host.docker.internal:3100
```

## Prometheus

For Prometheus:

```text
http://host.docker.internal:9090
```

## Jaeger

Grafana and Jaeger must share a Docker network.

Create the network:

```powershell
docker network create observability
```

Connect Jaeger:

```powershell
docker network connect observability jaeger
```

Connect Grafana:

```powershell
docker network connect observability grafana
```

Then configure the Jaeger data source using:

```text
http://jaeger:16686
```

---

# Grafana Dashboard

The dashboard can contain panels for:

### Request Rate

```promql
rate(http_requests_total[5m])
```

### Error Rate

```promql
rate(http_request_errors_total[5m])
```

### P95 Latency

```promql
histogram_quantile(
  0.95,
  sum by (le) (
    rate(http_request_duration_seconds_bucket[5m])
  )
)
```

### Application Logs

```logql
{service="user-service"}
```

### Error Logs

```logql
{service="user-service"} |= "error"
```

---

# Trace Correlation

The application adds OpenTelemetry context to Pino logs.

Example:

```json
{
  "traceId": "a666743613bfbbc3f2aa148e7cad033b",
  "spanId": "b34a6d6641f59edc",
  "msg": "Fetching user"
}
```

This allows the same request to be followed across:

```text
Log
 │
 │ traceId
 ▼
Trace
 │
 ├── HTTP span
 ├── request handler span
 └── get-user span
```

Example Loki query:

```logql
{service="user-service"} |= "a666743613bfbbc3f2aa148e7cad033b"
```

The corresponding trace can then be opened in Jaeger.

---

# Complete Local Stack

After all services are running:

```text
Node.js
localhost:3000
     │
     ├─────────────── Logs ────────────────┐
     │                                     │
     │                                     ▼
     │                                   Pino
     │                                     │
     │                                  app.log
     │                                     │
     │                                     ▼
     │                                   Alloy
     │                                     │
     │                                     ▼
     │                                   Loki
     │                                     │
     │                                     │
     │                                     ▼
     │                                   Grafana
     │
     ├────────────── Metrics ──────────────┐
     │                                     │
     │                                  /metrics
     │                                     │
     │                                     ▼
     │                                  Prometheus
     │                                     │
     │                                     ▼
     │                                   Grafana
     │
     └─────────────── Traces ──────────────┐
                                           │
                                     OpenTelemetry
                                           │
                                           ▼
                                   OTel Collector
                                           │
                                           ▼
                                         Jaeger
                                           │
                                           ▼
                                        Grafana
```

---

# Useful Docker Commands

List observability containers:

```powershell
docker ps
```

Check a specific container:

```powershell
docker ps --filter "name=grafana"
docker ps --filter "name=loki"
docker ps --filter "name=alloy"
docker ps --filter "name=prometheus"
docker ps --filter "name=jaeger"
```

View logs:

```powershell
docker logs grafana
docker logs loki
docker logs alloy
docker logs prometheus
docker logs jaeger
```

Follow logs:

```powershell
docker logs -f alloy
```

Stop a container:

```powershell
docker stop grafana
```

Start it again:

```powershell
docker start grafana
```

Remove a container:

```powershell
docker rm -f grafana
```

---

# Troubleshooting

## Loki returns no logs

Check Alloy:

```powershell
docker logs alloy
```

Verify that Alloy can see the log file:

```powershell
docker exec alloy ls -l /var/log/node-observability
```

Verify Loki:

```powershell
curl http://localhost:3100/ready
```

Query Loki:

```powershell
Invoke-RestMethod `
  -Uri 'http://localhost:3100/loki/api/v1/query_range?query={service="user-service"}&limit=20'
```

---

## Jaeger doesn't appear in Grafana

Make sure Grafana and Jaeger share the same Docker network:

```powershell
docker network inspect observability
```

Both containers should appear:

```text
grafana
jaeger
```

Use this URL in Grafana:

```text
http://jaeger:16686
```

---

## Grafana cannot connect to Loki

From Grafana's Docker container perspective, use:

```text
http://host.docker.internal:3100
```

not:

```text
http://localhost:3100
```

because `localhost` inside the Grafana container refers to the Grafana container itself.

---

# Observability Concepts Demonstrated

This project demonstrates:

* Structured logging
* Log aggregation
* Log querying with LogQL
* Metrics instrumentation
* Prometheus scraping
* PromQL
* RED metrics
* HTTP latency histograms
* Distributed tracing
* Trace IDs
* Span IDs
* OpenTelemetry instrumentation
* OpenTelemetry Collector
* Jaeger
* Grafana Alloy
* Loki
* Prometheus
* Grafana
* Logs-to-traces correlation
* Docker-based observability infrastructure

---



---

# Learning Architecture

The project is intentionally structured around the three pillars:

```text
                OBSERVABILITY
                     │
        ┌────────────┼────────────┐
        │            │            │
       Logs        Metrics      Traces
        │            │            │
       Pino      prom-client  OpenTelemetry
        │            │            │
      Alloy      Prometheus   OTel Collector
        │            │            │
       Loki         └────┬────── Jaeger
        │                 │         │
        └─────────────────┴─────────┘
                          │
                       Grafana
```

This provides a foundation for moving from local Node.js observability to production Kubernetes/Azure observability.
