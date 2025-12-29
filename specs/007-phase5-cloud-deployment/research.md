# Phase 0: Technical Research - Phase V Advanced Cloud Deployment

**Date**: 2025-12-29
**Feature**: 007-phase5-cloud-deployment
**Purpose**: Document all technical research decisions, alternatives considered, and rationale before implementation

---

## Research Overview

This document captures Phase 0 research for all technologies, libraries, and architectural patterns required for Phase V implementation. Each research topic includes:
- **Decision**: Final technology/approach selected
- **Alternatives Considered**: Other options evaluated with pros/cons
- **Rationale**: Why the selected option is best for this project
- **Implementation Notes**: Key details for implementation phase

All decisions align with the 10 clarifications from specification (PHR-0002, PHR-0003) and constitution principles.

---

## Table of Contents

1. [Dapr Building Blocks](#1-dapr-building-blocks)
2. [Apache Kafka Configuration](#2-apache-kafka-configuration)
3. [Cloud Platform Selection (OKE)](#3-cloud-platform-selection-oke)
4. [RRULE Parsing Library](#4-rrule-parsing-library)
5. [Monitoring and Observability](#5-monitoring-and-observability)
6. [CI/CD Pipeline Design](#6-cicd-pipeline-design)

---

## 1. Dapr Building Blocks

### 1.1 Pub/Sub (Event Streaming)

**Decision**: Use Dapr Pub/Sub with Apache Kafka for all event streaming

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Dapr Pub/Sub + Kafka** | ✅ Infrastructure abstraction<br>✅ Easy component swap (Kafka→RabbitMQ)<br>✅ Automatic retry & DLQ<br>✅ Consistent API across clouds | ⚠️ Additional Dapr overhead<br>⚠️ Learning curve for Dapr | ✅ **SELECTED** |
| Direct Kafka Client | ✅ Maximum control<br>✅ Lower latency<br>✅ Mature Python libraries | ❌ Vendor lock-in<br>❌ Manual retry/DLQ logic<br>❌ Cloud-specific config | ❌ Rejected |
| RabbitMQ | ✅ Simple setup<br>✅ Good for small scale | ❌ Lower throughput than Kafka<br>❌ Not ideal for event streaming | ❌ Rejected |
| AWS SNS/SQS, Azure Service Bus | ✅ Managed service<br>✅ Cloud-native | ❌ Cloud vendor lock-in<br>❌ Can't run locally | ❌ Rejected |

**Rationale**:
- **Principle #1 (Simplicity)**: Dapr abstracts Kafka complexity, prevents vendor lock-in
- **Flexibility**: Can swap Kafka→RabbitMQ→Redis without changing application code (just Dapr component YAML)
- **Alignment with Spec**: Spec requires infrastructure abstraction (FR-026, FR-027)

**Implementation Notes**:
```yaml
# dapr/components/pubsub-kafka.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "kafka:9092"  # Minikube
      # value: "redpanda.cloud:9092"  # Production
    - name: consumerGroup
      value: "{appId}"  # Automatically set by Dapr
    - name: authType
      value: "none"  # Minikube (no auth)
      # value: "certificate"  # Production (mTLS)
```

---

### 1.2 State Store (Conversation History)

**Decision**: Use Dapr State Store with PostgreSQL for conversation history ONLY (per Clarification #4)

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Dapr State Store + PostgreSQL** | ✅ Reuses existing Neon DB<br>✅ Transactional consistency<br>✅ No new infrastructure | ⚠️ Slower than Redis<br>⚠️ Not ideal for high-frequency reads | ✅ **SELECTED** |
| Redis State Store | ✅ Faster reads/writes<br>✅ Low latency | ❌ Additional infrastructure<br>❌ Data persistence concerns<br>❌ Cost (Redis Cloud) | ❌ Rejected |
| In-Memory Cache | ✅ Lowest latency | ❌ No persistence<br>❌ Pod restart = data loss<br>❌ Violates stateless design | ❌ Rejected |

**Rationale**:
- **Clarification #4**: State Store used ONLY for conversation history, NOT task caching
- **Principle #1 (Simplicity)**: Reuse existing PostgreSQL, avoid adding Redis
- **Stateless Design**: All state persisted to database, pods remain stateless

**Implementation Notes**:
```yaml
# dapr/components/statestore-postgresql.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.postgresql
  version: v1
  metadata:
    - name: connectionString
      secretKeyRef:
        name: DATABASE_URL
        key: url
    - name: tableName
      value: "dapr_state"
```

**Usage Restriction**:
- ✅ Store: Chatbot conversation history (Phase III)
- ❌ Do NOT store: Task data, user profiles, recurring patterns
- ❌ Reason: Avoid cache consistency issues, maintain single source of truth (PostgreSQL tasks table)

---

### 1.3 Scheduled Jobs (Reminder Delivery)

**Decision**: Use Dapr Jobs API for exact-time reminder scheduling (NOT Cron Bindings)

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Dapr Jobs API** | ✅ Exact-time scheduling<br>✅ Persistent across restarts<br>✅ HTTP webhook delivery<br>✅ Built-in retry | ⚠️ New feature (Dapr 1.12+)<br>⚠️ Limited documentation | ✅ **SELECTED** |
| Dapr Cron Bindings | ✅ Mature feature<br>✅ Good documentation | ❌ Fixed intervals only (no one-time jobs)<br>❌ Requires polling database<br>❌ Not suitable for reminders | ❌ Rejected |
| Celery Beat (Python) | ✅ Mature task queue<br>✅ Rich scheduling | ❌ Additional infrastructure (Redis/RabbitMQ)<br>❌ Not Dapr-native | ❌ Rejected |
| Kubernetes CronJob | ✅ Native to K8s | ❌ Minimum interval 1 minute<br>❌ No one-time jobs<br>❌ Complex config | ❌ Rejected |

**Rationale**:
- **Spec Requirement (SC-005)**: Reminder accuracy ±30s (requires exact-time scheduling, not polling)
- **Dapr Jobs API Features**:
  - Schedule one-time jobs at specific UTC timestamp
  - Persistent across pod restarts (stored in Dapr State Store)
  - HTTP webhook invocation at scheduled time
  - Automatic retry on failure
- **Comparison**: Cron Bindings require polling database every minute to check `reminder_at` field (inefficient, higher latency)

**Implementation Notes**:
```python
# Notification Service: Schedule reminder using Dapr Jobs API
import httpx
from datetime import datetime

async def schedule_reminder(task_id: int, reminder_at: datetime, user_email: str):
    """Schedule one-time reminder job using Dapr Jobs API"""
    job_name = f"reminder-{task_id}"

    dapr_response = await httpx.post(
        "http://localhost:3500/v1.0-alpha1/jobs/reminders",  # Dapr sidecar
        json={
            "job": {
                "name": job_name,
                "schedule": f"@every {reminder_at.isoformat()}",  # One-time at specific time
                "repeats": 1,
                "data": {
                    "task_id": task_id,
                    "user_email": user_email
                }
            }
        }
    )

    return dapr_response.status_code == 204
```

---

### 1.4 Secrets Management

**Decision**: Use Dapr Secrets with cloud-native vaults (OCI Vault, Azure Key Vault, Google Secret Manager)

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Dapr Secrets + Cloud Vaults** | ✅ Cloud-native security<br>✅ Automatic rotation<br>✅ Audit logging<br>✅ Dapr abstraction | ⚠️ Cloud-specific config | ✅ **SELECTED** (Production) |
| Kubernetes Secrets | ✅ Simple for local dev<br>✅ No external dependencies | ❌ Base64 encoding (not encrypted)<br>❌ No rotation<br>❌ No audit logs | ✅ **SELECTED** (Minikube) |
| HashiCorp Vault | ✅ Enterprise-grade<br>✅ Multi-cloud | ❌ Complex setup<br>❌ Additional infrastructure<br>❌ Cost | ❌ Rejected |

**Rationale**:
- **Two-tier approach**:
  - **Minikube (local dev)**: Kubernetes Secrets (simple, fast iteration)
  - **Production (OKE/AKS/GKE)**: Cloud-native vaults (secure, compliant)
- **Principle #5 (Security)**: Secrets never hardcoded, always retrieved at runtime
- **Dapr Abstraction**: Same application code, different Dapr component per environment

**Implementation Notes**:

**Local (Minikube)**:
```yaml
# dapr/components/secretstore-kubernetes.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: secretstore
spec:
  type: secretstores.kubernetes
  version: v1
  metadata: []
```

**Production (OKE)**:
```yaml
# dapr/components/secretstore-oci-vault.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: secretstore
spec:
  type: secretstores.oci.vault
  version: v1
  metadata:
    - name: vaultOcid
      value: "ocid1.vault.oc1..."
    - name: compartmentOcid
      value: "ocid1.compartment.oc1..."
```

**Secrets Stored**:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `KAFKA_BROKERS` - Kafka broker addresses
- `SMTP_PASSWORD` - Email notification credentials
- `BETTER_AUTH_SECRET` - Better Auth JWT secret

---

### 1.5 Service Invocation (mTLS)

**Decision**: Use Dapr Service Invocation for inter-service communication with automatic mTLS

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Dapr Service Invocation** | ✅ Automatic mTLS<br>✅ Service discovery<br>✅ Retry & timeout policies<br>✅ Distributed tracing | ⚠️ Dapr overhead | ✅ **SELECTED** |
| Direct HTTP Calls | ✅ Simple<br>✅ No overhead | ❌ Manual TLS setup<br>❌ No service discovery<br>❌ No automatic retry | ❌ Rejected |
| Service Mesh (Istio) | ✅ Advanced traffic mgmt<br>✅ Canary deployments | ❌ Complex setup<br>❌ High resource usage<br>❌ Overkill for Phase V | ❌ Rejected |

**Rationale**:
- **Clarification #2**: Services trust Dapr mTLS for authentication (no JWT tokens between internal services)
- **Automatic mTLS**: Dapr handles certificate rotation, encryption, mutual authentication
- **Service Discovery**: Call services by app-id (not IP addresses): `http://localhost:3500/v1.0/invoke/task-service/method/create-task`
- **Observability**: Automatic distributed tracing without instrumentation code

**Implementation Notes**:
```python
# Recurring Task Service: Invoke Task Service to create next occurrence
import httpx

async def create_next_occurrence(user_id: str, task_data: dict):
    """Create next task occurrence via Dapr Service Invocation"""
    response = await httpx.post(
        "http://localhost:3500/v1.0/invoke/task-service/method/tasks",  # Dapr sidecar
        json=task_data,
        headers={"dapr-app-id": "recurring-task-service"}
    )
    return response.json()
```

---

## 2. Apache Kafka Configuration

### 2.1 Kafka Deployment: Local (Minikube)

**Decision**: Use Bitnami Kafka Helm chart for Minikube deployment

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Bitnami Kafka Helm** | ✅ Production-ready config<br>✅ Single command deploy<br>✅ Good defaults<br>✅ Active maintenance | ⚠️ Higher resource usage | ✅ **SELECTED** |
| Kafka Docker Compose | ✅ Lightweight<br>✅ Fast startup | ❌ Not Kubernetes-native<br>❌ Manual topic creation<br>❌ No HA | ❌ Rejected |
| Strimzi Operator | ✅ K8s-native CRDs<br>✅ Advanced features | ❌ Complex for local dev<br>❌ Slower iteration | ❌ Rejected (use for prod) |
| Redpanda (local) | ✅ Kafka-compatible<br>✅ Lower resource usage | ❌ Less mature<br>❌ Different config | ❌ Rejected (use for prod) |

**Rationale**:
- **Minikube Constraints**: 4 CPUs, 8GB RAM (from deploy script)
- **Bitnami Kafka**: Optimized defaults, single replica for local (saves resources)
- **Topic Management**: Helm chart includes tools for topic creation (kafka-topics.sh)

**Implementation Notes**:
```bash
# Install Bitnami Kafka on Minikube
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install kafka bitnami/kafka \
  --set persistence.size=10Gi \
  --set replicaCount=1 \
  --set listeners.client.protocol=PLAINTEXT \
  --wait

# Create topics (12 partitions, 7-day retention per Clarification #3)
kubectl run kafka-client --restart='Never' --image docker.io/bitnami/kafka:3.6.0 --rm -it -- \
  kafka-topics.sh --create --topic task-events --partitions 12 --replication-factor 1 \
  --config retention.ms=604800000 --bootstrap-server kafka:9092
```

---

### 2.2 Kafka Deployment: Production (Cloud)

**Decision**: Use Redpanda Cloud Serverless (free tier) for production Kafka

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Redpanda Cloud Serverless** | ✅ Free tier (10GB, 10MB/s)<br>✅ Kafka-compatible<br>✅ Auto-scaling<br>✅ Managed service | ⚠️ Limited free tier<br>⚠️ Requires internet | ✅ **SELECTED** (Primary) |
| Confluent Cloud | ✅ Mature platform<br>✅ $400 free credit | ❌ Credit expires<br>❌ Complex pricing<br>❌ Overkill for Phase V | ⚠️ **BACKUP** |
| Self-Hosted Strimzi on OKE | ✅ Full control<br>✅ No external costs | ❌ Uses OKE free tier resources<br>❌ Manual management<br>❌ Higher operational burden | ⚠️ **FALLBACK** |
| AWS MSK, Azure Event Hubs | ✅ Cloud-native | ❌ Expensive<br>❌ Cloud lock-in | ❌ Rejected |

**Rationale**:
- **OKE Always-Free Tier**: 2 cores, 24GB RAM total (per Clarification #1 from PHR-0002)
  - Running Kafka on OKE would consume ~1 core, 2GB RAM (50% of free tier)
  - Better to use managed Kafka and save OKE resources for application pods
- **Redpanda Cloud Free Tier**:
  - 10GB storage (sufficient for 30-day retention at <100 events/day)
  - 10MB/s throughput (sufficient for 1000 events/sec at 10KB per event)
  - No credit card required
- **Fallback**: If free tier insufficient, deploy Strimzi Kafka on OKE (trade-off: more resources, more management)

**Implementation Notes**:
```yaml
# Dapr Pub/Sub component for Redpanda Cloud
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "serverless-abcd1234.redpanda.cloud:9092"
    - name: authType
      value: "certificate"
    - name: caCert
      secretKeyRef:
        name: redpanda-ca-cert
        key: cert
```

---

### 2.3 Kafka Topic Partitioning Strategy

**Decision**: Partition all topics by `user_id` with 12 partitions per topic

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **user_id partitioning (12 partitions)** | ✅ Per-user ordering guaranteed<br>✅ User isolation<br>✅ Horizontal scaling to 12 consumers<br>✅ Even distribution | ⚠️ Limited to 12 consumers max | ✅ **SELECTED** |
| task_id partitioning | ✅ Per-task ordering | ❌ No user isolation<br>❌ Uneven distribution | ❌ Rejected |
| Round-robin (no key) | ✅ Maximum parallelism | ❌ No ordering guarantees<br>❌ Can't ensure user isolation | ❌ Rejected |
| Single partition | ✅ Total ordering | ❌ No horizontal scaling<br>❌ Bottleneck | ❌ Rejected |

**Rationale**:
- **Clarification #1 (PHR-0002)**: Partition by user_id for per-user ordering
- **User Isolation**: Events for user A never processed by same consumer instance as user B
- **Scaling**: Can scale Recurring Task Service and Notification Service to 12 instances each
- **Ordering**: All events for a single user go to same partition → FIFO processing
- **12 Partitions**: Balances parallelism with partition overhead (Kafka best practice: 3-5 partitions per broker)

**Implementation Notes**:
```python
# Event publishing with user_id as partition key
import json
import httpx

async def publish_event(topic: str, user_id: str, event_data: dict):
    """Publish event to Kafka via Dapr Pub/Sub with user_id partition key"""
    await httpx.post(
        f"http://localhost:3500/v1.0/publish/pubsub/{topic}",
        json=event_data,
        headers={
            "Dapr-Partition-Key": user_id  # Routes to partition hash(user_id) % 12
        }
    )
```

---

### 2.4 Kafka Message Retention

**Decision**: 7 days retention for Minikube, 30 days retention for production (per Clarification #3)

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **7 days (local), 30 days (cloud)** | ✅ Balances debugging + cost<br>✅ Sufficient audit trail<br>✅ Low storage usage | ⚠️ Old events auto-deleted | ✅ **SELECTED** |
| 1 day retention | ✅ Minimal storage | ❌ Too short for debugging<br>❌ Lost audit trail | ❌ Rejected |
| 90 days retention | ✅ Long audit trail | ❌ High storage cost<br>❌ Exceeds free tier | ❌ Rejected |
| Infinite retention | ✅ Complete history | ❌ Storage cost grows unbounded<br>❌ Performance degradation | ❌ Rejected |

**Rationale**:
- **7 days (Minikube)**: Sufficient for debugging recent issues without filling local disk
- **30 days (Cloud)**: Provides audit trail for production incidents while managing storage costs
- **Clarification #3**: User explicitly chose this retention strategy
- **Storage Estimate**:
  - 100 events/day × 30 days × 10KB per event = 30MB per topic (well within Redpanda Cloud 10GB free tier)

**Implementation Notes**:
```bash
# Minikube: 7-day retention (604800000 ms)
kafka-topics.sh --create --topic task-events --partitions 12 \
  --config retention.ms=604800000 --bootstrap-server kafka:9092

# Production: 30-day retention (2592000000 ms)
kafka-topics.sh --create --topic task-events --partitions 12 \
  --config retention.ms=2592000000 --bootstrap-server redpanda.cloud:9092
```

---

## 3. Cloud Platform Selection (OKE)

### 3.1 Primary Cloud Platform: Oracle Kubernetes Engine (OKE)

**Decision**: Use Oracle Kubernetes Engine (OKE) Always-Free Tier as primary deployment target

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **OKE Always-Free Tier** | ✅ Truly free (no credit expiry)<br>✅ 2 AMD VMs OR 4 Arm cores<br>✅ 24GB RAM total<br>✅ 200GB storage<br>✅ Kubernetes 1.28+ | ⚠️ Lower specs than paid tiers<br>⚠️ Oracle account required | ✅ **SELECTED** (Primary) |
| Azure AKS Free Tier | ✅ $200 free credit<br>✅ Mature platform | ❌ Credit expires after 30 days<br>❌ Requires credit card | ⚠️ **SECONDARY** |
| Google GKE Free Tier | ✅ $300 free credit<br>✅ Best-in-class K8s | ❌ Credit expires after 90 days<br>❌ Requires credit card | ⚠️ **SECONDARY** |
| AWS EKS | ✅ Mature platform | ❌ No free tier for control plane<br>❌ $73/month minimum | ❌ Rejected |

**Rationale**:
- **Clarification #1 (PHR-0002)**: User selected OKE as primary target
- **Always-Free = Truly Free**: No credit expiry, no credit card required, runs indefinitely
- **Sufficient Resources**:
  - **Option 1**: 2 AMD VMs (1 OCPU, 1GB RAM each) = 2 cores, 2GB RAM
  - **Option 2**: 4 Arm Ampere A1 cores, 24GB RAM (**RECOMMENDED for Phase V**)
- **Comparison**: GKE $300 credit seems generous, but expires after 90 days → OKE free tier continues forever

**Implementation Notes**:

**OKE Always-Free Tier Specs**:
- **Compute**: Choose ONE of:
  - 2× AMD VM.Standard.E2.1.Micro (1 OCPU, 1GB RAM each) = 2 cores, 2GB RAM total
  - 4× Arm Ampere A1 cores (up to 24GB RAM total) ← **Use this for Phase V**
- **Storage**: 200GB block storage total
- **Networking**: 1× Load Balancer (10Mbps bandwidth)

**Resource Allocation (4 Arm cores, 24GB RAM)**:
```
Node 1 (2 cores, 12GB RAM):
  - Backend (1 core, 4GB)
  - Recurring Task Service (0.5 core, 2GB)
  - Notification Service (0.5 core, 2GB)
  - System (Dapr sidecars, kubelet) (1GB)

Node 2 (2 cores, 12GB RAM):
  - Frontend (0.5 core, 2GB)
  - Prometheus (1 core, 4GB)
  - Grafana (0.5 core, 1GB)
  - Zipkin (0.5 core, 1GB)
  - System (Dapr sidecars, kubelet) (1GB)
```

---

### 3.2 Infrastructure-as-Code: Terraform

**Decision**: Use Terraform with oracle-terraform-modules/oke module for OKE provisioning

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Terraform + OKE Module** | ✅ Declarative IaC<br>✅ Official Oracle module<br>✅ Mature ecosystem<br>✅ Multi-cloud support | ⚠️ Learning curve | ✅ **SELECTED** |
| OCI CLI | ✅ Simple commands | ❌ Not declarative<br>❌ Hard to reproduce<br>❌ No state management | ❌ Rejected |
| Pulumi | ✅ Use Python/TypeScript<br>✅ Type safety | ❌ Less mature for OCI<br>❌ Smaller community | ❌ Rejected |
| Ansible | ✅ Agentless | ❌ Not ideal for infra provisioning<br>❌ Better for config mgmt | ❌ Rejected |

**Rationale**:
- **Terraform**: Industry standard for multi-cloud IaC
- **oracle-terraform-modules/oke**: Official module maintained by Oracle, handles VCN, node pools, security lists
- **Multi-Cloud**: Same Terraform workflow for OKE, AKS, GKE (different modules)

**Implementation Notes**:
```hcl
# terraform/oke/main.tf
module "oke" {
  source  = "oracle-terraform-modules/oke/oci"
  version = "~> 5.0"

  compartment_id      = var.compartment_ocid
  cluster_name        = "todo-phase5-production"
  kubernetes_version  = "v1.28.2"

  # Always-Free Tier: 4 Arm Ampere A1 cores, 24GB RAM
  node_pools = {
    worker_pool = {
      shape              = "VM.Standard.A1.Flex"
      node_pool_size     = 2
      ocpus              = 2        # 2 cores per node
      memory_in_gbs      = 12       # 12GB per node
      boot_volume_size   = 50       # 50GB per node
    }
  }
}
```

---

## 4. RRULE Parsing Library

**Decision**: Use python-dateutil for RRULE parsing and next occurrence calculation

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **python-dateutil** | ✅ Mature (16+ years)<br>✅ RFC 5545 compliant<br>✅ Battle-tested<br>✅ Active maintenance<br>✅ 50M+ downloads/month | ⚠️ Full RFC 5545 complexity<br>⚠️ Timezone handling (use UTC-only per Clarification #1) | ✅ **SELECTED** |
| Custom RRULE Parser | ✅ Exact control<br>✅ Only simplified patterns | ❌ Bugs in date logic<br>❌ No edge case coverage<br>❌ Reinventing wheel | ❌ Rejected |
| rrule.js (port to Python) | ✅ Simple API | ❌ Less mature than dateutil<br>❌ Incomplete RFC 5545 | ❌ Rejected |
| Celery Beat | ✅ Task scheduling | ❌ Not RRULE-focused<br>❌ Additional infrastructure | ❌ Rejected |

**Rationale**:
- **Maturity**: python-dateutil is the de-facto standard for recurrence rules in Python
- **RFC 5545 Compliance**: Handles all RRULE patterns (daily, weekly, monthly, yearly, complex patterns)
- **Spec Requirement**: Hybrid approach (simplified patterns + full RRULE fallback) → dateutil supports both
- **Clarification #1**: UTC-only calculations (no timezone-aware logic) → dateutil can work with naive UTC datetimes

**Implementation Notes**:

```python
from dateutil.rrule import rrulestr
from datetime import datetime, timezone

def calculate_next_occurrence(recurring_pattern: str, reference_date: datetime) -> datetime:
    """
    Calculate next occurrence for recurring task using python-dateutil.

    Args:
        recurring_pattern: RRULE string (e.g., "FREQ=DAILY;INTERVAL=1")
        reference_date: Current UTC datetime

    Returns:
        Next occurrence UTC datetime
    """
    # Parse RRULE string
    rrule = rrulestr(recurring_pattern, dtstart=reference_date)

    # Get next occurrence after reference_date
    next_occurrence = rrule.after(reference_date, inc=False)

    # Ensure UTC (per Clarification #1: all calculations in UTC)
    if next_occurrence.tzinfo is not None:
        next_occurrence = next_occurrence.astimezone(timezone.utc).replace(tzinfo=None)

    return next_occurrence

# Example usage:
reference = datetime(2025, 12, 29, 12, 0, 0)  # Naive UTC datetime
pattern = "FREQ=DAILY;INTERVAL=1"  # Daily recurrence
next_due = calculate_next_occurrence(pattern, reference)
# Result: datetime(2025, 12, 30, 12, 0, 0)
```

**Edge Cases Handled by python-dateutil**:
- ✅ Leap years (Feb 29 → Feb 28 on non-leap years)
- ✅ DST transitions (per Clarification #1, we ignore DST by using UTC)
- ✅ Month-end edge cases (Jan 31 → Feb 28/29)
- ✅ Complex patterns (e.g., "Last Friday of every month")

---

## 5. Monitoring and Observability

### 5.1 Distributed Tracing: Zipkin vs Jaeger

**Decision**: Use Zipkin for distributed tracing

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Zipkin** | ✅ Simple deployment (single binary)<br>✅ Lower resource usage (~500MB RAM)<br>✅ Sufficient for Phase V<br>✅ Dapr native support | ⚠️ Fewer features than Jaeger | ✅ **SELECTED** |
| Jaeger | ✅ Advanced features (adaptive sampling)<br>✅ CNCF project<br>✅ Better UI | ❌ Higher resource usage (~1GB RAM)<br>❌ More complex deployment<br>❌ Overkill for Phase V | ❌ Rejected |
| AWS X-Ray, Azure App Insights | ✅ Cloud-native | ❌ Vendor lock-in<br>❌ Can't run locally | ❌ Rejected |

**Rationale**:
- **OKE Free Tier Constraints**: 24GB RAM total → Zipkin uses 500MB vs Jaeger 1GB (saves resources)
- **Simplicity**: Zipkin deploys as single pod, Jaeger requires Cassandra/Elasticsearch
- **Dapr Support**: Both Zipkin and Jaeger supported equally by Dapr
- **Sufficient Features**: Zipkin provides trace visualization, dependency graphs, search (covers 90% of use cases)

**Implementation Notes**:
```yaml
# monitoring/zipkin/zipkin.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zipkin
spec:
  replicas: 1
  selector:
    matchLabels:
      app: zipkin
  template:
    metadata:
      labels:
        app: zipkin
    spec:
      containers:
      - name: zipkin
        image: openzipkin/zipkin:latest
        ports:
        - containerPort: 9411
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: zipkin
spec:
  type: NodePort
  ports:
  - port: 9411
    targetPort: 9411
    nodePort: 30001
  selector:
    app: zipkin
```

**Dapr Tracing Configuration**:
```yaml
# dapr/config/config.yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: dapr-config
spec:
  tracing:
    samplingRate: "1"  # 100% sampling for Phase V (reduce to 0.1 for high traffic)
    zipkin:
      endpointAddress: "http://zipkin:9411/api/v2/spans"
```

---

### 5.2 Metrics: Prometheus + Grafana

**Decision**: Use Prometheus for metrics collection, Grafana for visualization

**Alternatives**: (No serious alternatives - Prometheus + Grafana is industry standard for Kubernetes)

**Rationale**:
- **Prometheus**: De-facto standard for Kubernetes metrics, CNCF graduated project
- **Grafana**: Best-in-class visualization, rich dashboard ecosystem
- **Dapr Integration**: Dapr automatically exposes Prometheus metrics at `:9090/metrics`

**Implementation Notes**:
```bash
# Install Prometheus + Grafana using kube-prometheus-stack Helm chart
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --set grafana.adminPassword=admin \
  --wait
```

**Key Metrics to Monitor**:

1. **Kafka Metrics** (from Kafka Exporter):
   - `kafka_topic_partition_current_offset{topic="task-events"}` - Message offset per partition
   - `kafka_consumergroup_lag{topic="task-events"}` - Consumer lag (should be <60s)
   - `kafka_topic_partition_replica_count{topic="task-events"}` - Replication factor

2. **Dapr Metrics** (automatic from Dapr sidecars):
   - `dapr_component_pubsub_ingress_count{app_id="task-service",topic="task-events"}` - Events published
   - `dapr_component_pubsub_egress_count{app_id="recurring-task-service",topic="task-events"}` - Events consumed
   - `dapr_http_server_request_duration_ms{app_id="task-service",method="POST"}` - Service invocation latency

3. **Application Metrics** (custom from application code):
   - `recurring_tasks_created_total{user_id}` - Counter of next occurrences created
   - `reminders_sent_total{user_id,status}` - Counter of reminders sent (status: success/failure)
   - `next_occurrence_calculation_duration_seconds{pattern}` - RRULE calculation latency

**Grafana Dashboards**:
- Import ID 7589 (Kafka Overview)
- Import ID 19004 (Dapr Dashboard)
- Custom dashboard for recurring tasks metrics

---

### 5.3 Logging: OCI Logging / Azure Log Analytics / Google Cloud Logging

**Decision**: Use cloud-native logging service for centralized log aggregation

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **OCI Logging (OKE)** | ✅ Native OCI integration<br>✅ Free tier included<br>✅ Automatic collection | ⚠️ OCI-specific | ✅ **SELECTED** (OKE) |
| ELK Stack (self-hosted) | ✅ Full control<br>✅ Rich features | ❌ High resource usage (2GB+ RAM)<br>❌ Complex setup<br>❌ Exceeds free tier | ❌ Rejected |
| Loki (Grafana) | ✅ Lightweight<br>✅ Grafana integration | ❌ Less mature<br>❌ Limited query language | ⚠️ **ALTERNATIVE** |

**Rationale**:
- **Cloud-Native**: Leverage OCI Logging for OKE, Azure Log Analytics for AKS, Google Cloud Logging for GKE
- **Free Tier**: All cloud providers include free logging tier (sufficient for Phase V volume)
- **Structured Logging**: Use JSON format for machine-parseable logs

**Implementation Notes**:

**Structured JSON Logging (Python)**:
```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "service": "recurring-task-service",
            "message": record.getMessage(),
            "user_id": getattr(record, "user_id", None),
            "event_id": getattr(record, "event_id", None),
            "task_id": getattr(record, "task_id", None)
        }
        return json.dumps(log_entry)

# Configure logger
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)

# Usage
logger.info("Created next occurrence for recurring task", extra={
    "user_id": "user-123",
    "event_id": "evt-456",
    "task_id": 789
})
```

---

## 6. CI/CD Pipeline Design

### 6.1 CI/CD Platform: GitHub Actions

**Decision**: Use GitHub Actions for CI/CD pipeline

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **GitHub Actions** | ✅ Native GitHub integration<br>✅ Free for public repos<br>✅ 2000 min/month free (private)<br>✅ Rich marketplace | ⚠️ Limited to GitHub | ✅ **SELECTED** |
| GitLab CI/CD | ✅ Built-in pipelines<br>✅ Free tier | ❌ Requires GitLab account<br>❌ Migration effort | ❌ Rejected |
| Jenkins | ✅ Full control<br>✅ Mature | ❌ Self-hosted infrastructure<br>❌ Maintenance burden | ❌ Rejected |
| Argo CD | ✅ GitOps model<br>✅ K8s-native | ❌ Complex setup<br>❌ Overkill for Phase V | ❌ Rejected |

**Rationale**:
- **Existing GitHub Repo**: Project already on GitHub (based on git status in context)
- **Free Tier**: 2000 minutes/month sufficient for Phase V deployment frequency
- **Ease of Use**: YAML-based workflows, no infrastructure to manage

**Implementation Notes**:
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production (OKE)

on:
  push:
    branches:
      - main  # Trigger on merge to main (per Clarification #5)

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker images
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.OCI_REGISTRY }}/todo-backend:${{ github.sha }}

      - name: Deploy to OKE using Helm
        run: |
          helm upgrade --install todo-app ./helm/todo-app \
            -f ./helm/todo-app/values-oke.yaml \
            --set image.tag=${{ github.sha }} \
            --wait --timeout 10m

      - name: Run health checks
        run: kubectl rollout status deployment/todo-backend

      - name: Rollback on failure
        if: failure()
        run: helm rollback todo-app --wait
```

---

### 6.2 CI/CD Trigger Strategy

**Decision**: Branch-based deployment triggers (per Clarification #5)

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Branch-based (main→prod, develop→staging)** | ✅ Clear promotion path<br>✅ Standard GitFlow<br>✅ No accidental deploys | ⚠️ Requires branch discipline | ✅ **SELECTED** |
| Tag-based (v1.0.0 → prod) | ✅ Explicit versioning<br>✅ Semantic versioning | ❌ Extra manual step<br>❌ Slower iteration | ❌ Rejected |
| Manual approval | ✅ Maximum control | ❌ Slows deployment<br>❌ Human bottleneck | ❌ Rejected |

**Rationale**:
- **Clarification #5**: User explicitly chose branch-based deployment
- **GitFlow Workflow**:
  - Merge to `main` → Deploy to production (OKE)
  - Merge to `develop` → Deploy to staging (OKE namespace or separate cluster)
  - Feature branches (`feature/*`) → No automatic deployment (manual testing only)
- **Pull Request Gates**: Require PR reviews, passing tests before merge to `main`

**Implementation Notes**:
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches:
      - develop  # Trigger on merge to develop (per Clarification #5)

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to OKE Staging Namespace
        run: |
          helm upgrade --install todo-app-staging ./helm/todo-app \
            -f ./helm/todo-app/values-oke.yaml \
            --namespace staging \
            --set image.tag=${{ github.sha }} \
            --wait
```

---

## Summary of Research Decisions

| Research Area | Decision | Key Rationale |
|--------------|----------|---------------|
| **Dapr Pub/Sub** | Kafka | Infrastructure abstraction, easy component swap |
| **Dapr State Store** | PostgreSQL | Reuse existing DB, conversation history ONLY |
| **Dapr Scheduled Jobs** | Jobs API (not Cron) | Exact-time reminders (±30s accuracy) |
| **Dapr Secrets** | Cloud vaults (prod), K8s Secrets (local) | Security best practices |
| **Dapr Service Invocation** | mTLS enabled | Automatic encryption, no JWT tokens |
| **Kafka (Local)** | Bitnami Helm chart | Production-ready, single command deploy |
| **Kafka (Cloud)** | Redpanda Cloud Serverless | Free tier, saves OKE resources |
| **Kafka Partitioning** | user_id, 12 partitions | Per-user ordering, horizontal scaling |
| **Kafka Retention** | 7 days local, 30 days cloud | Balance debugging + cost |
| **Cloud Platform** | OKE Always-Free (4 Arm cores, 24GB) | Truly free, sufficient resources |
| **IaC** | Terraform + oracle-terraform-modules/oke | Multi-cloud, declarative |
| **RRULE Parsing** | python-dateutil | Mature, RFC 5545 compliant |
| **Distributed Tracing** | Zipkin | Lower resource usage than Jaeger |
| **Metrics** | Prometheus + Grafana | Industry standard |
| **Logging** | OCI Logging (cloud-native) | Free tier, automatic collection |
| **CI/CD Platform** | GitHub Actions | Native integration, free tier |
| **CI/CD Triggers** | Branch-based (main→prod, develop→staging) | Standard GitFlow, per clarification |

---

## Next Steps

1. ✅ Research phase complete → All technology decisions documented
2. ⏭️ Proceed to Phase 1: Create data-model.md with database schema changes
3. ⏭️ Create contracts directory with event schemas and Dapr component templates
4. ⏭️ Run `/sp.tasks` to generate actionable task breakdown
5. ⏭️ Run `/sp.implement` to execute tasks via Claude Code

---

**Document Version**: 1.0
**Last Updated**: 2025-12-29
**Related Documents**:
- [spec.md](./spec.md) - Phase V Feature Specification
- [plan.md](./plan.md) - Implementation Plan
- [PHR-0002](../../history/prompts/007-phase5-cloud-deployment/0002-phase5-spec-clarification-session.spec.prompt.md) - First Clarification Session
- [PHR-0003](../../history/prompts/007-phase5-cloud-deployment/0003-phase5-spec-second-clarification-session.spec.prompt.md) - Second Clarification Session
