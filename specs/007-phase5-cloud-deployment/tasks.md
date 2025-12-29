# Tasks: Phase V - Advanced Cloud Deployment

**Input**: Design documents from `specs/007-phase5-cloud-deployment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by the 8 implementation phases from plan.md, with user story labels (US1-US5) applied to feature-specific tasks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- Web app structure: `phase-5/backend/src/`, `phase-5/frontend/src/`
- Infrastructure: `phase-5/dapr/`, `phase-5/terraform/`, `phase-5/helm/`
- Monitoring: `phase-5/monitoring/`
- Scripts: `phase-5/scripts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure

- [X] T001 [P] Create directory structure phase-5/backend/src/models/
- [X] T002 [P] Create directory structure phase-5/backend/src/services/
- [X] T003 [P] Create directory structure phase-5/backend/src/api/
- [X] T004 [P] Create directory structure phase-5/backend/src/events/
- [X] T005 [P] Create directory structure phase-5/backend/src/integrations/
- [X] T006 [P] Create directory structure phase-5/backend/migrations/
- [X] T007 [P] Create directory structure phase-5/backend/tests/unit/
- [X] T008 [P] Create directory structure phase-5/backend/tests/integration/
- [X] T009 [P] Create directory structure phase-5/backend/tests/contract/
- [X] T010 [P] Create directory structure phase-5/frontend/src/components/
- [X] T011 [P] Create directory structure phase-5/frontend/src/lib/
- [X] T012 [P] Create directory structure phase-5/dapr/components/
- [X] T013 [P] Create directory structure phase-5/dapr/config/
- [X] T014 [P] Create directory structure phase-5/terraform/oke/
- [X] T015 [P] Create directory structure phase-5/terraform/aks/
- [X] T016 [P] Create directory structure phase-5/terraform/gke/
- [X] T017 [P] Create directory structure phase-5/helm/todo-app/templates/
- [X] T018 [P] Create directory structure phase-5/helm/kafka/
- [X] T019 [P] Create directory structure phase-5/monitoring/prometheus/
- [X] T020 [P] Create directory structure phase-5/monitoring/grafana/dashboards/
- [X] T021 [P] Create directory structure phase-5/monitoring/zipkin/
- [X] T022 [P] Create directory structure phase-5/scripts/
- [X] T023 [P] Create directory structure phase-5/.github/workflows/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Database Migration

- [ ] T024 Create migration script phase-5/backend/migrations/006_add_phase5_fields.sql with ALTER TABLE to add recurring_pattern, recurring_end_date, next_occurrence, reminder_at, reminder_sent columns
- [ ] T025 Create database index on next_occurrence column in phase-5/backend/migrations/006_add_phase5_fields.sql WHERE next_occurrence IS NOT NULL
- [ ] T026 Create database index on reminder_at and user_id columns in phase-5/backend/migrations/006_add_phase5_fields.sql WHERE reminder_at IS NOT NULL AND reminder_sent = FALSE
- [ ] T027 Create rollback script phase-5/backend/migrations/006_rollback.sql with ALTER TABLE DROP COLUMN statements
- [ ] T028 Test migration and rollback on local PostgreSQL instance

### Dapr Components Setup

- [ ] T029 [P] Create Dapr Pub/Sub component YAML phase-5/dapr/components/pubsub-kafka.yaml with Kafka broker configuration, 3 topics (task-events, reminders, task-updates)
- [ ] T030 [P] Create Dapr State Store component YAML phase-5/dapr/components/statestore-postgresql.yaml with PostgreSQL connection for conversation history
- [ ] T031 [P] Create Dapr Secrets component YAML phase-5/dapr/components/secretstore-kubernetes.yaml for Minikube deployment
- [ ] T032 [P] Create Dapr Secrets component YAML phase-5/dapr/components/secretstore-oci-vault.yaml for OKE deployment
- [ ] T033 [P] Create Dapr Jobs API component YAML phase-5/dapr/components/jobs-scheduler.yaml for reminder scheduling
- [ ] T034 Create Dapr configuration YAML phase-5/dapr/config/config.yaml with tracing (Zipkin endpoint), metrics enabled, sampling rate 100%

### Event Schemas

- [ ] T035 Create event schema definitions YAML phase-5/specs/007-phase5-cloud-deployment/contracts/event-schemas.yaml with TaskCompletedEvent, ReminderScheduledEvent, TaskUpdatedEvent (all v1.0)
- [ ] T036 Implement Pydantic event schema models in phase-5/backend/src/events/schemas.py with base EventSchema class and 3 event types
- [ ] T037 Create event schema validation tests in phase-5/backend/tests/contract/test_event_schemas.py

### Kafka Setup

