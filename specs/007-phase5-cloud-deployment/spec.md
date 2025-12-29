# Feature Specification: Phase V - Advanced Cloud Deployment

**Feature Branch**: `007-phase5-cloud-deployment`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "Implement Phase V: Advanced Cloud Deployment for the Todo Chatbot application. This phase extends Phase IV (Kubernetes deployment) with advanced features, event-driven architecture using Kafka, Dapr integration, and cloud deployment to AKS/GKE/OKE."

## Clarifications

### Session 2025-12-29

- Q: RRULE pattern support depth (full RFC 5545 vs simplified patterns) → A: Support simplified RRULE patterns (daily, weekly, monthly, yearly with basic modifiers like day-of-week and interval) as the primary interface, but accept full RFC 5545 RRULE strings if users provide them directly
- Q: Event delivery guarantees and dead letter queue handling → A: Use event-type-specific retry and DLQ strategies based on criticality:
  - **Task completion events** (recurring task creation): 3 retries with exponential backoff (30s, 5min, 30min), then DLQ with 30-day retention, alert ops team
  - **Reminder events** (user notifications): 10 retries with aggressive exponential backoff (1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s ≈ 17min total), then DLQ with 7-day retention, alert user of failed reminder AND alert ops team
  - **Task update events** (data synchronization): 5 retries with exponential backoff (1s, 2s, 4s, 8s, 16s ≈ 31s total), then DLQ with 14-day retention, alert ops team
- Q: Kafka topic partitioning strategy → A: Partition all Kafka topics (`task-events`, `reminders`, `task-updates`) by `user_id` with 12 partitions per topic. This ensures all events for a single user are processed in order while allowing horizontal scaling up to 12 consumer instances per service (Recurring Task Service, Notification Service)
- Q: Primary cloud platform choice (AKS vs GKE vs OKE) → A: Use Oracle Kubernetes Engine (OKE) as the primary cloud deployment target with Terraform IaC templates. The always-free tier (2 AMD VMs, 4 Arm Ampere A1 cores) enables permanent hosting without ongoing costs for learning and development. Azure (AKS) and Google Cloud (GKE) remain supported as secondary platforms using adapted Terraform templates
- Q: Database migration strategy for Phase V fields → A: Add Phase V task fields (`recurring_pattern`, `recurring_end_date`, `next_occurrence`, `reminder_at`, `reminder_sent`) as nullable columns to existing `tasks` table via single ALTER TABLE statement. Existing tasks have NULL values for new fields, meaning "not recurring" and "no reminders". Application code checks for NULL to determine task type. Rollback via DROP COLUMN if needed
- Q: Timezone handling for recurring tasks → A: Use UTC-only approach with client conversion. All recurring task calculations (next_occurrence) are performed in UTC. Frontend is responsible for converting timestamps to user's local timezone for display. Daylight saving time (DST) transitions are not automatically handled - recurring tasks continue on UTC schedule regardless of DST changes
- Q: Inter-service authentication between microservices → A: Use user context propagation only. Services trust Dapr mTLS for service-to-service authentication. Events published to Kafka include `user_id` in the payload. Consuming services (Recurring Task Service, Notification Service) use `user_id` from events for user-level authorization and data isolation. No additional JWT tokens or API keys required between internal services
- Q: Kafka message retention period → A: Use 7 days retention for local Minikube deployment (sufficient for debugging recent issues without filling disk), and 30 days retention for cloud deployment (provides longer audit trail for production incidents while managing storage costs). Applies to all topics: task-events, reminders, task-updates
- Q: Dapr State Store usage scope → A: Use Dapr State Store exclusively for chatbot conversation history (Phase III). Tasks are NOT cached in State Store - all task queries go directly to Neon PostgreSQL. This maintains stateless pod design and avoids cache consistency issues between State Store and database
- Q: CI/CD trigger strategy → A: Use branch-based deployment triggers. Merge to `main` branch triggers production deployment to OKE (or AKS/GKE). Merge to `develop` branch triggers staging environment deployment. Feature branches do not trigger automatic deployments. This follows standard GitFlow workflow and prevents accidental production deployments

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Manage Recurring Tasks (Priority: P1)

Users need tasks that repeat automatically on a schedule (daily standup, weekly reports, monthly bills) without manual recreation. The system automatically creates the next occurrence when a recurring task is completed.

**Why this priority**: Recurring tasks are fundamental to productivity workflows. Without this, users must manually recreate repetitive tasks, leading to inefficiency and missed obligations. This is the core value proposition of Phase V Part A.

**Independent Test**: Can be fully tested by creating a recurring task (e.g., "Daily standup at 9 AM"), marking it complete, and verifying the next occurrence is automatically created with the correct due date. Delivers immediate value by eliminating manual task recreation for repetitive work.

**Acceptance Scenarios**:

