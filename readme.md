# Node.js Observability

A Node.js observability project with separate Docker Compose configurations for the database, observability stack, Orders service, and Payments service.

## Prerequisites

Install:

- Docker Desktop
- Docker Compose
- Git

Verify:

```bash
docker --version
docker compose version
git --version
```

Make sure Docker Desktop is running.

---

## Clone Repository

```bash
git clone https://github.com/abhinavjalla/node-observability.git
```

```bash
cd node-observability
```

---

## Project Structure

```text
node-observability/
│
├── db/
│   └── compose.yml
│
├── observability/
│   └── compose.yml
│
├── orders/
│   ├── Dockerfile
│   └── compose.yml
│
├── payments/
│   ├── Dockerfile
│   └── compose.yml
│
├── reusable/
│   └── ...
│
└── package.json
```

---

# Setup

## 1. Create Docker Network

The application services and observability components use a shared Docker network.

```bash
docker network create observability-network
```

If the network already exists, no action is required.

Verify:

```bash
docker network ls
```

---

# Start the Application

Start the components in the following order.

## 2. Start Database

```bash
docker compose -f ./db/compose.yml up -d
```

Verify:

```bash
docker ps
```

---

## 3. Start Observability Stack

Start the monitoring and observability components:

- Prometheus
- Grafana
- Jaeger
- Loki
- Grafana Alloy
- OpenTelemetry Collector

```bash
docker compose -f ./observability/compose.yml up -d
```

Verify:

```bash
docker ps
```

---

## 4. Start Payments Service

```bash
docker compose -f ./payments/compose.yml up -d
```

Verify:

```bash
docker ps
```

---

## 5. Start Orders Service

```bash
docker compose -f ./orders/compose.yml up -d
```

Verify:

```bash
docker ps
```

---

# Start Everything

For a complete startup, run:

```bash
docker network create observability-network
```

If the network already exists, continue with:

```bash
docker compose -f ./db/compose.yml up -d

docker compose -f ./observability/compose.yml up -d

docker compose -f ./payments/compose.yml up -d

docker compose -f ./orders/compose.yml up -d
```

Check all containers:

```bash
docker ps
```

---

# Application URLs

## Orders

```text
http://localhost:5002
```

Metrics:

```text
http://localhost:5002/metrics
```

## Payments

```text
http://localhost:4002
```

Metrics:

```text
http://localhost:4002/metrics
```

---

# Observability URLs

## Grafana

```text
http://localhost:3001
```

## Prometheus

```text
http://localhost:9090
```

## Jaeger

```text
http://localhost:16686
```

## Loki

```text
http://localhost:3100
```

---

# Test the Application

Create an order using PowerShell:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:5002/create-order" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"productId":10,"quantity":2,"userId":1001}'
```

Using curl:

```bash
curl -X POST http://localhost:5002/create-order \
  -H "Content-Type: application/json" \
  -d '{"productId":10,"quantity":2,"userId":1001}'
```

---

# Check Application Logs

Orders:

```bash
docker logs node-orders
```

Follow Orders logs:

```bash
docker logs -f node-orders
```

Payments:

```bash
docker logs node-payments
```

Follow Payments logs:

```bash
docker logs -f node-payments
```

---

# Check Metrics

Open:

```text
http://localhost:5002/metrics
```

or:

```text
http://localhost:4002/metrics
```

Prometheus:

```text
http://localhost:9090
```

---

# Stop the Application

Stop services in reverse dependency order.

## 1. Stop Orders

```bash
docker compose -f ./orders/docker-compose.yml down
```

## 2. Stop Payments

```bash
docker compose -f ./payments/docker-compose.yml down
```

## 3. Stop Observability Stack

```bash
docker compose -f ./observability/docker-compose.yml down
```

## 4. Stop Database

```bash
docker compose -f ./db/docker-compose.yml down
```

---

# Stop Everything

```bash
docker compose -f ./orders/compose.yml down

docker compose -f ./payments/compose.yml down

docker compose -f ./observability/compose.yml down

docker compose -f ./db/compose.yml down
```

---

# Restart Existing Containers

If the containers already exist and you only want to start them:

```bash
docker compose -f ./db/compose.yml start

docker compose -f ./observability/compose.yml start

docker compose -f ./payments/compose.yml start

docker compose -f ./orders/compose.yml start
```

---

# Rebuild Services

If the Orders or Payments source code or Dockerfile changes:

```bash
docker compose -f ./payments/compose.yml up -d --build

docker compose -f ./orders/compose.yml up -d --build
```

---

# Check Container Status

```bash
docker ps
```

For stopped containers as well:

```bash
docker ps -a
```

---

# Check Docker Network

```bash
docker network inspect observability-network
```

---

# Troubleshooting

## Check Orders Logs

```bash
docker logs node-orders
```

## Check Payments Logs

```bash
docker logs node-payments
```

## Check OpenTelemetry Collector

```bash
docker logs otel-collector
```

## Check Grafana Alloy

```bash
docker logs alloy
```

## Check Prometheus

```bash
docker logs prometheus
```

## Check Loki

```bash
docker logs loki
```

## Check Jaeger

```bash
docker logs jaeger
```

---

# Database Data

`docker compose down` does not remove Docker volumes by default.

To remove the database container and its volumes:

```bash
docker compose -f ./db/compose.yml down -v
```

**Warning:** This removes the persisted database data.