- [ ] T038 Create Kafka values file phase-5/helm/kafka/values-minikube.yaml with Bitnami Kafka chart configuration, 12 partitions per topic, 7-day retention
- [ ] T039 Create Kafka values file phase-5/helm/kafka/values-redpanda.yaml with Redpanda Cloud Serverless configuration, 12 partitions per topic, 30-day retention
- [ ] T040 Create Kafka topic creation script phase-5/scripts/create-kafka-topics.sh with user_id partitioning strategy

### Base Event Infrastructure

- [ ] T041 Implement Dapr HTTP client wrapper in phase-5/backend/src/integrations/dapr_client.py with pub/sub methods, state store methods, service invocation methods
- [ ] T042 Implement event publisher in phase-5/backend/src/events/publisher.py with Dapr Pub/Sub integration, user_id partitioning, event_id generation
- [ ] T043 Implement event consumer base class in phase-5/backend/src/events/consumers.py with Dapr Pub/Sub subscription, idempotency check, user isolation

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Recurring Tasks (Priority: P1)

**Goal**: Enable users to create tasks that repeat automatically on a schedule (daily, weekly, monthly, yearly)

**Independent Test**: Create recurring task "Daily standup" → mark complete → verify next occurrence created with correct due date

### RRULE Parsing and Next Occurrence Calculation

- [ ] T044 [US1] Implement RRULE parser in phase-5/backend/src/integrations/rrule_parser.py using python-dateutil with support for simplified patterns (DAILY, WEEKLY, MONTHLY, YEARLY)
- [ ] T045 [US1] Implement full RFC 5545 RRULE parsing fallback in phase-5/backend/src/integrations/rrule_parser.py
- [ ] T046 [US1] Implement next occurrence calculation in phase-5/backend/src/integrations/rrule_parser.py with UTC-only time handling, recurring_end_date support
- [ ] T047 [US1] Add unit tests for RRULE parsing in phase-5/backend/tests/unit/test_rrule_parser.py covering daily, weekly, monthly, yearly patterns
- [ ] T048 [US1] Add unit tests for edge cases in phase-5/backend/tests/unit/test_rrule_parser.py covering DST transitions, leap years, timezone boundaries
- [ ] T049 [US1] Add unit tests for recurring_end_date logic in phase-5/backend/tests/unit/test_rrule_parser.py

### Recurring Task Service

- [ ] T050 [US1] Create Recurring Task Service entry point in phase-5/backend/src/services/recurring_task_service.py with Kafka consumer setup
- [ ] T051 [US1] Implement task.completed event consumer in phase-5/backend/src/services/recurring_task_service.py subscribing to task-events topic
- [ ] T052 [US1] Implement next occurrence creation logic in phase-5/backend/src/services/recurring_task_service.py with idempotency check, user_id isolation
- [ ] T053 [US1] Integrate python-dateutil for next_occurrence calculation in phase-5/backend/src/services/recurring_task_service.py
- [ ] T054 [US1] Implement task.created event publishing in phase-5/backend/src/services/recurring_task_service.py for next occurrence
- [ ] T055 [US1] Add unit tests for next occurrence creation in phase-5/backend/tests/unit/test_recurring_task_service.py
- [ ] T056 [US1] Add integration tests for task.completed event consumption in phase-5/backend/tests/integration/test_kafka_events.py

### Task Service Updates for Recurring Tasks

- [ ] T057 [US1] Update Task model in phase-5/backend/src/models.py to add recurring_pattern, recurring_end_date, next_occurrence fields (nullable)
- [ ] T058 [US1] Update task creation API in phase-5/backend/src/api/tasks.py to accept recurring_pattern, recurring_end_date parameters
- [ ] T059 [US1] Implement task.completed event publishing in phase-5/backend/src/services/task_service.py when task is marked complete
- [ ] T060 [US1] Add validation for recurring_pattern field in phase-5/backend/src/api/tasks.py to ensure valid RRULE format
- [ ] T061 [US1] Add API tests for recurring task creation in phase-5/backend/tests/integration/test_tasks_api.py

### Frontend for Recurring Tasks

- [ ] T062 [P] [US1] Create RecurringTaskForm component in phase-5/frontend/src/components/RecurringTaskForm.tsx with simplified pattern UI (Daily, Weekly, Monthly, Yearly dropdowns)
- [ ] T063 [P] [US1] Create RRULE utility helpers in phase-5/frontend/src/lib/rrule-utils.ts for simplified pattern generation
- [ ] T064 [US1] Integrate RecurringTaskForm into chat interface in phase-5/frontend/src/components/ChatInterface.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create recurring tasks and next occurrences are automatically generated

---

## Phase 4: User Story 2 - Due Dates & Reminders (Priority: P1)

**Goal**: Enable users to set due dates and receive automatic reminder notifications before deadlines

**Independent Test**: Create task with due date 24h future, reminder 1h before → wait → verify email received

### Notification Service