1. **Given** a user is authenticated, **When** they create a task with recurring pattern "daily", **Then** the task is saved with recurring metadata and scheduled to repeat every day
2. **Given** a recurring task exists with pattern "weekly on Monday", **When** the user marks it complete on Monday, **Then** the system automatically creates the next occurrence for the following Monday
3. **Given** a recurring task has `recurring_end_date` set to next month, **When** that end date is reached, **Then** no new occurrences are created after completion
4. **Given** a user views their task list, **When** they look at a recurring task, **Then** they can see it is marked as recurring with its pattern (e.g., "Repeats daily", "Repeats monthly on 1st")
5. **Given** a recurring task series exists, **When** the user deletes a single occurrence, **Then** only that occurrence is removed and future occurrences continue to be created

---

### User Story 2 - Set Due Dates with Automatic Reminders (Priority: P1)

Users can assign due dates and times to tasks and receive timely reminder notifications before the deadline, ensuring they never miss important commitments.

**Why this priority**: Time-sensitive task management is critical for productivity. Reminders reduce cognitive load by alerting users proactively rather than requiring constant manual checking. This is equally critical as recurring tasks for basic productivity.

**Independent Test**: Can be fully tested by creating a task with a due date 24 hours in the future and a reminder set for 1 hour before due. Wait until reminder time and verify the user receives an email notification. Delivers immediate value by preventing missed deadlines.

**Acceptance Scenarios**:

1. **Given** a user creates a task with a due date, **When** they set a reminder for "1 hour before due", **Then** the reminder is scheduled in the system
2. **Given** a task has a reminder scheduled, **When** the reminder time arrives, **Then** the user receives an email notification with task details
3. **Given** a task is past its due date and not completed, **When** the user views the task list, **Then** the overdue task is highlighted with a visual indicator (e.g., red text, warning icon)
4. **Given** a user has multiple reminders for different tasks, **When** reminder times arrive, **Then** each reminder is sent at the exact scheduled time (not delayed or batched)
5. **Given** a task with a reminder is completed before the reminder time, **When** the reminder time arrives, **Then** no notification is sent (reminder is cancelled)

---

### User Story 3 - Deploy Todo Application to Local Kubernetes Cluster (Priority: P2)

Developers can deploy the entire Todo application stack (frontend, backend, Kafka, Dapr) to a local Minikube cluster with a single command, enabling rapid local development and testing of the production environment.

**Why this priority**: Local deployment capability is essential for development but secondary to end-user features. It unblocks developers to build and test recurring tasks and reminders in a production-like environment.

**Independent Test**: Can be fully tested by running a deployment script on a clean Minikube cluster and verifying all pods (frontend, backend, Kafka, Dapr sidecars) reach Running state within 15 minutes. Developers can access the frontend via port-forward and create tasks. Delivers value by matching the production environment locally.

**Acceptance Scenarios**:

1. **Given** a developer has Minikube installed, **When** they run the deployment script, **Then** Dapr is installed, Kafka is deployed, and all application services start successfully
2. **Given** the local deployment is complete, **When** the developer port-forwards the frontend service, **Then** they can access the Todo application in their browser
3. **Given** Kafka is running in Minikube, **When** a task is created via the chat interface, **Then** events are published to Kafka topics and consumed by microservices
4. **Given** a recurring task is completed locally, **When** the event is processed, **Then** the next occurrence is created by the Recurring Task Service
5. **Given** the developer makes code changes to the backend, **When** they rebuild and redeploy, **Then** changes are reflected without full cluster redeployment

---

### User Story 4 - Deploy Todo Application to Cloud Kubernetes (OKE Primary, AKS/GKE Secondary) (Priority: P2)

Operations teams can deploy the Todo application to Oracle Kubernetes Engine (OKE) with automated CI/CD pipelines, monitoring, and observability for production use. The always-free tier enables permanent hosting. Azure (AKS) and Google Cloud (GKE) are supported as secondary deployment targets.

**Why this priority**: Cloud deployment is critical for production but depends on local deployment working first. It enables scalable, resilient production hosting but is secondary to core user features.

**Independent Test**: Can be fully tested by triggering the CI/CD pipeline (via git push to main) and verifying deployment to OKE completes successfully, health checks pass, Prometheus collects metrics, and Grafana dashboards display live data. Delivers value by providing a production-grade deployment with permanent free-tier hosting.

**Acceptance Scenarios**:

1. **Given** an OKE cluster is provisioned (or AKS/GKE as alternative), **When** the CI/CD pipeline runs, **Then** Docker images are built, pushed to OCIR (or ACR/GCR), and deployed via Helm
2. **Given** the application is deployed to cloud, **When** traffic is routed through the ingress, **Then** the frontend is accessible over HTTPS with valid TLS certificates
3. **Given** Dapr is installed on the cloud cluster, **When** application pods start, **Then** Dapr sidecars are injected and mTLS is enabled between services
4. **Given** managed Kafka (or cloud pub/sub) is configured, **When** tasks are created, **Then** events flow through the cloud message broker without message loss
5. **Given** Prometheus and Grafana are deployed, **When** the application processes tasks, **Then** metrics dashboards show real-time task operations, event processing rates, and Dapr metrics
6. **Given** distributed tracing is enabled, **When** a user completes a recurring task, **Then** the full event flow (task completion → Kafka event → Recurring Task Service → next occurrence creation) is visible in Zipkin/Jaeger
7. **Given** secrets are stored in OCI Vault (or Azure Key Vault / Google Secret Manager), **When** pods start, **Then** database credentials and API keys are retrieved securely without hardcoding

