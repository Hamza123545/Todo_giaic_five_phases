# ADR-0001: Infrastructure Abstraction with Dapr

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-12-29
- **Feature:** 007-phase5-cloud-deployment
- **Context:** Phase V requires event streaming (Kafka), state storage (conversation history), scheduled jobs (reminders), secrets management, and service-to-service communication. Direct integration with each infrastructure component would create vendor lock-in, increase complexity, and require significant code changes when swapping providers. The application needs to run on multiple platforms (local Minikube, OKE, AKS, GKE) with minimal code changes.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: ✅ Long-term consequence - affects all microservices, deployment strategy, and operational complexity
     2) Alternatives: ✅ Multiple viable options - direct clients, cloud-specific services, custom abstraction
     3) Scope: ✅ Cross-cutting concern - impacts all 5 microservices and infrastructure layers
     All three tests passed - ADR justified. -->

## Decision

Use Dapr (Distributed Application Runtime) for all infrastructure abstraction with the following building blocks:

- **Pub/Sub**: Kafka integration for event streaming (task.completed, reminder.scheduled, task.updated events)
- **State Store**: PostgreSQL for conversation history ONLY (per Clarification #4 - no task caching to avoid cache consistency issues)
- **Jobs API**: Exact-time reminder scheduling (replaces polling-based Cron Bindings)
- **Secrets**: Cloud-native vaults (OCI Vault for OKE, Azure Key Vault for AKS, Google Secret Manager for GKE, Kubernetes Secrets for Minikube)
- **Service Invocation**: mTLS for service-to-service authentication (no JWT tokens between internal services per Clarification #2)

All application code uses Dapr HTTP APIs (http://localhost:3500/v1.0/*) instead of direct infrastructure clients. Infrastructure providers are configured via Dapr component YAML files (dapr/components/*.yaml) without changing application code.

## Consequences

### Positive

- **Vendor neutrality**: Swap Kafka→RabbitMQ, PostgreSQL→Redis, OCI Vault→Azure Key Vault by changing YAML files (no code changes)
- **Simplified application code**: Single consistent API for all infrastructure operations (HTTP calls to Dapr sidecar)
- **Automatic capabilities**: Built-in retry logic, dead letter queues, distributed tracing, metrics without manual implementation
- **Multi-cloud deployment**: Same application code runs on OKE, AKS, GKE with different Dapr component configurations
- **Local development parity**: Use Bitnami Kafka + Kubernetes Secrets locally, Redpanda Cloud + OCI Vault in production with same app code
- **Security by default**: mTLS for all service-to-service communication, secrets never in environment variables

### Negative

- **Additional latency**: ~5-10ms overhead per Dapr sidecar call (HTTP → sidecar → infrastructure)
- **Learning curve**: Engineers must understand Dapr concepts (building blocks, components, sidecars) beyond Kubernetes
- **Debugging complexity**: Two-hop architecture (app → Dapr sidecar → infrastructure) makes tracing failures harder
- **Resource overhead**: Each pod requires Dapr sidecar (~50MB RAM, 0.1 CPU per sidecar) × 5 microservices = 250MB RAM, 0.5 CPU
- **Alpha features**: Jobs API is alpha (Dapr 1.12+) with limited documentation and potential breaking changes
- **Abstraction leakage**: Some provider-specific features unavailable through Dapr (e.g., Kafka transactional producer)

## Alternatives Considered

### Alternative A: Direct Infrastructure Clients
**Components**:
- Kafka Python client (aiokafka or confluent-kafka-python)
- PostgreSQL client (SQLAlchemy, asyncpg)
- Celery Beat for scheduling
- cloud-specific SDK for secrets (oci-sdk, azure-identity, google-cloud-secret-manager)

**Why rejected**:
- Vendor lock-in: Switching Kafka→RabbitMQ requires rewriting all event publishing/consuming code
- Cloud-specific code: Different secret retrieval code for OKE vs AKS vs GKE (no unified API)
- Manual retry/DLQ: Must implement exponential backoff, dead letter queues manually for each consumer
- No multi-cloud portability: Application code tightly coupled to specific infrastructure providers

### Alternative B: Cloud-Specific Managed Services
**Components**:
- Azure Service Bus (Pub/Sub)
- Azure Cache for Redis (State Store)
- Azure Functions (scheduled jobs)
- Azure Key Vault (secrets)

**Why rejected**:
- Complete vendor lock-in: Cannot run on OKE or GKE without full rewrite
- No local development: Cannot run Azure Service Bus on Minikube (requires cloud connection or expensive emulators)
- Cost: Managed services exceed free tier quickly (Service Bus, Cache for Redis not free)
- Violates specification requirement (FR-026, FR-027): Spec explicitly requires infrastructure abstraction

### Alternative C: Custom Abstraction Layer
**Components**:
- Custom Python interfaces (EventPublisher, StateStore, SecretManager, etc.)
- Provider-specific implementations (KafkaEventPublisher, PostgreSQLStateStore, OCISecretManager, etc.)
- Manual dependency injection and configuration

**Why rejected**:
- Reinventing the wheel: Dapr already provides well-tested abstraction with 50M+ downloads
- Maintenance burden: Must maintain custom abstractions, handle edge cases (retries, circuit breakers, tracing)
- Missing features: Would need months to implement distributed tracing, metrics, mTLS that Dapr provides out-of-box
- Team expertise: No team experience building production-grade infrastructure abstraction layers

## References

- Feature Spec: [specs/007-phase5-cloud-deployment/spec.md](../../specs/007-phase5-cloud-deployment/spec.md)
- Implementation Plan: [specs/007-phase5-cloud-deployment/plan.md](../../specs/007-phase5-cloud-deployment/plan.md)
- Technical Research: [specs/007-phase5-cloud-deployment/research.md](../../specs/007-phase5-cloud-deployment/research.md) (Section 1: Dapr Building Blocks)
- Dapr Components: [specs/007-phase5-cloud-deployment/contracts/](../../specs/007-phase5-cloud-deployment/contracts/) (pubsub-kafka.yaml, statestore-postgresql.yaml, secretstore-*.yaml, jobs-scheduler.yaml)
- Related ADRs: ADR-0002 (Event-Driven Architecture with Kafka), ADR-0003 (Reminder Scheduling Strategy)
- Clarifications: PHR-0003 Clarification #2 (user context propagation), Clarification #4 (State Store scope)
- Evaluator Evidence: PHR-0004 (planning phase - Constitution Check passed all 5 principles)