- [ ] T065 [US2] Create Notification Service entry point in phase-5/backend/src/services/notification_service.py with Kafka consumer setup
- [ ] T066 [US2] Implement reminder.scheduled event consumer in phase-5/backend/src/services/notification_service.py subscribing to reminders topic
- [ ] T067 [US2] Integrate Dapr Jobs API in phase-5/backend/src/services/notification_service.py for exact-time reminder scheduling
- [ ] T068 [US2] Implement email notification via SMTP in phase-5/backend/src/services/notification_service.py with retry strategy (10 retries, exponential backoff 1s to 512s)
- [ ] T069 [US2] Implement push notification in phase-5/backend/src/services/notification_service.py for web browsers (optional)
- [ ] T070 [US2] Update task.reminder_sent flag in phase-5/backend/src/services/notification_service.py after successful delivery
- [ ] T071 [US2] Add unit tests for notification service in phase-5/backend/tests/unit/test_notification_service.py
- [ ] T072 [US2] Add integration tests for Dapr Jobs API in phase-5/backend/tests/integration/test_dapr_jobs.py

### Task Service Updates for Reminders

- [ ] T073 [US2] Update Task model in phase-5/backend/src/models.py to add reminder_at, reminder_sent fields (nullable)
- [ ] T074 [US2] Update task creation API in phase-5/backend/src/api/tasks.py to accept due_date, reminder_offset parameters
- [ ] T075 [US2] Implement reminder.scheduled event publishing in phase-5/backend/src/services/task_service.py when task with due_date is created
- [ ] T076 [US2] Implement reminder cancellation logic in phase-5/backend/src/services/task_service.py when task is completed before reminder_at time
- [ ] T077 [US2] Add validation for due_date and reminder_offset in phase-5/backend/src/api/tasks.py
- [ ] T078 [US2] Add API tests for reminder creation in phase-5/backend/tests/integration/test_tasks_api.py

### Frontend for Due Dates & Reminders

- [ ] T079 [P] [US2] Create ReminderSettings component in phase-5/frontend/src/components/ReminderSettings.tsx with due date picker, reminder offset selector (1 hour, 1 day, 1 week before)
- [ ] T080 [P] [US2] Create overdue task indicator in phase-5/frontend/src/components/TaskList.tsx with red text, warning icon for tasks past due_date
- [ ] T081 [US2] Integrate ReminderSettings into chat interface in phase-5/frontend/src/components/ChatInterface.tsx

### Dead Letter Queue and Retry Strategy

- [ ] T082 [US2] Implement dead letter queue handler in phase-5/backend/src/events/dlq_handler.py with event-type-specific retry strategies (task completion: 3 retries 30s/5min/30min, reminders: 10 retries 1s-512s, updates: 5 retries 1s-16s)
- [ ] T083 [US2] Configure DLQ retention periods in phase-5/dapr/components/pubsub-kafka.yaml (task completion: 30 days, reminders: 7 days, updates: 14 days)
- [ ] T084 [US2] Implement ops team alerting in phase-5/backend/src/events/dlq_handler.py when events moved to DLQ
- [ ] T085 [US2] Implement user alerting in phase-5/backend/src/events/dlq_handler.py for failed reminder notifications
- [ ] T086 [US2] Create admin API endpoint in phase-5/backend/src/api/admin.py for manual DLQ event retry

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can create recurring tasks and receive reminders

---

## Phase 5: User Story 3 - Local Deployment Minikube (Priority: P2)

**Goal**: Enable developers to deploy entire Todo application stack to local Minikube cluster with one command

**Independent Test**: Run deploy script on clean Minikube → verify all pods Running, frontend accessible via port-forward

### Minikube Deployment Script

- [ ] T087 [US3] Create Minikube deployment script phase-5/scripts/deploy-minikube.sh with Minikube start command (4 CPUs, 8GB RAM, Docker driver)
- [ ] T088 [US3] Add Dapr installation step in phase-5/scripts/deploy-minikube.sh using dapr init -k --runtime-version 1.12 --enable-ha=false
- [ ] T089 [US3] Add Kafka deployment step in phase-5/scripts/deploy-minikube.sh using Bitnami Helm chart with persistence 10Gi, replicaCount 1
- [ ] T090 [US3] Add Kafka topic creation in phase-5/scripts/deploy-minikube.sh for task-events, reminders, task-updates topics (12 partitions, 7-day retention)
- [ ] T091 [US3] Add Dapr components deployment in phase-5/scripts/deploy-minikube.sh using kubectl apply for all 5 components
- [ ] T092 [US3] Add application deployment in phase-5/scripts/deploy-minikube.sh using Helm install with values-minikube.yaml
- [ ] T093 [US3] Add monitoring stack deployment in phase-5/scripts/deploy-minikube.sh using Prometheus Helm chart, Grafana, Zipkin
- [ ] T094 [US3] Add verification step in phase-5/scripts/deploy-minikube.sh with kubectl get pods, kubectl get daprcomponents
- [ ] T095 [US3] Make script executable and test on clean Minikube cluster

### Helm Charts for Minikube

