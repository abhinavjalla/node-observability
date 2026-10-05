# Node.js Observability Demo

## 1. Overview

This project demonstrates **Observability for Node.js microservices** using:

- **Logs** → Loki
- **Metrics** → Prometheus
- **Traces** → Jaeger
- **Visualization** → Grafana
- **Instrumentation and telemetry collection** → OpenTelemetry

The main demo scenario contains two Node.js services:

- **Orders** service — port `5000`
- **Payments** service — port `4000`

The Orders service makes an HTTP request to the Payments service.

---

# 2. Observability Architecture

Observability consists of three primary telemetry signals:

```text
                       OBSERVABILITY
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
           Logs           Metrics        Traces
             │              │              │
            Loki         Prometheus      Jaeger
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                         Grafana
```

### Three pillars

| Signal | Purpose | Backend |
|---|---|---|
| Logs | Detailed application events and errors | Loki |
| Metrics | Numeric measurements over time | Prometheus |
| Traces | Request journey across services | Jaeger |

### Simple explanation

- **Logs** tell us **what happened**.
- **Metrics** tell us **how the system is behaving**.
- **Traces** tell us **where a request travelled and where time was spent**.

---

# 3. Application Architecture

The demo has two Node.js services.

```text
                         Client
                           │
                           ▼
                    ┌────────────┐
                    │   Orders   │
                    │   :5000    │
                    └─────┬──────┘
                          │
                   HTTP request
                          │
                          ▼
                    ┌────────────┐
                    │  Payments  │
                    │   :4000    │
                    └────────────┘
```

Example request flow:

```text
Client
  │
  │ POST /create-order
  ▼
Orders :5000
  │
  │ POST /payment
  ▼
Payments :4000
```

The important point is that one client request can generate activity in multiple services.

Without distributed tracing, it can be difficult to understand the complete request journey.

---

# 4. Complete Observability Architecture

OpenTelemetry is used to instrument the applications and send telemetry to the observability infrastructure.

```text
                         Client
                            │
                            ▼
                     ┌────────────┐
                     │   Orders   │
                     │   :5000    │
                     └─────┬──────┘
                           │
                     HTTP request
                           │
                           ▼
                     ┌────────────┐
                     │  Payments  │
                     │   :4000    │
                     └────────────┘


              ┌────────────────────────┐
              │   OpenTelemetry        │
              │   Instrumentation      │
              └────────────┬───────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ OTEL Collector│
                   └───────┬───────┘
                           │
              ┌────────────┼─────────────┐
              ▼            ▼             ▼
           Jaeger       Prometheus      Loki
           Traces        Metrics         Logs
              │            │             │
              └────────────┼─────────────┘
                           ▼
                        Grafana
```

> Note: In this demo, Prometheus can scrape the application's `/metrics` endpoint directly. The exact metrics pipeline can therefore differ from the trace pipeline.

---

# 5. OpenTelemetry

## What is OpenTelemetry?

OpenTelemetry is an open-source observability framework used to generate, collect, and export telemetry.

It supports:

- Traces
- Metrics
- Logs

For this demo, OpenTelemetry is primarily used for distributed tracing and instrumentation.

---

# 6. OpenTelemetry Packages

| Package | Purpose |
|---|---|
| `@opentelemetry/api` | API used by the application to create/use traces, spans, and context |
| `@opentelemetry/sdk-node` | Main Node.js OpenTelemetry SDK |
| `@opentelemetry/auto-instrumentations-node` | Automatically instruments supported HTTP, Express, DB clients, etc. |
| `@opentelemetry/exporter-trace-otlp-http` | Sends traces to the OTEL Collector using OTLP HTTP |
| `@opentelemetry/exporter-metrics-otlp-http` | Sends OTEL metrics to the Collector when using OTEL metrics |
| `@opentelemetry/resources` | Defines service/resource information |
| `@opentelemetry/semantic-conventions` | Provides standard telemetry attribute names |

---

# 7. Instrumentation vs Telemetry

## Instrumentation

Instrumentation means adding the capability to observe an application.

For example:

```text
HTTP request
     │
     ▼
Instrumentation
     │
     ├── creates span
     ├── captures request information
     ├── captures response information
     └── propagates trace context
```

## Telemetry

Telemetry is the actual data produced while the application runs.

Examples:

```text
Trace
Metric
Log
```

### Simple explanation

> Instrumentation is the mechanism that produces observability data. Telemetry is the data itself.

---

# 8. Distributed Tracing

The main tracing scenario is:

```text
Client
  │
  │ Request
  ▼
Orders
  │
  │ Trace ID = ABC123
  │
  │ HTTP request + trace context
  ▼
Payments
  │
  │ Trace ID = ABC123
  │
  ▼
Response
```

The same **Trace ID** is propagated across services.

Each operation gets its own **Span ID**.

Example:

```text
Trace ID: ABC123

Orders Span
    Span ID: O111
       │
       ▼
Payments Span
    Span ID: P222
```

Therefore:

```text
Trace ID
    = identifies the complete request

Span ID
    = identifies one operation within that request
```

---

# 9. Distributed Trace Example

A request:

```text
Client
  │
  │ POST /create-order
  ▼
Orders :5000
  │
  │ POST /payment
  ▼
Payments :4000
```

In Jaeger, this can appear as:

```text
Trace ABC123
│
├── Orders
│     └── POST /create-order
│
└── Payments
      └── POST /payment
```

This allows us to answer:

- Which services were involved?
- How long did each service take?
- Which service failed?
- Where was latency introduced?
- What was the Trace ID?

---

# 10. Trace Context Propagation

When Orders calls Payments, OpenTelemetry automatically propagates trace context through the HTTP request when the relevant HTTP instrumentation is active.

