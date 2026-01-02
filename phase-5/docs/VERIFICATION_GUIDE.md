# Deployment Verification Guide

This guide shows you how to check and verify all components of the Phase-5 Todo App deployment: **Grafana, Dapr, Kubernetes, Helm, and Kafka**.

## Quick Verification Script

Run the automated verification script:

```bash
cd phase-5
./scripts/verify-deployment.sh
```

This script checks all components and provides access URLs.

---

## Manual Verification Steps

### 1. Kubernetes Verification

#### Check Cluster Connection
```bash
kubectl cluster-info
kubectl get nodes
```

#### Check All Pods
```bash
# All pods
kubectl get pods -A

# Application pods
kubectl get pods -l app=backend
kubectl get pods -l app=frontend
kubectl get pods -l app=recurring-task-service
kubectl get pods -l app=notification-service
```

#### Check Services
```bash
kubectl get services
kubectl get svc -l app=backend
kubectl get svc -l app=frontend
```

#### Check Pod Logs
```bash
# Backend logs
kubectl logs -f -l app=backend

# Frontend logs
kubectl logs -f -l app=frontend

# Specific pod logs
kubectl logs <pod-name>
```

---

### 2. Helm Verification

#### Check Helm Installation
```bash
helm version
```

#### List Helm Releases
```bash
helm list
helm list -A  # All namespaces
```

#### Check Helm Repositories
```bash
helm repo list
```

#### Inspect Helm Release
```bash
# Get release details
helm get all todo-app

# Get release values
helm get values todo-app

# Get release manifest
helm get manifest todo-app
```

#### Check Helm Chart Status
```bash
helm status todo-app
helm status kafka
helm status prometheus
```

---

### 3. Dapr Verification

#### Check Dapr CLI
```bash
dapr --version
```

#### Check Dapr System Pods
```bash
kubectl get pods -n dapr-system
```

Expected pods:
- `dapr-operator-*`
- `dapr-sentry-*`
- `dapr-placement-server-*`
- `dapr-sidecar-injector-*`

#### Check Dapr Components
```bash
# All components
kubectl get components -A

# Specific component
kubectl get component kafka-pubsub
kubectl get component statestore-postgresql
kubectl get component secretstore-kubernetes
kubectl get component jobs-scheduler
```

#### Check Dapr Configurations
```bash
kubectl get configurations -A
kubectl get configuration dapr-config -o yaml
```

#### Check Dapr Sidecars
```bash
# List pods with Dapr sidecars
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}' | grep daprd

# Check specific pod for Dapr sidecar
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[*].name}'
```

#### Access Dapr Dashboard
```bash
# Start Dapr dashboard
dapr dashboard -k

# Then visit: http://localhost:8080
```

#### Test Dapr Pub/Sub
```bash
# Get backend pod name
BACKEND_POD=$(kubectl get pods -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Test publishing an event
kubectl exec -it $BACKEND_POD -- curl -X POST http://localhost:3500/v1.0/publish/kafka-pubsub/task-events \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","event_type":"test","data":{}}'
```

---

### 4. Kafka Verification

#### Check Kafka Pods
```bash
kubectl get pods -l app.kubernetes.io/name=kafka
```

#### Check Kafka Service
```bash
kubectl get svc -l app.kubernetes.io/name=kafka
```

#### List Kafka Topics
```bash
# Get Kafka pod name
KAFKA_POD=$(kubectl get pods -l app.kubernetes.io/name=kafka -o jsonpath='{.items[0].metadata.name}')

# List topics
kubectl exec $KAFKA_POD -- kafka-topics.sh --bootstrap-server localhost:9092 --list
```

Expected topics:
- `task-events`
- `reminders`
- `task-updates`

#### Check Topic Details
```bash
# Get topic details
kubectl exec $KAFKA_POD -- kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe --topic task-events
```

#### Test Kafka Producer/Consumer
```bash
# Producer (in one terminal)
kubectl exec -it $KAFKA_POD -- kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic task-events

# Consumer (in another terminal)
kubectl exec -it $KAFKA_POD -- kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic task-events \
  --from-beginning
```

#### Check Kafka Helm Release
```bash
helm status kafka
helm get values kafka
```

---

### 5. Grafana Verification

#### Check Grafana Pods
```bash
kubectl get pods -l app.kubernetes.io/name=grafana
```

#### Check Grafana Service
```bash
kubectl get svc -l app.kubernetes.io/name=grafana
```

#### Access Grafana

**Option 1: NodePort (Minikube)**
```bash
# Get Minikube IP
minikube ip

# Access Grafana
# URL: http://<minikube-ip>:30000
# Username: admin
# Password: admin
```