- [ ] T096 [P] [US3] Create Helm Chart.yaml in phase-5/helm/todo-app/Chart.yaml with Phase V metadata
- [ ] T097 [P] [US3] Create Helm values-minikube.yaml in phase-5/helm/todo-app/values-minikube.yaml with Minikube-specific configuration (NodePort service, resource limits)
- [ ] T098 [P] [US3] Create Recurring Task Service deployment template in phase-5/helm/todo-app/templates/recurring-task-service-deployment.yaml with Dapr annotations, resource requests/limits
- [ ] T099 [P] [US3] Create Notification Service deployment template in phase-5/helm/todo-app/templates/notification-service-deployment.yaml with Dapr annotations, resource requests/limits
- [ ] T100 [P] [US3] Create Dapr components template in phase-5/helm/todo-app/templates/dapr-components.yaml with all 5 component YAMLs
- [ ] T101 [P] [US3] Update existing backend deployment template in phase-5/helm/todo-app/templates/backend-deployment.yaml to add Dapr sidecar injection annotation
- [ ] T102 [P] [US3] Update existing frontend deployment template in phase-5/helm/todo-app/templates/frontend-deployment.yaml to add Dapr sidecar injection annotation

### Monitoring for Minikube

- [ ] T103 [P] [US3] Create Prometheus configuration in phase-5/monitoring/prometheus/prometheus.yaml with scrape configs for Dapr sidecars, Kafka metrics
- [ ] T104 [P] [US3] Create Prometheus alert rules in phase-5/monitoring/prometheus/alerts.yaml for Phase V services (consumer lag > 60s, reminder delivery failures, pod restarts)
- [ ] T105 [P] [US3] Create Grafana Kafka dashboard JSON in phase-5/monitoring/grafana/dashboards/kafka-dashboard.json with topic metrics, consumer lag, partition distribution
- [ ] T106 [P] [US3] Create Grafana Dapr dashboard JSON in phase-5/monitoring/grafana/dashboards/dapr-dashboard.json with component health, service invocation metrics
- [ ] T107 [P] [US3] Create Grafana recurring tasks dashboard JSON in phase-5/monitoring/grafana/dashboards/recurring-tasks-dashboard.json with creation rate, next occurrence distribution
- [ ] T108 [P] [US3] Create Grafana datasources YAML in phase-5/monitoring/grafana/datasources.yaml with Prometheus datasource
- [ ] T109 [P] [US3] Create Zipkin deployment YAML in phase-5/monitoring/zipkin/zipkin.yaml with NodePort service for Minikube

### Docker and Configuration

- [ ] T110 [US3] Update backend Dockerfile in phase-5/backend/Dockerfile to add python-dateutil dependency, Dapr SDK
- [ ] T111 [US3] Create Recurring Task Service Dockerfile in phase-5/services/recurring-task-service/Dockerfile
- [ ] T112 [US3] Create Notification Service Dockerfile in phase-5/services/notification-service/Dockerfile
- [ ] T113 [US3] Update backend config.py in phase-5/backend/src/config.py to add Kafka broker URLs, Dapr HTTP port, SMTP credentials from environment variables

**Checkpoint**: At this point, developers can deploy entire stack to Minikube and test recurring tasks + reminders locally

---

## Phase 6: User Story 4 - Cloud Deployment OKE (Priority: P2)

**Goal**: Enable operations teams to deploy Todo application to Oracle Kubernetes Engine with CI/CD pipelines

**Independent Test**: Trigger CI/CD (git push main) → verify OKE deployment success, health checks pass, Grafana displays metrics

### Terraform Infrastructure as Code (OKE)

- [ ] T114 [US4] Create Terraform main.tf in phase-5/terraform/oke/main.tf with OCI provider configuration, OKE module (oracle-terraform-modules/oke)
- [ ] T115 [US4] Configure OKE always-free tier node pool in phase-5/terraform/oke/main.tf with VM.Standard.A1.Flex shape, 2 nodes, 2 OCPUs per node, 12GB memory per node
- [ ] T116 [US4] Add Dapr installation resource in phase-5/terraform/oke/main.tf using null_resource with local-exec provisioner (dapr init -k --enable-mtls=true)
- [ ] T117 [US4] Create Terraform variables.tf in phase-5/terraform/oke/variables.tf with region, tenancy_ocid, compartment_ocid, user_ocid, fingerprint, private_key_path
- [ ] T118 [US4] Create Terraform outputs.tf in phase-5/terraform/oke/outputs.tf with cluster_id, kubeconfig, cluster_endpoint
- [ ] T119 [US4] Test Terraform apply on OKE always-free tier

### Terraform Infrastructure as Code (AKS/GKE Secondary)

- [ ] T120 [P] [US4] Create Terraform main.tf in phase-5/terraform/aks/main.tf with Azure provider, AKS cluster configuration
- [ ] T121 [P] [US4] Create Terraform main.tf in phase-5/terraform/gke/main.tf with Google provider, GKE cluster configuration

