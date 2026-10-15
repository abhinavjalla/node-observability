# Kubernetes — High-Level Notes

A practical reference covering Kubernetes fundamentals, architecture, workloads, networking, configuration, storage, health checks, scaling, and troubleshooting.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Kubernetes Architecture](#2-kubernetes-architecture)
3. [Core Kubernetes Objects](#3-core-kubernetes-objects)
4. [Pods, Deployments and ReplicaSets](#4-pods-deployments-and-replicasets)
5. [Kubernetes Networking](#5-kubernetes-networking)
6. [ConfigMaps and Secrets](#6-configmaps-and-secrets)
7. [Storage: Volumes, PV and PVC](#7-storage-volumes-pv-and-pvc)
8. [Health Checks and Resource Management](#8-health-checks-and-resource-management)
9. [Scaling, Rolling Updates and Rollbacks](#9-scaling-rolling-updates-and-rollbacks)
10. [Essential kubectl Commands](#10-essential-kubectl-commands)
11. [Orders and Payments Architecture](#11-orders-and-payments-architecture)
12. [Next Learning Topics](#12-next-learning-topics)

---

## 1. Introduction

Kubernetes (K8s) is a container orchestration platform used to deploy, scale, manage, and recover containerized applications.

### Key capabilities

- Deploy and manage containerized applications.
- Scale application replicas.
- Recover from container failures.
- Discover services and route network traffic.
- Manage configuration and secrets.
- Attach persistent storage.
- Monitor application health.
- Perform rolling updates and rollbacks.

### Docker vs. Kubernetes

| Docker | Kubernetes |
|---|---|
| Builds and runs containers | Orchestrates containerized workloads |
| Docker images package applications | Pods run containers |
| Docker Compose manages multi-container applications | Kubernetes manages workloads across a cluster |
| Container networking | Pod networking and Services |
| Compose configuration | Kubernetes YAML manifests |

Docker and Kubernetes are complementary technologies, not direct replacements for each other.

## 2. Kubernetes Architecture

A Kubernetes cluster consists of a control plane and worker nodes.

### Control Plane

| Component | Responsibility |
|---|---|
| API Server | Entry point for Kubernetes API requests |
| etcd | Stores cluster state and configuration |
| Scheduler | Selects a suitable node for each scheduled Pod |
| Controller Manager | Runs controllers that reconcile desired and actual state |

### Worker Node

| Component | Responsibility |
|---|---|
| kubelet | Ensures assigned Pods are running as specified |
| Container runtime | Runs containers, commonly containerd |
| Networking components | Enable communication between Pods, Services, and other endpoints |

### Desired State and Reconciliation

Kubernetes continuously works toward the desired state declared in resource specifications.

For example, if a Deployment specifies three replicas but only two are running, its controllers attempt to restore the desired replica count.

## 3. Core Kubernetes Objects

| Object | Purpose |
|---|---|
| Cluster | Kubernetes environment |
| Node | Machine that runs Pods |
| Pod | Smallest deployable unit |
| Deployment | Manages application replicas and updates |
| ReplicaSet | Maintains the desired number of Pod replicas |
| Service | Provides a stable network endpoint |
| ConfigMap | Stores non-sensitive configuration |
| Secret | Stores sensitive configuration data |
| Volume | Provides storage to containers |
| PersistentVolume (PV) | Represents a storage resource |
| PersistentVolumeClaim (PVC) | Requests persistent storage |
| StorageClass | Defines storage provisioning behavior |
| Ingress | Defines HTTP/HTTPS routing rules |

## 4. Pods, Deployments and ReplicaSets

### Pod

A Pod runs one or more closely related containers.

Important points:

- Containers in a Pod share a network namespace.
- Containers can share storage through mounted volumes.
- Pod IP addresses are not permanent.
- A standalone Pod is not automatically recreated when deleted.

### Deployment

A Deployment manages application replicas and releases through ReplicaSets.

Example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orders
  template:
    metadata:
      labels:
        app: orders
    spec:
      containers:
        - name: orders
          image: node-orders:1.0
          ports:
            - containerPort: 5000
```

This declares three desired Orders replicas.

### ReplicaSet

A ReplicaSet ensures the desired number of matching Pods are maintained.

**Remember:**
- Deployment manages application releases and replica configuration.
- ReplicaSet maintains the replica count.
- Pod runs the application containers.

## 5. Kubernetes Networking

### Why Services are needed

Pod IP addresses can change when Pods are replaced. Applications should normally communicate through Service names rather than hardcoded Pod IPs.

### Service types

| Type | Purpose |
|---|---|
| ClusterIP | Internal cluster communication; default type |
| NodePort | Exposes a Service through a port on cluster nodes |
| LoadBalancer | Requests integration with a load-balancer implementation |

### Service discovery

Orders can communicate with Payments using:

```text
http://payments:4000
```

This assumes the Payments Service is named `payments` and both workloads are in the same namespace.

The fully qualified DNS name is:

```text
payments.default.svc.cluster.local
```

### Ingress

Ingress defines HTTP/HTTPS routing rules for Services.

An Ingress controller must be installed and configured to implement those rules.

## 6. ConfigMaps and Secrets

Configuration should be separated from application code and container images.

### ConfigMap

Used for non-sensitive configuration, such as:

- `NODE_ENV`
- Application port
- Service URLs
- Feature flags

### Secret

Used for sensitive configuration, such as:

- Database passwords
- API tokens
- Credentials

Applications can receive these values through environment variables or mounted files.

**Security notes:**

- Base64 encoding is not encryption.
- Restrict Secret access using RBAC.
- Configure encryption at rest where appropriate.
- Avoid committing credentials to Git.
- Never print production secrets in application logs.

## 7. Storage: Volumes, PV and PVC

Container-local filesystems should not be relied upon to preserve application data across replacement containers.

| Concept | Description |
|---|---|
| Volume | Makes storage available inside a Pod |
| PersistentVolume (PV) | Represents provisioned storage |
| PersistentVolumeClaim (PVC) | Requests storage for an application |
| StorageClass | Defines dynamic storage provisioning |

### Typical storage flow

1. An application Pod references a PVC.
2. The PVC requests the required storage.
3. Kubernetes binds the claim to a suitable PV or dynamically provisions storage through a StorageClass.
4. The Pod mounts the storage at a specified path.

### PostgreSQL example

For PostgreSQL running in Kubernetes:

- Attach persistent storage to its data directory.
- Ensure replacement Pods can mount the same claim.
- Configure backups and recovery procedures.
- Use appropriate access controls.

Persistent storage does not replace database backups.

## 8. Health Checks and Resource Management

### Kubernetes probes

| Probe | Purpose |
|---|---|
| Startup probe | Determines whether application initialization has completed |
| Liveness probe | Determines whether the container should be restarted |
| Readiness probe | Determines whether the Pod should receive normal Service traffic |

Example Node.js health endpoints:

```text
/health/live
/health/ready
```

A failed readiness probe makes the Pod unready for normal Service traffic. A failed liveness probe can cause the container to restart after the configured failure threshold.

Avoid making liveness checks depend directly on every downstream service.

### Resource requests and limits

| Setting | Purpose |
|---|---|
| CPU request | CPU amount used for scheduling and resource allocation |
| Memory request | Memory amount used for scheduling |
| CPU limit | CPU usage ceiling |
| Memory limit | Memory boundary; exceeding it can cause an out-of-memory termination |

Example:

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "64Mi"
  limits:
    cpu: "500m"
    memory: "128Mi"
```

These are illustrative values. Production settings should be based on observed resource consumption.

## 9. Scaling, Rolling Updates and Rollbacks

### Scaling

Scale a Deployment to three replicas:

```powershell
kubectl scale deployment/orders --replicas=3
```

Scaling changes the number of Pods, not the CPU or memory assigned to each Pod.

### Rolling updates

Update the Orders image:

```powershell
kubectl set image deployment/orders orders=node-orders:2.0
```

Check rollout progress:

```powershell
kubectl rollout status deployment/orders
```

### Rollout history

```powershell
kubectl rollout history deployment/orders
```

### Rollback

Restore the previous Deployment revision:

```powershell
kubectl rollout undo deployment/orders
```

A rollback restores a previous Deployment template. It does not automatically reverse database migrations or external side effects.

## 10. Essential kubectl Commands

### Cluster information

```powershell
kubectl get nodes
kubectl config current-context
kubectl cluster-info
```

### Inspect resources

```powershell
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get replicasets
kubectl get pods -o wide
kubectl get pods --all-namespaces
```

### Troubleshooting

```powershell
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl logs deployment/orders
kubectl get events --sort-by=.metadata.creationTimestamp
```

Execute a command inside a Pod:

```powershell
kubectl exec -it <pod-name> -- sh
```

### Apply and delete YAML resources

```powershell
kubectl apply -f app.yaml
kubectl delete -f app.yaml
```

### Port-forwarding

```powershell
kubectl port-forward service/orders 5000:5000
```

### Scaling and rollouts

```powershell
kubectl scale deployment/orders --replicas=3
kubectl rollout status deployment/orders
kubectl rollout history deployment/orders
kubectl rollout undo deployment/orders
```

### Stop versus delete

Stop Deployment replicas while preserving the Deployment:

```powershell
kubectl scale deployment/orders --replicas=0
```

Delete a Deployment:

```powershell
kubectl delete deployment orders
```

Deleting a Pod directly does not stop its Deployment from creating a replacement.

## 11. Orders and Payments Architecture

The target architecture for the `node-observability` project is:

```text
Local Kubernetes Cluster
|
+-- Orders Deployment
|   +-- Orders Pod(s)
|   +-- Orders Service
|
+-- Payments Deployment
|   +-- Payments Pod(s)
|   +-- Payments Service
|
+-- PostgreSQL
|   +-- Database Pod or workload
|   +-- Persistent storage
|
+-- Observability Stack
    +-- Prometheus
    +-- Grafana
    +-- Grafana Alloy
    +-- Loki
    +-- Jaeger
    +-- OpenTelemetry Collector
```

### Application communication

Orders calls Payments through the Payments Service:

```text
http://payments:4000
```

The application configuration should use the appropriate Kubernetes Service DNS name.

### Database considerations

If Payments depends on PostgreSQL:

- Ensure the database hostname resolves within Kubernetes.
- Configure the correct database port and credentials.
- Use persistent storage if the database runs inside the cluster.
- Keep passwords in appropriately protected Secrets.
- Configure database backups.

### Observability considerations

The existing observability stack can be migrated after the application workloads are running reliably.

Key integrations include:

- Prometheus scraping application metrics.
- Grafana visualizing metrics and logs.
- Alloy collecting and forwarding logs.
- Loki storing logs.
- OpenTelemetry Collector receiving telemetry.
- Jaeger displaying distributed traces.

Each component needs appropriate Kubernetes configuration, networking, and persistent storage where required.

## 12. Next Learning Topics

Recommended topics for continuing Kubernetes learning:

1. YAML manifests and namespaces.
2. Ingress and HTTP routing.
3. Horizontal Pod Autoscaler (HPA).
4. Scheduling, RBAC, taints and tolerations.
5. Helm and Kustomize.
6. Kubernetes security and resource quotas.
7. Observability stack migration.
8. Production deployment and troubleshooting patterns.

---

## Quick Revision

The most important concepts to remember are:

- **Pod:** Runs application containers.
- **Deployment:** Manages replicas and application releases.
- **ReplicaSet:** Maintains the desired replica count.
- **Service:** Provides stable network access to Pods.
- **ConfigMap:** Stores non-sensitive configuration.
- **Secret:** Stores sensitive configuration data.
- **PVC:** Requests persistent storage.
- **Readiness probe:** Controls whether a Pod is ready for normal traffic.
- **Liveness probe:** Helps Kubernetes detect containers that should be restarted.
- **Rolling update:** Deploys a new application version gradually.
- **Rollback:** Restores a previous Deployment revision.
- **kubectl:** Command-line tool for managing Kubernetes resources.