---

### User Story 5 - Monitor and Troubleshoot Production System (Priority: P3)

Operations teams can monitor the health, performance, and reliability of the production Todo application using centralized dashboards, logs, and distributed tracing to quickly identify and resolve issues.

**Why this priority**: Monitoring is critical for production operations but depends on cloud deployment being operational. It's a supporting capability that enables maintaining the system over time.

**Independent Test**: Can be fully tested by accessing Grafana dashboards and verifying all services report metrics, accessing centralized logs in OCI Logging (or Azure Log Analytics / Cloud Logging), and tracing a complete user request from frontend → backend → Kafka → microservices in Zipkin/Jaeger. Delivers value by providing operational visibility.

**Acceptance Scenarios**:

1. **Given** Prometheus is collecting metrics, **When** an ops engineer views the Grafana dashboard, **Then** they see real-time metrics for task operations (create, complete, delete), event processing rates, and pod health
2. **Given** centralized logging is configured, **When** an error occurs in any service, **Then** the logs are aggregated and searchable in OCI Logging (or Azure Log Analytics / Google Cloud Logging)
3. **Given** distributed tracing is enabled, **When** an ops engineer investigates a slow request, **Then** they can see the full trace across all services (frontend → backend → Dapr → Kafka → microservices)
4. **Given** alerts are configured for critical failures, **When** a pod crashes or event processing delays exceed thresholds, **Then** alerts are triggered and sent to the operations team
5. **Given** uptime monitoring is configured, **When** health check endpoints are queried, **Then** the system reports status and response times

---

### Edge Cases

- **What happens when a recurring task's end date is reached?** The system stops creating new occurrences after the last completion before the end date. Users can extend the end date if needed.
- **What happens if Kafka is temporarily unavailable?** Events are queued and retried with exponential backoff based on event type (task completion: 3 retries over 36min, reminders: 10 retries over 17min, updates: 5 retries over 31s). After max retries, events move to dead letter queue. No events are lost (at-least-once delivery guarantee).
- **What happens when events land in the dead letter queue?** The operations team receives alerts immediately. For failed reminder events, users also receive notification that their reminder failed to deliver. Ops team can manually retry DLQ events via admin API. DLQ events are retained based on type (7-30 days) before automatic deletion.
- **How does the system handle a reminder for a task that was just completed?** The reminder is cancelled when the task is marked complete. No notification is sent for completed tasks.
- **What happens if a user completes a recurring task multiple times in quick succession?** Each completion triggers creation of the next occurrence. If multiple completions happen, multiple next occurrences are queued but deduplicated by the Recurring Task Service.
- **How does the system handle clock skew across distributed services?** All timestamps use UTC. Dapr Jobs API uses server-side scheduling to avoid client clock issues.
- **What happens if the Recurring Task Service crashes while processing an event?** Kafka retains the event. When the service restarts, it reprocesses from the last committed offset (idempotent processing required).
- **How does the system handle a task with both recurring pattern AND a due date?** Each occurrence inherits the recurring pattern but has its own due date calculated from the pattern (e.g., "weekly on Monday" creates occurrences with due dates on consecutive Mondays).
- **What happens if deployment to cloud fails mid-pipeline?** The CI/CD pipeline rolls back to the previous stable version automatically. Alerts notify the ops team.
- **How does the system handle scaling to 100+ recurring tasks completing simultaneously?** Kafka partitions events by user_id across 12 partitions. The Recurring Task Service can scale horizontally up to 12 consumer instances, with each instance processing events from dedicated partitions. Events for a single user are always processed by the same consumer instance in order.
- **What happens if a user deletes a recurring task series while processing is in flight?** The Recurring Task Service checks for task existence before creating next occurrence. Orphaned events are safely ignored.
- **What happens if database migration fails during deployment?** The deployment rolls back to the previous version. Phase V fields are not added, and the system continues running with Phase IV schema. Existing tasks are unaffected.
- **How does the system handle tasks created before Phase V migration?** Existing tasks have NULL values for Phase V fields. Application code treats NULL `recurring_pattern` as "not recurring" and NULL `reminder_at` as "no reminders". Old tasks work exactly as before.

## Requirements *(mandatory)*

### Functional Requirements

**Part A: Advanced Features**

**Note**: Intermediate Level features (Priorities, Tags, Search, Filter, Sort) are already implemented in Phase II (constitution lines 616-621) and MUST continue to work with Phase V features. The following requirements ensure compatibility:

- **FR-000**: System MUST verify Intermediate Level features (Priorities, Tags, Search, Filter, Sort) from Phase II work correctly with Phase V features (recurring tasks, reminders)
- **FR-000a**: Task filtering MUST support filtering recurring tasks by pattern (e.g., "show all daily recurring tasks")
- **FR-000b**: Task sorting MUST support sorting by next_occurrence for recurring tasks
- **FR-000c**: Task search MUST include recurring_pattern in searchable fields
- **FR-000d**: Task filtering by priority and tags MUST work with recurring task instances
- **FR-000e**: Task filtering by due_date MUST include next_occurrence for recurring tasks

- **FR-001**: System MUST support creating tasks with recurring patterns: daily, weekly, monthly, yearly
- **FR-002**: System MUST support simplified RRULE patterns (daily, weekly, monthly, yearly with basic modifiers: day-of-week, interval) as primary interface, and MUST accept full RFC 5545 RRULE strings if provided directly by users
- **FR-003**: System MUST store recurring pattern, recurring end date, and next occurrence timestamp for each recurring task as nullable columns in the existing tasks table
- **FR-003a**: Database migration MUST add Phase V fields (`recurring_pattern`, `recurring_end_date`, `next_occurrence`, `reminder_at`, `reminder_sent`) as nullable columns via ALTER TABLE
- **FR-003b**: Existing tasks MUST have NULL values for Phase V fields after migration, indicating non-recurring tasks with no reminders
- **FR-003c**: Application code MUST treat NULL values in recurring fields as "not recurring" and NULL in reminder fields as "no reminders"
- **FR-004**: System MUST automatically create the next occurrence of a recurring task when the current occurrence is marked complete
- **FR-005**: System MUST allow users to edit or delete individual occurrences of a recurring task series
- **FR-006**: System MUST allow users to edit or delete an entire recurring task series
- **FR-007**: System MUST prevent future occurrences from being created after the recurring end date is reached
- **FR-008**: System MUST support setting due dates and times for tasks
- **FR-009**: System MUST support scheduling reminders at specific times before due dates (1 hour, 1 day, 1 week before)
- **FR-010**: System MUST support multiple reminders per task
- **FR-011**: System MUST send email notifications at the exact scheduled reminder time (not polling-based)
- **FR-012**: System MUST highlight overdue tasks in the user interface
- **FR-013**: System MUST cancel reminders for tasks that are completed before the reminder time
- **FR-014**: System MUST publish events to Kafka for all task operations: create, update, complete, delete
- **FR-014a**: System MUST partition all Kafka events by `user_id` to ensure ordering guarantees per user
- **FR-015**: System MUST use Dapr HTTP APIs for all event publishing (no direct Kafka client code in application)
- **FR-016**: System MUST use versioned event schemas for all Kafka messages
- **FR-016a**: All events published to Kafka MUST include `user_id` in the event payload for user-level authorization
- **FR-016b**: Consuming services MUST use `user_id` from events to enforce user isolation when creating/updating tasks
- **FR-016c**: Services MUST rely on Dapr mTLS for service-to-service authentication (no additional JWT tokens or API keys between internal services)
- **FR-017**: Recurring Task Service MUST consume task completion events from Kafka and create next occurrences
- **FR-018**: Notification Service MUST consume reminder events from Kafka and send email notifications
- **FR-019**: System MUST support at-least-once event delivery guarantee (events are never lost)
- **FR-020**: System MUST support push notifications in addition to email notifications
- **FR-020a**: System MUST implement event-type-specific retry strategies based on event criticality:
  - Task completion events: 3 retries with exponential backoff (30s, 5min, 30min)
  - Reminder events: 10 retries with exponential backoff (1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s)
  - Task update events: 5 retries with exponential backoff (1s, 2s, 4s, 8s, 16s)
- **FR-020b**: System MUST move failed events to dead letter queue (DLQ) after max retry attempts exceeded
- **FR-020c**: System MUST configure DLQ retention periods based on event type:
  - Task completion events: 30-day retention
  - Reminder events: 7-day retention
  - Task update events: 14-day retention
- **FR-020d**: System MUST alert operations team when events are moved to DLQ
- **FR-020e**: System MUST alert users when reminder notifications fail to deliver (in addition to ops team alert)
- **FR-020f**: System MUST provide admin API to manually retry events from DLQ

**Part B: Local Deployment (Minikube)**