### Helm Charts for Cloud

- [ ] T122 [P] [US4] Create Helm values-oke.yaml in phase-5/helm/todo-app/values-oke.yaml with OKE-specific configuration (LoadBalancer service, resource limits for always-free tier)
- [ ] T123 [P] [US4] Create Helm values-aks.yaml in phase-5/helm/todo-app/values-aks.yaml with AKS-specific configuration
- [ ] T124 [P] [US4] Create Helm values-gke.yaml in phase-5/helm/todo-app/values-gke.yaml with GKE-specific configuration

### CI/CD Pipeline (GitHub Actions)

- [ ] T125 [US4] Create production deployment workflow in phase-5/.github/workflows/deploy-production.yml triggered on push to main branch
- [ ] T126 [US4] Add Docker build and push step in phase-5/.github/workflows/deploy-production.yml for backend, recurring-task-service, notification-service to OCIR
- [ ] T127 [US4] Add kubectl configuration step in phase-5/.github/workflows/deploy-production.yml with OKE kubeconfig from secrets
- [ ] T128 [US4] Add Helm upgrade step in phase-5/.github/workflows/deploy-production.yml with values-oke.yaml, image tag from commit SHA
- [ ] T129 [US4] Add health check step in phase-5/.github/workflows/deploy-production.yml with kubectl rollout status for all deployments
- [ ] T130 [US4] Add integration tests step in phase-5/.github/workflows/deploy-production.yml running pytest tests/integration/ in cluster
- [ ] T131 [US4] Add rollback step in phase-5/.github/workflows/deploy-production.yml with helm rollback on failure
- [ ] T132 [US4] Create staging deployment workflow in phase-5/.github/workflows/deploy-staging.yml triggered on push to develop branch
- [ ] T133 [US4] Test CI/CD pipeline with dummy commit to main branch

### Managed Kafka Configuration

- [ ] T134 [US4] Create Redpanda Cloud Serverless configuration in phase-5/helm/kafka/values-redpanda.yaml with free tier settings (10GB storage, 10MB/s throughput)
- [ ] T135 [US4] Update Dapr Pub/Sub component in phase-5/dapr/components/pubsub-kafka-cloud.yaml with Redpanda Cloud broker URLs, SASL authentication
- [ ] T136 [US4] Create Kafka topic provisioning script in phase-5/scripts/create-cloud-kafka-topics.sh for Redpanda Cloud with 12 partitions, 30-day retention

### Secrets Management

- [ ] T137 [US4] Update Dapr Secrets component in phase-5/dapr/components/secretstore-oci-vault.yaml with OCI Vault configuration, tenancy OCID, compartment OCID
- [ ] T138 [US4] Create secrets in OCI Vault for DATABASE_URL, KAFKA_BROKERS, SMTP_PASSWORD, BETTER_AUTH_SECRET
- [ ] T139 [US4] Update application config in phase-5/backend/src/config.py to retrieve secrets via Dapr Secrets API

### TLS Certificates

- [ ] T140 [US4] Create cert-manager installation step in phase-5/scripts/deploy-oke.sh using Helm chart
- [ ] T141 [US4] Create Ingress resource in phase-5/helm/todo-app/templates/ingress.yaml with TLS configuration, cert-manager annotations, HTTPS redirect
- [ ] T142 [US4] Test HTTPS access after deployment

### Network Policies

- [ ] T143 [P] [US4] Create network policy YAML in phase-5/helm/todo-app/templates/network-policy-recurring-task-service.yaml to restrict Recurring Task Service ingress to Dapr sidecar, egress to Kafka and PostgreSQL
- [ ] T144 [P] [US4] Create network policy YAML in phase-5/helm/todo-app/templates/network-policy-notification-service.yaml to restrict Notification Service ingress to Dapr sidecar, egress to Kafka and SMTP server
- [ ] T145 [P] [US4] Create network policy YAML in phase-5/helm/todo-app/templates/network-policy-backend.yaml to restrict backend ingress to frontend, egress to PostgreSQL and Dapr

**Checkpoint**: At this point, application is deployed to OKE cloud with CI/CD automation, monitoring, and security

---

## Phase 7: User Story 5 - Monitoring & Observability (Priority: P3)

**Goal**: Enable operations teams to monitor production system health, performance, and reliability

**Independent Test**: Access Grafana dashboards → verify metrics from all services, trace complete request in Zipkin

### Prometheus Configuration

- [ ] T146 [US5] Update Prometheus configuration in phase-5/monitoring/prometheus/prometheus.yaml to add scrape configs for Recurring Task Service metrics endpoint, Notification Service metrics endpoint
- [ ] T147 [US5] Update Prometheus alert rules in phase-5/monitoring/prometheus/alerts.yaml to add alert for consumer lag > 60s, reminder delivery failure rate > 5%, pod restart rate > 3/hour
- [ ] T148 [US5] Create ServiceMonitor CRD in phase-5/monitoring/prometheus/servicemonitor-recurring-task.yaml for Recurring Task Service
- [ ] T149 [US5] Create ServiceMonitor CRD in phase-5/monitoring/prometheus/servicemonitor-notification.yaml for Notification Service