**Option 2: Port Forward**
```bash
kubectl port-forward svc/grafana 30000:3000

# Then visit: http://localhost:30000
# Username: admin
# Password: admin
```

#### Verify Grafana Dashboards

Once logged in, check for these dashboards:
1. **Kafka Dashboard** - Kafka metrics and performance
2. **Dapr Dashboard** - Dapr component metrics
3. **Recurring Tasks Dashboard** - Recurring task service metrics
4. **Reminders Dashboard** - Notification service metrics

#### Check Grafana Data Sources
- Navigate to: Configuration → Data Sources
- Verify Prometheus data source is configured
- Test the connection

---

### 6. Prometheus Verification

#### Check Prometheus Pods
```bash
kubectl get pods -l app.kubernetes.io/name=prometheus
```

#### Access Prometheus

**Option 1: NodePort (Minikube)**
```bash
# URL: http://<minikube-ip>:30090
```

**Option 2: Port Forward**
```bash
kubectl port-forward svc/prometheus 30090:9090

# Then visit: http://localhost:30090
```

#### Test Prometheus Queries
```promql
# Check if metrics are being collected
up

# Check Dapr metrics
dapr_http_server_request_count

# Check Kafka metrics
kafka_server_brokertopicmetrics_messagesinpersec
```

---

### 7. Zipkin Verification

#### Check Zipkin Pods
```bash
kubectl get pods -l app=zipkin
```

#### Access Zipkin

**Option 1: NodePort (Minikube)**
```bash
# URL: http://<minikube-ip>:30001
```

**Option 2: Port Forward**
```bash
kubectl port-forward svc/zipkin 30001:9411

# Then visit: http://localhost:30001
```

#### Verify Traces
- Search for traces by service name: `backend`, `recurring-task-service`, `notification-service`
- Check trace spans for Dapr service invocations
- Verify distributed tracing is working

---

## Quick Access Summary

### Port Forwarding Commands
```bash
# Grafana
kubectl port-forward svc/grafana 30000:3000

# Prometheus
kubectl port-forward svc/prometheus 30090:9090

# Zipkin
kubectl port-forward svc/zipkin 30001:9411

# Dapr Dashboard
dapr dashboard -k

# Frontend
kubectl port-forward svc/frontend 3000:3000

# Backend API
kubectl port-forward svc/backend 8000:8000
```

### Access URLs (After Port Forwarding)
- **Grafana**: http://localhost:30000 (admin/admin)
- **Prometheus**: http://localhost:30090
- **Zipkin**: http://localhost:30001
- **Dapr Dashboard**: http://localhost:8080
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

---

## Troubleshooting

### Pods Not Starting
```bash
# Check pod events
kubectl describe pod <pod-name>

# Check pod logs
kubectl logs <pod-name>

# Check previous logs (if pod crashed)
kubectl logs <pod-name> --previous
```

### Dapr Sidecar Not Injected
```bash
# Check pod annotations
kubectl get pod <pod-name> -o yaml | grep dapr.io

# Verify Dapr sidecar injector is running
kubectl get pods -n dapr-system -l app=dapr-sidecar-injector
```

### Kafka Not Responding
```bash
# Check Kafka pod logs
kubectl logs <kafka-pod>

# Check Kafka service
kubectl get svc kafka

# Test Kafka connection
kubectl exec <kafka-pod> -- kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

### Grafana Not Accessible
```bash
# Check Grafana pod status
kubectl get pods -l app.kubernetes.io/name=grafana

# Check Grafana logs
kubectl logs -l app.kubernetes.io/name=grafana

# Verify service
kubectl get svc -l app.kubernetes.io/name=grafana
```

---

## Health Check Endpoints

### Application Health
```bash
# Backend health
kubectl exec <backend-pod> -- curl http://localhost:8000/health

# Frontend health (if configured)
kubectl exec <frontend-pod> -- curl http://localhost:3000/health
```

### Dapr Health
```bash
# Dapr sidecar health
kubectl exec <pod-name> -- curl http://localhost:3500/v1.0/healthz
```

---

## Useful Commands Reference

```bash
# View all resources
kubectl get all

# Watch pods
kubectl get pods -w

# Describe resource
kubectl describe <resource-type> <resource-name>

# Get resource YAML
kubectl get <resource-type> <resource-name> -o yaml

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Restart deployment
kubectl rollout restart deployment/<deployment-name>

# Scale deployment
kubectl scale deployment/<deployment-name> --replicas=3
```

---

For more details, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment instructions
- [MONITORING.md](./MONITORING.md) - Monitoring and observability guide
- [RUNBOOK.md](./RUNBOOK.md) - Operations runbook