- **FR-021**: System MUST be deployable to Minikube using existing Helm charts from Phase IV
- **FR-022**: Deployment script MUST install Dapr runtime on Minikube (`dapr init -k`) with **Full Dapr**: Pub/Sub, State, Bindings (via Dapr Jobs API), Secrets, Service Invocation
- **FR-023**: Deployment script MUST deploy Kafka cluster within Minikube (Redpanda or Strimzi)
- **FR-024**: Deployment script MUST create Kafka topics: `task-events`, `reminders`, `task-updates` with 12 partitions each, partitioned by `user_id` to ensure ordering of events per user
- **FR-024a**: Kafka topics MUST be configured with 7-day message retention for local (Minikube) deployment and 30-day retention for cloud deployment
- **FR-025**: System MUST deploy Dapr components as YAML files: pubsub-kafka.yaml, statestore-postgresql.yaml, secretstores-kubernetes.yaml
- **FR-025a**: Dapr State Store MUST be used exclusively for chatbot conversation history (Phase III), NOT for task data caching or storage
- **FR-025b**: **Full Dapr MUST be used** with all 5 building blocks: Pub/Sub (Kafka), State (PostgreSQL for conversation history), Bindings (via Dapr Jobs API for scheduled reminders), Secrets (Kubernetes secrets), Service Invocation (service-to-service communication with mTLS)
- **FR-026**: System MUST deploy Recurring Task Service and Notification Service as separate Kubernetes deployments
- **FR-027**: All application pods MUST have Dapr sidecar injection enabled
- **FR-028**: All services MUST communicate via Dapr Pub/Sub (not direct Kafka clients)
- **FR-029**: Deployment script MUST complete successfully in under 15 minutes on a clean Minikube cluster
- **FR-030**: Frontend MUST be accessible via port-forwarding to localhost within 2 minutes of deployment completion

**Part C: Cloud Deployment (OKE Primary, AKS/GKE Secondary)**

- **FR-031**: System MUST be deployable to Oracle Kubernetes Engine (OKE) as primary platform, with support for Azure Kubernetes Service (AKS) and Google Kubernetes Engine (GKE) as secondary platforms
- **FR-032**: Deployment MUST support infrastructure-as-code using Terraform (primary for OKE, portable to AKS/GKE)
- **FR-033**: **Full Dapr MUST be installed** on cloud cluster: Pub/Sub, State, Bindings (via Dapr Jobs API), Secrets, Service Invocation with mTLS enabled for service-to-service communication
- **FR-034**: System MUST support both managed Kafka (Confluent Cloud, Redpanda Cloud) and cloud-native pub/sub (Azure Service Bus, Google Pub/Sub)
- **FR-035**: Dapr Pub/Sub component MUST be configurable to use either Kafka or cloud pub/sub backend
- **FR-036**: CI/CD pipeline MUST build Docker images for all services (frontend, backend, Recurring Task Service, Notification Service)
- **FR-037**: CI/CD pipeline MUST push Docker images to Oracle Cloud Infrastructure Registry (OCIR) as primary, with support for Azure Container Registry (ACR) and Google Container Registry (GCR)
- **FR-038**: CI/CD pipeline MUST deploy application using Helm charts
- **FR-039**: CI/CD pipeline MUST run integration tests before deploying to production
- **FR-040**: CI/CD pipeline MUST support staging and production environments
- **FR-040a**: CI/CD pipeline MUST trigger production deployment when code is merged to `main` branch
- **FR-040b**: CI/CD pipeline MUST trigger staging deployment when code is merged to `develop` branch
- **FR-040c**: Feature branches MUST NOT trigger automatic deployments
- **FR-041**: CI/CD pipeline MUST support automated rollback on deployment failure
- **FR-042**: Frontend MUST be accessible via HTTPS with valid TLS certificates (using cert-manager)
- **FR-043**: System MUST store secrets in Oracle Vault (OCI Vault) as primary, with support for Azure Key Vault and Google Secret Manager
- **FR-044**: Database credentials and API keys MUST be retrieved from cloud secret manager (not hardcoded or in ConfigMaps)
- **FR-045**: Dapr secrets component MUST be integrated with cloud secret manager (OCI Vault for OKE deployments)
- **FR-046**: Prometheus MUST collect metrics from all services
- **FR-047**: Grafana MUST visualize metrics via dashboards (task operations, event processing, Dapr metrics, pod health)
- **FR-048**: Application logs MUST be centralized in Oracle Cloud Logging (OCI Logging) as primary, with support for Azure Log Analytics and Google Cloud Logging
- **FR-049**: Distributed tracing MUST be enabled using Dapr tracing with Zipkin or Jaeger
- **FR-050**: Alerts MUST be configured for critical failures (pod crashes, event processing delays, high error rates)
- **FR-051**: Uptime monitoring MUST be configured for health check endpoints
- **FR-052**: System MUST enforce network policies to restrict pod-to-pod communication
- **FR-053**: Deployment to cloud MUST complete via CI/CD pipeline in under 20 minutes

### Key Entities

**Task (Extended)**
- **Core Attributes** (from Phase II-IV): id, user_id, title, description, completed, created_at, updated_at, priority, due_date, tags
- **New Attributes for Phase V**:
  - `recurring_pattern`: String defining recurrence (e.g., "daily", "weekly", "monthly", RRULE format). Null for non-recurring tasks.
  - `recurring_end_date`: Datetime when recurring should stop. Null for infinite recurrence.
  - `next_occurrence`: Datetime when next occurrence should be created. Used by Recurring Task Service.
  - `reminder_at`: Datetime when reminder notification should be sent.
  - `reminder_sent`: Boolean tracking if reminder has been sent.