### Grafana Dashboards

- [ ] T150 [US5] Update Grafana Kafka dashboard in phase-5/monitoring/grafana/dashboards/kafka-dashboard.json to add panels for message throughput, partition lag, broker health
- [ ] T151 [US5] Update Grafana Dapr dashboard in phase-5/monitoring/grafana/dashboards/dapr-dashboard.json to add panels for pub/sub success rate, state store latency, service invocation latency
- [ ] T152 [US5] Update Grafana recurring tasks dashboard in phase-5/monitoring/grafana/dashboards/recurring-tasks-dashboard.json to add panels for next occurrence calculation duration, recurring task completion rate, end date reached count
- [ ] T153 [US5] Create Grafana reminders dashboard JSON in phase-5/monitoring/grafana/dashboards/reminders-dashboard.json with panels for reminders sent total, reminder delivery latency, failed reminders count

### Distributed Tracing

- [ ] T154 [US5] Update Dapr configuration in phase-5/dapr/config/config.yaml to set sampling rate to 100% for development, 10% for production
- [ ] T155 [US5] Verify Zipkin collects traces for task.completed event flow (Task Service → Kafka → Recurring Task Service → next occurrence creation)
- [ ] T156 [US5] Verify Zipkin collects traces for reminder.scheduled event flow (Task Service → Kafka → Notification Service → email delivery)
- [ ] T157 [US5] Create Zipkin query dashboard in phase-5/monitoring/zipkin/zipkin-queries.md with example queries for debugging slow requests, failed events

### Centralized Logging

- [ ] T158 [US5] Configure structured JSON logging in phase-5/backend/src/config.py with timestamp, level, service, user_id, event_id, message fields
- [ ] T159 [US5] Add logging statements in phase-5/backend/src/services/recurring_task_service.py for next occurrence creation, RRULE calculation errors
- [ ] T160 [US5] Add logging statements in phase-5/backend/src/services/notification_service.py for reminder sending, SMTP failures, retry attempts
- [ ] T161 [US5] Create OCI Logging configuration in phase-5/terraform/oke/logging.tf with log group, log stream for application logs
- [ ] T162 [US5] Test log aggregation by searching for user_id in OCI Logging console

### Health Checks

- [ ] T163 [P] [US5] Create health check endpoint in phase-5/backend/src/api/health.py for backend with database connectivity, Dapr sidecar status
- [ ] T164 [P] [US5] Create health check endpoint in phase-5/services/recurring-task-service/src/api/health.py for Recurring Task Service with Kafka consumer status, database connectivity
- [ ] T165 [P] [US5] Create health check endpoint in phase-5/services/notification-service/src/api/health.py for Notification Service with Kafka consumer status, SMTP connectivity
- [ ] T166 [US5] Update Kubernetes liveness probes in phase-5/helm/todo-app/templates/backend-deployment.yaml to use /health endpoint
- [ ] T167 [US5] Update Kubernetes readiness probes in phase-5/helm/todo-app/templates/recurring-task-service-deployment.yaml to use /health endpoint
- [ ] T168 [US5] Update Kubernetes readiness probes in phase-5/helm/todo-app/templates/notification-service-deployment.yaml to use /health endpoint

### Alerting

- [ ] T169 [US5] Create Alertmanager configuration in phase-5/monitoring/prometheus/alertmanager.yaml with email notification receiver for ops team
- [ ] T170 [US5] Test alert firing by simulating consumer lag > 60s (stop Recurring Task Service pod)
- [ ] T171 [US5] Test alert firing by simulating reminder delivery failure (invalid SMTP credentials)

**Checkpoint**: At this point, operations team has full visibility into production system with dashboards, traces, logs, and alerts

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, optimization, security hardening, Intermediate Level features verification, end-to-end testing

### Intermediate Level Features Verification (Priorities, Tags, Search, Filter, Sort)

**Purpose**: Verify that Intermediate Level features from Phase II work correctly with Phase V features (recurring tasks, reminders)

- [ ] T172 [P] Verify task filtering by priority works with recurring tasks in phase-5/frontend/src/components/TaskList.tsx (filter "high priority recurring tasks")
- [ ] T173 [P] Verify task filtering by tags works with recurring task instances in phase-5/frontend/src/components/TaskList.tsx
- [ ] T174 [P] Verify task search includes recurring_pattern in searchable fields in phase-5/backend/src/api/tasks.py (search "daily recurring tasks")
- [ ] T175 [P] Verify task sorting includes next_occurrence field for recurring tasks in phase-5/backend/src/api/tasks.py (sort by next occurrence date)
- [ ] T176 [P] Verify task filtering by due_date includes next_occurrence for recurring tasks in phase-5/backend/src/api/tasks.py
- [ ] T177 [P] Add integration tests for Intermediate features with Phase V features in phase-5/backend/tests/integration/test_intermediate_features_phase5.py covering filtering, sorting, and search with recurring tasks and reminders