Conceptually:

```text
Orders
  │
  │ Trace Context
  │
  │ traceparent
  ▼
Payments
```

Payments extracts the context and creates a child span.

Therefore both services belong to the same distributed trace.

---

# 11. Jaeger

Jaeger is the tracing backend used in this demo.

Jaeger stores and provides access to distributed traces.

### Jaeger UI

```text
http://localhost:16686/search
```


---

# 12. Grafana

Grafana is the visualization layer.

```text
Prometheus ──┐
             │
Jaeger ──────┼──→ Grafana
             │
Loki ────────┘
```


 Grafana datasource configuration becomes:

```text
Grafana
   │
   ├── Prometheus → http://prometheus:9090
   ├── Jaeger     → http://jaeger:16686
   └── Loki       → http://loki:3100

Grafana can query multiple observability backends from one UI.

### Grafana

```text
http://localhost:3001/
```

### Jaeger datasource in Grafana

When Grafana is running inside Docker on the same Docker network as Jaeger, use:

```text
http://jaeger:16686
```

Do not use `localhost:16686` from inside the Grafana container because `localhost` refers to the Grafana container itself.

---

# 13. Metrics

Metrics are **numeric measurements collected over time**.

Examples:

```text
http_requests_total
http_request_duration_seconds
http_request_errors_total
```

Metrics are useful for understanding overall application behavior.

For example:

```text
How many requests are we receiving?

What percentage are successful?

What percentage are failing?

How many requests per second?

What is the latency?

Which endpoint has the most errors?
```

---

# 14. Metrics Architecture

The demo uses the Prometheus pull/scrape model.

```text
              Node.js Orders
                    │
                    │ /metrics
                    ▼
               Prometheus
                    │
                 PromQL
                    │
                    ▼
                 Grafana
```

The Node.js application exposes metrics through:

```text
http://localhost:5002/metrics
```

Prometheus periodically scrapes this endpoint.

---

# 15. `/metrics` Endpoint

Open:

```text
http://localhost:5002/metrics
```

You should see metrics similar to:

```text
http_requests_total{
  method="GET",
  route="/users/:id",
  status_code="200"
} 10
```

The important labels are:

```text
method
route
status_code
```

The route should use a normalized route such as:

```text
/users/:id
```

rather than:

```text
/users/1
/users/2
/users/3
```

This avoids unnecessary metric cardinality.

---

# 16. Prometheus

Prometheus stores time-series metrics and provides the PromQL query language.

### Prometheus UI

```text
http://localhost:9090/query
```

---

# 17. Basic Prometheus Queries

## All HTTP requests

```promql
http_requests_total
```

## Requests for `/users/:id`

```promql
http_requests_total{
  route="/users/:id"
}
```

## Total `/users/:id` requests in the last 24 hours

```promql
100 *
sum(
  increase(
    http_requests_total{
      route="/users/:id",
      status_code=~"2.."
    }[24h]
  )
)
/
sum(
  increase(
    http_requests_total{
      route="/users/:id"
    }[24h]
  )
)
```



## Failed request rate `/users/:id` requests in the last 24 hours

```promql
100 *
sum(
  increase(
    http_requests_total{
      route="/users/:id",
      status_code=~"4..|5.."
    }[24h]
  )
)
/
sum(
  increase(
    http_requests_total{
      route="/users/:id"
    }[24h]
  )
)
```

---

# 18. Success Rate

For `/users/:id`, the 24-hour success rate is:

```promql
100 *
sum(
  increase(
    http_requests_total{
      route="/users/:id",
      status_code=~"2.."
    }[24h]
  )
)
/
sum(
  increase(
    http_requests_total{
      route="/users/:id"
    }[24h]
  )
)
```
Total Requests
```

---

# 19. Error Rate

For `/users/:id`:

```promql
100 *
sum(
  increase(
    http_requests_total{
      route="/users/:id",
      status_code=~"4..|5.."
    }[24h]
  )
)
/
sum(
  increase(
    http_requests_total{
      route="/users/:id"
    }[24h]
  )
)
```

Conceptually:

```text
Error Rate
=
4xx + 5xx Requests
------------------- × 100
Total Requests
```

---

# 19. Logs

Logs provide detailed information about what happened inside the application.

Example:

```json
{
  "level": 30,
  "msg": "GET /users/21",
  "traceId": "ABC123",
  "spanId": "DEF456",
  "statusCode": 200
}
```

The important connection is the Trace ID.

```text
Trace ID
   │
   ├── Jaeger trace
   │
   └── Loki logs
```

This allows us to move from a trace to the corresponding application logs.

---

# 20. Loki

Loki is the log aggregation backend.

Typical flow:

```text
Node.js
   │
   │ Application logs
   ▼
Alloy / Log collector
   │
   ▼
Loki
   │
   ▼
Grafana
```

In Grafana, Loki can be queried using LogQL.

Loki Datasource url in grafana http://loki:3100

Example:

```logql
{job=~".+"}
```

To search for a specific Trace ID:

```logql
{service_name=~".+"}
| json
| traceId="TRACE_ID"
| msg !~ ".*(/metrics|/health|/healthz).*"
```

Replace `TRACE_ID` with the actual trace ID.

---


# 21. Useful URLs

| Component | URL |
|---|---|
| Orders API | `http://localhost:5002` |
| Orders Metrics | `http://localhost:5002/metrics` |
| Prometheus | `http://localhost:9090/query` |
| Jaeger | `http://localhost:16686/search` |
| Grafana | `http://localhost:3001/` |
| Jaeger datasource from Grafana container | `http://jaeger:16686` |

---