- **Relationships**: Tasks belong to a user. Recurring tasks have a series relationship (parent → child occurrences).

**TaskEvent (New)**
- **Purpose**: Represents an event published to Kafka when a task operation occurs
- **Attributes**:
  - `event_id`: Unique identifier for the event
  - `event_type`: Type of operation (task.created, task.updated, task.completed, task.deleted)
  - `event_version`: Schema version for compatibility (e.g., "1.0")
  - `task_id`: ID of the task this event pertains to
  - `user_id`: ID of the user who owns the task
  - `timestamp`: When the event occurred (UTC)
  - `payload`: JSON object containing task data and operation-specific fields
- **Note**: TaskEvent is NOT persisted in the database - it only exists in Kafka topics

**Reminder (New)**
- **Purpose**: Represents a scheduled reminder for a task
- **Attributes**:
  - `id`: Unique reminder identifier
  - `task_id`: ID of the task this reminder is for
  - `user_id`: User who should receive the reminder
  - `reminder_at`: Exact datetime to send the notification
  - `reminder_sent`: Boolean indicating if notification was sent
  - `notification_type`: Type of notification (email, push)
  - `created_at`: When reminder was scheduled
- **Relationships**: Reminder belongs to a Task and a User

**DaprComponent (Infrastructure)**
- **Purpose**: Represents a Dapr building block configuration
- **Types** (Full Dapr - All 5 Building Blocks Required):
  - **Pub/Sub**: Kafka integration for event streaming (task-events, reminders, task-updates topics)
  - **State Store**: PostgreSQL integration for conversation history persistence ONLY (not for task caching)
  - **Bindings**: Cron triggers (replaced by Dapr Jobs API in implementation for exact-time scheduled reminders)
  - **Secrets Store**: Kubernetes secrets or cloud secret manager integration (OCI Vault for OKE, Azure Key Vault for AKS, Google Secret Manager for GKE)
  - **Service Invocation**: Service-to-service communication with built-in retries, circuit breakers, and mTLS
- **Note**: DaprComponents are defined via YAML files, not database entities. State Store is used exclusively for chatbot conversation state, NOT for task data caching. Dapr Jobs API replaces Cron Bindings for scheduled reminders to provide exact-time scheduling instead of polling.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Part A: Advanced Features**

- **SC-001**: Users can create recurring tasks with all supported patterns (daily, weekly, monthly, yearly) and custom RRULE patterns
- **SC-002**: When a recurring task is marked complete, the next occurrence is automatically created within 30 seconds
- **SC-003**: Reminder notifications are delivered within 1 minute of the scheduled reminder time
- **SC-004**: All task operations (create, update, complete, delete) publish events to Kafka with 100% reliability (no lost events)
- **SC-005**: Event-driven architecture processes 1000+ events per minute without lag or message backlog
- **SC-006**: Overdue tasks are correctly highlighted in the user interface with visual indicators
- **SC-006a**: Event retry mechanisms work correctly - failed events retry with event-type-specific exponential backoff and move to DLQ after max retries, triggering appropriate alerts (ops team for all events, users for failed reminders)
- **SC-006b**: Database migration adds Phase V fields successfully, existing tasks have NULL values for new fields, and old tasks continue to function without any changes in behavior

**Part B: Local Deployment (Minikube)**

- **SC-007**: One-command deployment to Minikube completes successfully in under 15 minutes on a clean cluster
- **SC-008**: Kafka cluster is healthy and accessible from backend pods after deployment
- **SC-009**: Dapr sidecar successfully publishes events to Kafka topics and consumes subscriptions
- **SC-010**: Frontend is accessible via port-forward on localhost within 2 minutes of deployment completion
- **SC-011**: End-to-end event flow works: task completion → Kafka event → Recurring Task Service → next occurrence created within 30 seconds
- **SC-011a**: Kafka topics are correctly partitioned by user_id with 12 partitions each, and consumer services can scale up to 12 instances with proper partition assignment
- **SC-012**: Hot-reload works for backend development (code changes reflected without full cluster redeployment)

**Part C: Cloud Deployment (OKE Primary, AKS/GKE Secondary)**

