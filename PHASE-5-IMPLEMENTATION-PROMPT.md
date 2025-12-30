# Phase 5 Implementation Prompt for Claude Code

## Prompt

```
@phase5-cloud-deployment-engineer

Implement Phase 5: User Story 3 - Local Deployment Minikube (T087-T113) from specs/007-phase5-cloud-deployment/tasks.md.

**Goal**: Enable developers to deploy entire Todo application stack to local Minikube cluster with one command

**Independent Test**: Run deploy script on clean Minikube → verify all pods Running, frontend accessible via port-forward

**Requirements:**
1. Use Context7 MCP server for Kubernetes, Helm, and Dapr patterns
2. Use skills:
   - kubernetes-helm-deployment (for Helm charts and deployment templates)
   - dapr-integration (for Dapr component configurations)
   - terraform-infrastructure (for reference patterns, though not used in Minikube)
3. Reference files:
   - Constitution: .specify/memory/constitution.md
   - Spec: specs/007-phase5-cloud-deployment/spec.md
   - Plan: specs/007-phase5-cloud-deployment/plan.md
   - Deployment guide: docs/phase4-deployment-guide.md

**Tasks to Complete:**

### Minikube Deployment Script (T087-T095)
- T087: Create phase-5/scripts/deploy-minikube.sh with Minikube start (4 CPUs, 8GB RAM, Docker driver)
- T088: Add Dapr installation using dapr init -k --runtime-version 1.12 --enable-ha=false
- T089: Add Kafka deployment using Bitnami Helm chart (persistence 10Gi, replicaCount 1)
- T090: Add Kafka topic creation (task-events, reminders, task-updates, 12 partitions, 7-day retention)
- T091: Add Dapr components deployment (kubectl apply for all 5 components)
- T092: Add application deployment using Helm install with values-minikube.yaml
- T093: Add monitoring stack deployment (Prometheus, Grafana, Zipkin)
- T094: Add verification step (kubectl get pods, kubectl get daprcomponents)
- T095: Make script executable and test on clean Minikube cluster

### Helm Charts for Minikube (T096-T102)
- T096: Create Helm Chart.yaml in phase-5/helm/todo-app/Chart.yaml with Phase V metadata
- T097: Create Helm values-minikube.yaml with Minikube-specific config (NodePort service, resource limits)
- T098: Create Recurring Task Service deployment template with Dapr annotations, resource requests/limits
- T099: Create Notification Service deployment template with Dapr annotations, resource requests/limits
- T100: Create Dapr components template (all 5 component YAMLs)
- T101: Update backend deployment template to add Dapr sidecar injection annotation
- T102: Update frontend deployment template to add Dapr sidecar injection annotation

### Monitoring for Minikube (T103-T109)
- T103: Create Prometheus configuration with scrape configs for Dapr sidecars, Kafka metrics
- T104: Create Prometheus alert rules (consumer lag > 60s, reminder delivery failures, pod restarts)
- T105: Create Grafana Kafka dashboard JSON (topic metrics, consumer lag, partition distribution)
- T106: Create Grafana Dapr dashboard JSON (component health, service invocation metrics)
- T107: Create Grafana recurring tasks dashboard JSON (creation rate, next occurrence distribution)
- T108: Create Grafana datasources YAML with Prometheus datasource
- T109: Create Zipkin deployment YAML with NodePort service for Minikube

### Docker and Configuration (T110-T113)
- T110: Update backend Dockerfile to add python-dateutil dependency, Dapr SDK
- T111: Create Recurring Task Service Dockerfile in phase-5/services/recurring-task-service/Dockerfile
- T112: Create Notification Service Dockerfile in phase-5/services/notification-service/Dockerfile
- T113: Update backend config.py to add Kafka broker URLs, Dapr HTTP port, SMTP credentials from environment variables

**Checkpoint**: Developers can deploy entire stack to Minikube and test recurring tasks + reminders locally with one command.
```

## Quick Copy-Paste Version

```
@phase5-cloud-deployment-engineer

Implement Phase 5: User Story 3 - Local Deployment Minikube (T087-T113) from specs/007-phase5-cloud-deployment/tasks.md.

Use Context7 MCP server for Kubernetes, Helm, and Dapr patterns.
Use skills: kubernetes-helm-deployment, dapr-integration.

References: constitution.md, spec.md, plan.md, phase4-deployment-guide.md.

Tasks:
- Deployment script (T087-T095): Minikube start, Dapr install, Kafka deployment, topic creation, app deployment, monitoring
- Helm charts (T096-T102): Chart.yaml, values-minikube.yaml, deployment templates, Dapr component templates
- Monitoring (T103-T109): Prometheus config, Grafana dashboards, Zipkin deployment
- Docker/config (T110-T113): Dockerfiles, config.py updates

Test: Run deploy-minikube.sh → verify all pods Running → access frontend via port-forward.
```