### Documentation

- [ ] T178 [P] Create deployment documentation in phase-5/docs/DEPLOYMENT.md with Minikube deployment steps, OKE deployment steps, AKS/GKE deployment steps
- [ ] T179 [P] Create operations runbook in phase-5/docs/RUNBOOK.md with common issues (consumer lag, reminder failures), troubleshooting steps, rollback procedures
- [ ] T180 [P] Create monitoring guide in phase-5/docs/MONITORING.md with Grafana dashboard overview, Zipkin query examples, alert response procedures
- [ ] T181 [P] Create architecture documentation in phase-5/docs/ARCHITECTURE.md with system context diagram, microservices architecture, event flows
- [ ] T182 [P] Update main README.md in phase-5/README.md with Phase V feature overview, quick start guide, links to detailed docs

### End-to-End Testing

- [ ] T183 Create end-to-end test script in phase-5/tests/e2e/test_recurring_task_flow.py for User Story 1 (create recurring task → mark complete → verify next occurrence created)
- [ ] T184 Create end-to-end test script in phase-5/tests/e2e/test_reminder_flow.py for User Story 2 (create task with due date → wait for reminder → verify email received)
- [ ] T185 Create end-to-end test script in phase-5/tests/e2e/test_minikube_deployment.py for User Story 3 (run deploy script → verify all pods Running → access frontend)
- [ ] T186 Create end-to-end test script in phase-5/tests/e2e/test_oke_deployment.py for User Story 4 (trigger CI/CD → verify deployment success → verify health checks pass)
- [ ] T187 Create end-to-end test script in phase-5/tests/e2e/test_monitoring.py for User Story 5 (access Grafana → verify metrics displayed → trace request in Zipkin)

### Performance Optimization

- [ ] T183 Add database connection pooling in phase-5/backend/src/config.py with SQLAlchemy pool_size=10, max_overflow=20
- [ ] T184 Add Kafka consumer prefetch optimization in phase-5/backend/src/events/consumers.py with prefetch_count=10
- [ ] T185 Add caching for RRULE calculations in phase-5/backend/src/integrations/rrule_parser.py using functools.lru_cache for repeated patterns
- [ ] T186 Optimize database queries in phase-5/backend/src/services/recurring_task_service.py to use bulk inserts for multiple next occurrences

### Security Hardening

- [ ] T187 Add input validation for recurring_pattern in phase-5/backend/src/api/tasks.py to prevent RRULE injection attacks
- [ ] T188 Add rate limiting for task creation API in phase-5/backend/src/api/tasks.py using slowapi (100 requests/minute per user)
- [ ] T189 Add user_id filtering in phase-5/backend/src/services/recurring_task_service.py to prevent cross-user data access
- [ ] T190 Add user_id filtering in phase-5/backend/src/services/notification_service.py to prevent sending reminders to wrong users
- [ ] T191 Enable Dapr mTLS in production by verifying dapr init -k --enable-mtls=true in phase-5/terraform/oke/main.tf

### Backward Compatibility Verification

- [ ] T192 Test existing Phase II/III/IV functionality with NULL Phase V fields to verify old tasks work without changes
- [ ] T193 Test API backward compatibility by calling task creation API without recurring_pattern, reminder_at parameters
- [ ] T194 Test database migration rollback by applying rollback script and verifying application continues to work

### Load Testing

- [ ] T195 Create load test script in phase-5/tests/load/test_kafka_throughput.py using Locust to verify 1000 events/sec sustained throughput
- [ ] T196 Create load test script in phase-5/tests/load/test_consumer_scaling.py to verify horizontal scaling to 12 consumer instances
- [ ] T197 Run load tests on OKE cluster and verify consumer lag < 1s

### Quickstart Validation

- [ ] T198 Run phase-5/scripts/deploy-minikube.sh on clean Minikube cluster and verify all pods reach Running state within 15 minutes
- [ ] T199 Access frontend via kubectl port-forward and verify recurring task creation works end-to-end
- [ ] T200 Verify Grafana dashboards display metrics from all services at http://$(minikube ip):30000
- [ ] T201 Verify Zipkin traces are visible at http://$(minikube ip):30001

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 completion - No dependencies on other user stories
- **Phase 4 (US2)**: Depends on Phase 2 completion - Can run in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 3 AND Phase 4 completion (requires recurring tasks and reminders working)
- **Phase 6 (US4)**: Depends on Phase 5 completion (requires local deployment working first)
- **Phase 7 (US5)**: Depends on Phase 6 completion (requires cloud deployment operational)
- **Phase 8 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Recurring tasks - Can start after Foundational phase - Independent
- **User Story 2 (P1)**: Due dates & reminders - Can start after Foundational phase - Independent
- **User Story 3 (P2)**: Local deployment - Requires US1 and US2 complete
- **User Story 4 (P2)**: Cloud deployment - Requires US3 complete
- **User Story 5 (P3)**: Monitoring - Requires US4 complete