- **SC-013**: Deployment to OKE (or AKS/GKE) completes via CI/CD pipeline in under 20 minutes
- **SC-014**: Managed Kafka or cloud pub/sub processes events with zero message loss (at-least-once delivery verified)
- **SC-015**: Prometheus collects metrics from all services (frontend, backend, Recurring Task Service, Notification Service)
- **SC-016**: Grafana dashboards display real-time metrics for task operations, event processing rates, and Dapr metrics
- **SC-017**: Distributed tracing shows complete end-to-end request flows across all services in Zipkin/Jaeger
- **SC-018**: All secrets (database credentials, API keys) are retrieved from OCI Vault (or Azure Key Vault / Google Secret Manager) with no hardcoded credentials visible in pods or logs
- **SC-019**: Frontend serves traffic over HTTPS with valid TLS certificates automatically provisioned by cert-manager
- **SC-020**: Application logs are centralized and searchable in OCI Logging (or Azure Log Analytics / Google Cloud Logging)
- **SC-021**: Alerts trigger when critical thresholds are exceeded (pod crashes, event processing delays > 5 minutes, error rate > 5%)
- **SC-022**: Health check endpoints respond with status within 500ms
- **SC-023**: System handles 50+ concurrent users creating tasks and setting reminders without performance degradation
- **SC-024**: CI/CD pipeline automatically rolls back to previous stable version if deployment health checks fail

## Assumptions

1. **External Services Remain External**: Neon PostgreSQL (database) and Cloudflare R2 (storage) will continue to be hosted externally, not within the Kubernetes cluster. This maintains the Phase IV architecture.

2. **Stateless Pod Design**: All application pods (frontend, backend, Recurring Task Service, Notification Service) remain stateless. Only Kafka requires persistent volumes for message retention. Dapr State Store is used exclusively for conversation history (Phase III), NOT for task caching. All task data queries go directly to Neon PostgreSQL.

3. **User Isolation Maintained**: All Phase V features enforce user isolation. Users can only create recurring tasks and reminders for their own tasks. Event processing respects user boundaries by propagating `user_id` in event payloads. Microservices trust Dapr mTLS for service-to-service authentication and use `user_id` from events for user-level authorization.

4. **Email Service Assumed Available**: The system assumes an email service (e.g., SendGrid, AWS SES, SMTP server) is available for sending email notifications. Configuration is provided via environment variables.

5. **Push Notification Service Assumed Available**: The system assumes a push notification service (e.g., Firebase Cloud Messaging, OneSignal) is available for sending push notifications. Configuration is provided via environment variables.

6. **Cloud Provider Accounts Available**: Deployment to OKE (primary) assumes users have Oracle Cloud account with always-free tier (2 AMD VMs, 4 Arm Ampere A1 cores) or $300 credit for 30 days. Deployment to AKS/GKE (secondary) assumes users have active accounts with appropriate credits or free tier access.

7. **Dapr Version**: Dapr 1.12+ is assumed to be compatible with the specified Kubernetes versions (1.28+). The deployment scripts will verify version compatibility.

8. **Kafka Compatibility**: Redpanda and Strimzi are assumed to be Kafka-compatible for the required features (pub/sub topics, consumer groups, at-least-once delivery, configurable retention periods).

9. **RRULE Library Availability**: A Python RRULE parsing library (e.g., `python-dateutil`) is assumed to be available for parsing custom recurring patterns.

10. **Backward Compatibility**: All Phase II, III, and IV functionality remains intact. Existing tasks without recurring patterns or reminders continue to work exactly as before. Phase V fields are added as nullable columns, and NULL values indicate non-recurring tasks with no reminders.

11. **Default Recurring End Date**: If a user creates a recurring task without specifying an end date, the system assumes infinite recurrence until manually stopped.

12. **Default Reminder Timing**: If a user sets a due date without explicitly setting a reminder, the system does not automatically create a reminder. Reminders are opt-in.

13. **Event Schema Versioning**: The initial event schema version is 1.0. Future schema changes will use version 2.0, 3.0, etc., with backward compatibility maintained.

14. **Idempotent Event Processing**: Event consumers (Recurring Task Service, Notification Service) are designed to be idempotent. Processing the same event multiple times (due to retries) produces the same result.

15. **Monitoring Stack Pre-configured**: Prometheus, Grafana, Zipkin/Jaeger are assumed to be deployed to the cluster as part of the deployment script. They are not managed by the Todo application itself.

16. **No Breaking Changes to API**: Phase V extends the REST API and MCP tools with new fields (recurring_pattern, reminder_at, etc.) but does not break existing API contracts. All new fields are optional.

17. **Single Cloud Provider per Deployment**: Each deployment targets one cloud provider (OKE as primary, AKS/GKE as secondary). Multi-cloud deployments across providers are not required.

18. **Development Environment**: Developers have Minikube, kubectl, Helm, and Docker installed locally for Part B (Local Deployment).

19. **CI/CD Platform**: GitHub Actions is the assumed CI/CD platform. Alternative platforms (GitLab CI, Azure DevOps) are out of scope. Branch-based deployment triggers are used: `main` → production, `develop` → staging, feature branches do not auto-deploy.

20. **Time Zone Handling**: All due dates, reminder times, and next occurrences are stored and calculated in UTC. Recurring task calculations use UTC-only (no timezone-aware logic). Frontend is responsible for converting timestamps to user's local time zone for display. DST transitions do not affect recurring schedules.

## Dependencies

1. **Phase II, III, and IV Completion**: Phase V builds on the existing Todo application with authentication, chatbot, and Kubernetes deployment. These phases must be fully functional.

