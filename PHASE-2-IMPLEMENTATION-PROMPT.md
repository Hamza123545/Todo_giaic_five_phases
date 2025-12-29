# Phase 2 Implementation Prompt for Claude Code

## Prompt

```
@phase5-cloud-deployment-engineer

Implement Phase 2: Foundational (Blocking Prerequisites) from specs/007-phase5-cloud-deployment/tasks.md (tasks T024-T043).

**CRITICAL**: This phase MUST be complete before ANY user story work can begin.

**Requirements:**
1. Use Context7 MCP server to verify:
   - Dapr component YAML syntax
   - PostgreSQL migration patterns
   - Kafka topic configuration
   - Event schema patterns
2. Use skills:
   - dapr-integration (for Dapr components)
   - kafka-event-driven (for event schemas and Kafka setup)
   - microservices-patterns (for base event infrastructure)
3. Reference files:
   - Constitution: .specify/memory/constitution.md
   - Spec: specs/007-phase5-cloud-deployment/spec.md
   - Plan: specs/007-phase5-cloud-deployment/plan.md
   - Data Model: specs/007-phase5-cloud-deployment/data-model.md

**Tasks to Complete:**

### Database Migration (T024-T028)
- T024: Create migration script phase-5/backend/migrations/006_add_phase5_fields.sql
  - Add columns: recurring_pattern, recurring_end_date, next_occurrence, reminder_at, reminder_sent
  - All columns nullable for backward compatibility
  - Use UTC timestamps
- T025: Add index on next_occurrence WHERE next_occurrence IS NOT NULL
- T026: Add composite index on (reminder_at, user_id) WHERE reminder_at IS NOT NULL AND reminder_sent = FALSE
- T027: Create rollback script phase-5/backend/migrations/006_rollback.sql
- T028: Test migration and rollback on local PostgreSQL

### Dapr Components Setup (T029-T034)
- T029: Create phase-5/dapr/components/pubsub-kafka.yaml
  - Kafka broker configuration
  - Topics: task-events, reminders, task-updates
  - Use dapr-integration skill template
- T030: Create phase-5/dapr/components/statestore-postgresql.yaml
  - PostgreSQL connection for conversation history
  - Use dapr-integration skill template
- T031: Create phase-5/dapr/components/secretstore-kubernetes.yaml (Minikube)
- T032: Create phase-5/dapr/components/secretstore-oci-vault.yaml (OKE)
- T033: Create phase-5/dapr/components/jobs-scheduler.yaml (Dapr Jobs API)
- T034: Create phase-5/dapr/config/config.yaml
  - Tracing: Zipkin endpoint
  - Metrics: enabled
  - Sampling rate: 100%

### Event Schemas (T035-T037)
- T035: Create phase-5/specs/007-phase5-cloud-deployment/contracts/event-schemas.yaml
  - TaskCompletedEvent, ReminderScheduledEvent, TaskUpdatedEvent (all v1.0)
- T036: Implement phase-5/backend/src/events/schemas.py
  - Base EventSchema class
  - 3 event types with Pydantic models
  - Include user_id, event_id, timestamp, payload
- T037: Create phase-5/backend/tests/contract/test_event_schemas.py
  - Validate event schemas match YAML contracts

### Kafka Setup (T038-T040)
- T038: Create phase-5/helm/kafka/values-minikube.yaml
  - Bitnami Kafka chart
  - 12 partitions per topic
  - 7-day retention (local)
- T039: Create phase-5/helm/kafka/values-redpanda.yaml
  - Redpanda Cloud Serverless config
  - 12 partitions per topic
  - 30-day retention (cloud)
- T040: Create phase-5/scripts/create-kafka-topics.sh
  - Topics: task-events, reminders, task-updates
  - Partitioning strategy: user_id

### Base Event Infrastructure (T041-T043)
- T041: Implement phase-5/backend/src/integrations/dapr_client.py
  - Use dapr-integration skill template
  - Pub/sub methods, state store methods, service invocation methods
  - All 5 Dapr building blocks
- T042: Implement phase-5/backend/src/events/publisher.py
  - Dapr Pub/Sub integration
  - user_id partitioning
  - event_id generation (UUID)
  - Use kafka-event-driven skill patterns
- T043: Implement phase-5/backend/src/events/consumers.py
  - Dapr Pub/Sub subscription
  - Idempotency check
  - User isolation validation
  - Use microservices-patterns skill

**Checkpoint**: After completion, foundation ready - user story implementation can begin in parallel.
```

## Quick Copy-Paste Version

```
@phase5-cloud-deployment-engineer

Implement Phase 2: Foundational (T024-T043) from specs/007-phase5-cloud-deployment/tasks.md.

Use Context7 MCP server + skills: dapr-integration, kafka-event-driven, microservices-patterns.

References: .specify/memory/constitution.md, specs/007-phase5-cloud-deployment/spec.md, plan.md, data-model.md.

Tasks: Database migration, Dapr components (all 5), event schemas, Kafka setup, base event infrastructure.

CRITICAL: Must complete before any user story work.
```