### Within Each User Story

- Phase 2 (Foundational) tasks must complete before Phase 3/4 tasks
- Database migration (T024-T028) must complete before any event publishing
- Dapr components (T029-T034) must be created before event publishing
- Event schemas (T035-T037) must be defined before implementing event publishers/consumers
- RRULE parsing (T044-T049) must be implemented before Recurring Task Service (T050-T056)
- Notification Service (T065-T072) can be developed in parallel with Recurring Task Service
- Terraform infrastructure (T114-T119) must be provisioned before CI/CD deployment (T125-T133)
- Monitoring configuration (T146-T171) can be done in parallel with application deployment

### Parallel Opportunities

- **Phase 1 Setup**: All T001-T023 directory creation tasks can run in parallel [P]
- **Phase 2 Foundational**: Database migration (T024-T028) can run parallel with Dapr setup (T029-T034) [P]
- **Phase 3 US1**: Frontend tasks (T062-T064) can run parallel with backend RRULE tests (T044-T049) [P]
- **Phase 4 US2**: Frontend tasks (T079-T081) can run parallel with backend notification tests (T071-T072) [P]
- **Phase 5 US3**: All Helm template tasks (T098-T102) can run parallel [P]
- **Phase 5 US3**: All monitoring dashboard tasks (T105-T109) can run parallel [P]
- **Phase 6 US4**: Terraform AKS/GKE (T120-T121) can run parallel [P]
- **Phase 6 US4**: Helm values for different clouds (T122-T124) can run parallel [P]
- **Phase 6 US4**: Network policy YAMLs (T143-T145) can run parallel [P]
- **Phase 7 US5**: Health check endpoints (T163-T165) can run parallel [P]
- **Phase 8 Polish**: All documentation tasks (T172-T176) can run parallel [P]

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup (T001-T023)
2. Complete Phase 2: Foundational (T024-T043) - CRITICAL blocking phase
3. Complete Phase 3: User Story 1 - Recurring Tasks (T044-T064)
4. Complete Phase 4: User Story 2 - Reminders (T065-T086)
5. **STOP and VALIDATE**: Test US1 and US2 independently
6. MVP ready for local testing

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (T001-T043)
2. Add User Story 1 → Test independently → Local demo (T044-T064)
3. Add User Story 2 → Test independently → Local demo (T065-T086)
4. Add User Story 3 → Deploy to Minikube → Local production-like environment (T087-T113)
5. Add User Story 4 → Deploy to OKE → Cloud production environment (T114-T145)
6. Add User Story 5 → Full observability → Production-ready (T146-T171)
7. Polish phase → Documentation, optimization, security (T172-T200)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T043)
2. Once Foundational is done:
   - **Developer A**: User Story 1 - Recurring Tasks (T044-T064)
   - **Developer B**: User Story 2 - Reminders (T065-T086)
   - **Developer C**: Local deployment preparation (T087-T095)
3. After US1 and US2 complete:
   - **Developer A**: Minikube Helm charts (T096-T113)
   - **Developer B**: Terraform OKE infrastructure (T114-T121)
   - **Developer C**: CI/CD pipeline (T125-T133)
4. Stories integrate independently at each checkpoint

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label (US1-US5) maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Stop at checkpoints to validate user story works independently
- Database migration (T024-T028) MUST complete before any event publishing
- Dapr components (T029-T034) MUST be created before microservices can start
- Commit after each task or logical group
- Avoid same file conflicts - coordinate file edits across team members
- All timestamps use UTC (no timezone-aware logic per Clarification #1)
- Dapr State Store ONLY for conversation history, NOT task caching (per Clarification #4)
- Kafka topics partitioned by user_id with 12 partitions (per Clarification #3)
- CI/CD triggers: main→production, develop→staging (per Clarification #5)

---

## Task Summary

- **Total Tasks**: 201
- **Phase 1 (Setup)**: 23 tasks (all [P] parallelizable)
- **Phase 2 (Foundational)**: 20 tasks (CRITICAL blocking phase)
- **Phase 3 (US1 - Recurring Tasks)**: 21 tasks
- **Phase 4 (US2 - Reminders)**: 22 tasks
- **Phase 5 (US3 - Local Deployment)**: 27 tasks
- **Phase 6 (US4 - Cloud Deployment)**: 32 tasks
- **Phase 7 (US5 - Monitoring)**: 26 tasks
- **Phase 8 (Polish)**: 30 tasks (includes Intermediate Level features verification: T172-T177)

**Estimated Timeline**: 22 days (4.5 weeks) for single developer, 12 days (2.5 weeks) with 3-person team using parallel strategy