2. **Kafka Message Broker**: Required for event-driven architecture. Can be Redpanda (Minikube) or managed Kafka (cloud).

3. **Dapr Runtime**: Required for **Full Dapr** implementation: Pub/Sub (Kafka), State (PostgreSQL for conversation history), Bindings (via Dapr Jobs API), Secrets (Kubernetes/cloud secret managers), Service Invocation (service-to-service communication). Must be installed on Kubernetes clusters with all 5 building blocks configured.

4. **Helm 3.x**: Required for packaging and deploying the application to Kubernetes.

5. **Kubernetes 1.28+**: Required for running the application, Kafka, and Dapr.

6. **Email Service Provider**: Required for sending email notifications (e.g., SendGrid, AWS SES, SMTP).

7. **Push Notification Service**: Required for sending push notifications (e.g., Firebase Cloud Messaging, OneSignal).

8. **Cloud Provider Account**: Required for Part C cloud deployment. Oracle Cloud account (primary) with always-free tier or AKS/GKE accounts (secondary) with credits are sufficient for development.

9. **Container Registry**: Required for storing Docker images (OCIR for OKE primary, ACR/GCR for AKS/GKE secondary, or Docker Hub).

10. **Cloud Secret Manager**: Required for secure secrets management in production (OCI Vault for OKE primary, Azure Key Vault / Google Secret Manager for AKS/GKE secondary).

11. **Monitoring Stack**: Prometheus, Grafana, Zipkin/Jaeger required for observability.

12. **Cert-Manager**: Required for automatic TLS certificate provisioning in cloud deployment.

13. **Infrastructure-as-Code Tool**: Terraform required for provisioning cloud infrastructure (primary for OKE, portable to AKS/GKE).

14. **GitHub Repository**: Required for CI/CD pipelines via GitHub Actions.

15. **RRULE Parsing Library**: Python library for parsing recurring patterns (e.g., `python-dateutil`, `rrule`).

## Out of Scope

1. **User Interface for Recurring Task Management**: Phase V focuses on backend implementation. The chatbot interface will support creating recurring tasks via natural language ("create daily standup task"), but a dedicated UI for managing recurring patterns is out of scope. Users interact via chat.

2. **Advanced RRULE Editor**: Complex RRULE patterns are supported but creating them requires understanding RRULE syntax. A visual RRULE builder is out of scope.

3. **Time Zone Support for Recurrence Calculations**: Recurring tasks use UTC-only for all calculations (next_occurrence timestamps). Daylight saving time (DST) transitions are not automatically handled - recurring tasks continue on UTC schedule. Frontend converts timestamps to user's local timezone for display only.

4. **Recurring Task Analytics**: Tracking statistics like "how many times has this recurring task been completed" is out of scope.

5. **Reminder Customization**: Reminder content is standardized ("Your task 'X' is due in 1 hour"). Customizing reminder message templates is out of scope.

6. **Multiple Cloud Providers Simultaneously**: Deploying to multiple cloud providers (e.g., both AKS and GKE) in a single setup is out of scope. Each deployment targets one provider.

7. **Multi-Region Deployment Automation**: While infrastructure-as-code supports multi-region, automated failover and traffic routing across regions is out of scope.

8. **Cost Optimization Monitoring**: Monitoring focuses on performance and reliability. Cloud cost tracking and optimization recommendations are out of scope.

9. **Backup and Disaster Recovery**: Automated backups of Kafka messages and Kubernetes state are out of scope. External database (Neon PostgreSQL) handles its own backups.

10. **Advanced Security Hardening**: Beyond mTLS, network policies, and secret management, advanced security features (WAF, DDoS protection, intrusion detection) are out of scope.

11. **Audit Service Implementation**: While the architecture mentions an optional Audit Service, implementing it is out of scope for Phase V MVP.

12. **WebSocket Service Implementation**: While the architecture mentions an optional WebSocket Service for real-time sync, implementing it is out of scope for Phase V MVP.

13. **Mobile App Push Notifications**: Push notifications are mentioned as mandatory, but implementing a native mobile app to receive them is out of scope. Push notifications will target web browsers.

14. **Reminder Snooze Functionality**: Allowing users to snooze reminders is out of scope.

15. **Recurring Task Exceptions**: Skipping specific dates in a recurring series (e.g., "weekly on Monday except holidays") is out of scope.

16. **Manual Event Replay**: Replaying Kafka events for debugging or recovery is out of scope. Events are processed once.

17. **Custom Monitoring Dashboards per User**: Grafana dashboards are system-wide. User-specific dashboards are out of scope.

18. **Load Testing Automation**: While the system must handle specified loads, automated load testing as part of CI/CD is out of scope.

19. **Chaos Engineering**: Intentionally injecting failures to test resilience is out of scope.

20. **Compliance Certifications**: SOC 2, HIPAA, GDPR compliance certifications are out of scope. The system follows best practices but is not certified.
