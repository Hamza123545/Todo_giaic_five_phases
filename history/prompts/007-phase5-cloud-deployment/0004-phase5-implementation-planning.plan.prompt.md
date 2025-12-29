---
id: 0004
title: Phase V Implementation Planning
stage: plan
date: 2025-12-29
surface: agent
model: claude-sonnet-4-5-20250929
feature: 007-phase5-cloud-deployment
branch: 007-phase5-cloud-deployment
user: Muhammad Hamza
command: /sp.plan
labels: [plan, phase-v, dapr, kafka, oke, rrule, monitoring, ci-cd, event-driven, microservices]
links:
  spec: specs/007-phase5-cloud-deployment/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: specs/007-phase5-cloud-deployment/plan.md
    action: created
    lines_added: 1127
    lines_removed: 0
    description: Comprehensive implementation plan with 14 sections covering architecture, deployment, monitoring, CI/CD, and 8 implementation phases
  - path: specs/007-phase5-cloud-deployment/research.md
    action: created
    lines_added: 847
    lines_removed: 0
    description: Phase 0 technical research documenting all technology decisions (Dapr, Kafka, OKE, RRULE, Monitoring, CI/CD) with rationale and alternatives
  - path: specs/007-phase5-cloud-deployment/data-model.md
    action: created
    lines_added: 589
    lines_removed: 0
    description: Database schema changes, migration strategy, field semantics, and data examples for Phase V fields
  - path: specs/007-phase5-cloud-deployment/contracts/event-schemas.yaml
    action: created
    lines_added: 433
    lines_removed: 0
    description: Event schema definitions for task.completed, reminder.scheduled, and task.updated events with contract testing and versioning strategy
  - path: specs/007-phase5-cloud-deployment/contracts/pubsub-kafka.yaml
    action: created
    lines_added: 299
    lines_removed: 0
    description: Dapr Pub/Sub component for Kafka with local and production configurations, topic creation scripts, and monitoring guidance
  - path: specs/007-phase5-cloud-deployment/contracts/statestore-postgresql.yaml
    action: created
    lines_added: 251
    lines_removed: 0
    description: Dapr State Store component for PostgreSQL (conversation history only per Clarification #4) with usage examples and troubleshooting
  - path: specs/007-phase5-cloud-deployment/contracts/secretstore-kubernetes.yaml
    action: created
    lines_added: 172
    lines_removed: 0
    description: Dapr Secrets component for Kubernetes Secrets (local development) with migration path to cloud vaults
  - path: specs/007-phase5-cloud-deployment/contracts/secretstore-oci-vault.yaml
    action: created
    lines_added: 267
    lines_removed: 0
    description: Dapr Secrets component for OCI Vault (production) with workload identity, rotation, audit logging, and cost optimization
  - path: specs/007-phase5-cloud-deployment/contracts/jobs-scheduler.yaml
    action: created
    lines_added: 348
    lines_removed: 0
    description: Dapr Jobs API component for exact-time reminder scheduling with idempotency, retry strategy, and accuracy guidance
tests:
  - file: N/A
    status: N/A
    description: Planning phase does not involve test execution - implementation tests will be created in Phase 2-8
---

## Prompt

Generate a comprehensive architectural plan for Phase V: Advanced Cloud Deployment based on specs/007-phase5-cloud-deployment/spec.md.

**IMPORTANT**:
- Use Context7 MCP server to research all technologies, libraries, and best practices (Dapr, Kafka, OKE, Terraform, Prometheus, Grafana, etc.)
- Generate comprehensive research.md in Phase 0 with all technical decisions, rationale, and alternatives considered
- Research all unknowns and dependencies before creating the plan

**Research Topics** (MANDATORY - use Context7 for ALL):
1. **Dapr Building Blocks**: Research all 5 building blocks (Pub/Sub, State Store, Jobs API, Secrets, Service Invocation). Compare Dapr Jobs API vs Cron Bindings for reminder scheduling. Document when to use State Store vs direct PostgreSQL access (per Clarification #4).

2. **Apache Kafka**: Research Kafka topic partitioning strategies (user_id vs task_id vs round-robin). Compare Kafka deployment options for local (Bitnami Helm vs Strimzi vs Docker Compose) and production (Redpanda Cloud vs Confluent Cloud vs self-hosted). Document retention policies (7 days local, 30 days cloud per Clarification #3).

3. **Oracle Kubernetes Engine (OKE)**: Research OKE always-free tier specifications (2 AMD VMs OR 4 Arm Ampere A1 cores). Compare Terraform modules (oracle-terraform-modules/oke vs custom). Document resource allocation strategy for 24GB RAM total.

4. **RRULE Parsing**: Research RRULE libraries (python-dateutil vs custom parser vs rrule.js). Document UTC-only approach (per Clarification #1 - no timezone-aware calculations, DST ignored). Provide edge case handling (leap years, month-end dates).

5. **Monitoring and Observability**: Research distributed tracing (Zipkin vs Jaeger - compare resource usage, features, complexity). Research metrics collection (Prometheus + Grafana vs alternatives). Research logging (OCI Logging vs ELK Stack vs Loki).

6. **CI/CD Pipeline**: Research GitHub Actions vs GitLab CI vs Jenkins. Document branch-based deployment strategy (main→production, develop→staging per Clarification #5). Design automated rollback on deployment failure.

**Plan Content Requirements** (14 sections):
1. **Summary**: Extract primary requirements + technical approach from research
2. **Technical Context**: Languages, dependencies, storage, testing, target platforms, performance goals, constraints, scale
3. **Constitution Check**: Validate against all 5 principles, document any complexity justifications
4. **Project Structure**: Documentation (plan.md, research.md, data-model.md, contracts/) + Source Code (backend/frontend/dapr/terraform/helm)
5. **Phase 0: Technical Research**: Link to research.md, summarize all decisions
6. **Phase 1: Data Model and Contracts**: Database migration, event schemas, Dapr components
7. **Architecture Overview**: System context diagram, microservices architecture, event flows
8. **Deployment Strategy**: Part B (Minikube script) + Part C (OKE Terraform, CI/CD pipeline)
9. **Monitoring and Observability**: Prometheus/Grafana metrics, Zipkin tracing, OCI Logging
10. **Security**: Inter-service authentication (mTLS per Clarification #2), secrets management (OCI Vault), network policies
11. **Implementation Phases**: 8 phases (Database Migration, Event Schemas, RRULE Parsing, Recurring Task Service, Notification Service, Task Service Updates, Local Deployment, Cloud Deployment) with timeline
12. **Risk Mitigation**: Top 5 risks with impact and mitigation strategies
13. **Testing Strategy**: Unit tests (80% coverage), integration tests, contract tests, end-to-end tests, load tests
14. **Rollback Strategy**: Database rollback, application rollback (Helm), Kafka topic rollback, Dapr component rollback
15. **Success Criteria Validation**: Map all 24 success criteria from spec.md to implementation phases
16. **Appendices**: Glossary, references, related documents

**Critical Requirements**:
- ALL 10 clarifications from spec (PHR-0002, PHR-0003) MUST be reflected in plan
- ALL 24 success criteria from spec MUST be mapped to implementation phases
- ALL technical decisions MUST be documented in research.md with rationale
- Plan MUST be ready for `/sp.tasks` phase (no ambiguities, clear implementation path)

## Response snapshot

Successfully generated comprehensive Phase V implementation plan with complete technical research across all required technologies and detailed design artifacts.

**Phase 0: Technical Research** (research.md - 847 lines):
- **Dapr Building Blocks**: Selected all 5 blocks (Pub/Sub for Kafka, State Store for conversation history ONLY, Jobs API for exact-time reminders, Secrets for OCI Vault, Service Invocation for mTLS). Documented rationale: Jobs API chosen over Cron Bindings for ±30s reminder accuracy, State Store scope limited per Clarification #4 (no task caching).
- **Kafka Configuration**: Selected Bitnami Kafka Helm chart for Minikube (production-ready, single command deploy), Redpanda Cloud Serverless for production (free tier: 10GB storage, 10MB/s throughput). Partitioning: user_id-based with 12 partitions for per-user ordering and horizontal scaling. Retention: 7 days local, 30 days cloud (per Clarification #3).
- **Cloud Platform**: Selected OKE always-free tier as primary (2 AMD VMs OR 4 Arm Ampere A1 cores, 24GB RAM total). Recommended Arm configuration for Phase V resource needs. Terraform with oracle-terraform-modules/oke for IaC.
- **RRULE Parsing**: Selected python-dateutil (mature, RFC 5545 compliant, 50M+ downloads/month). UTC-only calculations per Clarification #1 (no timezone-aware logic, DST ignored). Handles edge cases: leap years, month-end dates, complex patterns.
- **Monitoring**: Selected Zipkin over Jaeger (simpler deployment, lower resource usage: 500MB vs 1GB RAM). Prometheus + Grafana for metrics. OCI Logging for centralized logs.
- **CI/CD**: Selected GitHub Actions with branch-based deployment (main→production, develop→staging per Clarification #5). Automated rollback on failure.

**Phase 1: Data Model and Contracts**:
- **Database Migration** (data-model.md - 589 lines): ALTER TABLE tasks ADD 5 nullable columns (recurring_pattern, recurring_end_date, next_occurrence, reminder_at, reminder_sent). Indexes on next_occurrence and reminder_at for performance. Rollback script provided.
- **Event Schemas** (contracts/event-schemas.yaml - 433 lines): Defined 3 event types (task.completed, reminder.scheduled, task.updated) with version 1.0. All events include user_id for isolation (per Clarification #2). Contract testing strategy with JSON Schema validation. Schema evolution strategy (backward compatibility, versioning).
- **Dapr Components** (5 YAML files totaling 1337 lines):
  - pubsub-kafka.yaml: Kafka Pub/Sub with local (Minikube) and production (Redpanda Cloud) configs, topic creation scripts
  - statestore-postgresql.yaml: PostgreSQL State Store for conversation history ONLY (per Clarification #4)
  - secretstore-kubernetes.yaml: Kubernetes Secrets for local dev
  - secretstore-oci-vault.yaml: OCI Vault for production with workload identity, rotation, audit logging
  - jobs-scheduler.yaml: Dapr Jobs API for exact-time reminder scheduling (±30s accuracy)

**Implementation Plan** (plan.md - 1127 lines):
- **Architecture Overview**: System context diagram, 5 microservices (Chat API, Task Service, Recurring Task Service, Notification Service, Audit Service), event flows for task completion and reminder scheduling
- **Deployment Strategy**:
  - **Part B (Minikube)**: Complete bash script for local deployment (Dapr init, Kafka deployment, topic creation, Helm install, monitoring stack)
  - **Part C (OKE)**: Terraform configuration for OKE always-free tier (2 Arm nodes, 2 cores/12GB each), CI/CD pipeline with GitHub Actions, monitoring with Prometheus/Grafana/Zipkin
- **Implementation Phases**: 8 phases with estimated timeline (22 days total):
  1. Database Migration (1 day)
  2. Event Schemas and Dapr Components (2 days)
  3. RRULE Parsing and Next Occurrence Calculation (3 days)
  4. Recurring Task Service (3 days)
  5. Notification Service (3 days)
  6. Task Service Updates (2 days)
  7. Local Deployment (Minikube) (3 days)
  8. Cloud Deployment (OKE) (5 days)
- **Risk Mitigation**: 5 risks documented (Kafka consumer lag, RRULE calculation errors, Dapr component failures, OKE free tier resource limits, event schema evolution) with impact and mitigation strategies
- **Success Criteria Validation**: All 24 success criteria mapped to implementation phases (no gaps)

**Constitution Check**: All 5 principles validated:
1. ✅ Simplicity: Event-driven architecture justified for decoupling recurring task generation
2. ✅ Testability: All event schemas versioned and documented for contract testing
3. ✅ User Isolation: All Kafka events include user_id, consumers enforce isolation via user_id
4. ✅ Performance: Database indexes on next_occurrence and reminder_at, Kafka partitioning for horizontal scaling
5. ✅ Security: Secrets in OCI Vault, mTLS for service-to-service authentication

**Project Structure**:
- **Documentation**: plan.md, research.md, data-model.md, contracts/ directory (6 YAML files)
- **Source Code**: backend/src/{models.py, services/, events/, integrations/}, frontend/src/components/, dapr/components/, terraform/oke/, helm/todo-app/, .github/workflows/, monitoring/

## Outcome

- ✅ Impact: Comprehensive Phase V implementation plan created covering all three parts (Advanced Features, Local Deployment, Cloud Deployment) with complete technical research (6 topics), detailed design artifacts (data model, event schemas, Dapr components), and 8 implementation phases. All 10 clarifications from spec reflected in plan, all 24 success criteria mapped to implementation. Plan is ready for `/sp.tasks` phase with no ambiguities.
- 🧪 Tests: No automated tests - planning phase focuses on design and architecture. Implementation tests will be created in Phases 2-8 (unit tests, integration tests, contract tests, end-to-end tests, load tests with 80% coverage target).
- 📁 Files: 10 files created totaling 4333 lines (plan.md: 1127 lines, research.md: 847 lines, data-model.md: 589 lines, 6 contract YAML files: 1770 lines combined)
- 🔁 Next prompts:
  - Run `/sp.tasks` to generate actionable task breakdown from this plan (break down 8 implementation phases into specific tasks with test cases)
  - Run `/sp.implement` after tasks generated to execute tasks via Claude Code
  - Consider creating ADRs for significant architectural decisions (Dapr Jobs API vs Cron Bindings, Zipkin vs Jaeger, OKE always-free tier resource allocation)
- 🧠 Reflection: This planning phase successfully transformed the clarified specification (10 clarifications, 53+ functional requirements, 24 success criteria) into a concrete implementation roadmap. The research-first approach ensured all technology decisions were made with full understanding of alternatives and tradeoffs. The Dapr abstraction layer provides flexibility (can swap Kafka→RabbitMQ, PostgreSQL→Redis, OKE→AKS without code changes). The UTC-only time handling (Clarification #1) simplifies implementation significantly. The State Store scope limitation (Clarification #4) maintains architectural simplicity by avoiding cache consistency issues. The event-driven architecture with Kafka enables horizontal scaling and decouples recurring task generation from the main application. The OKE always-free tier (4 Arm cores, 24GB RAM) provides sufficient resources for all services with careful resource allocation. The 8-phase implementation plan provides clear milestones and allows for incremental testing and validation.

## Evaluation notes (flywheel)

- Failure modes observed: None - planning phase completed successfully with comprehensive research and design artifacts
- Graders run and results (PASS/FAIL): Constitution Check PASSED (all 5 principles validated), Success Criteria Validation PASSED (all 24 criteria mapped to implementation phases)
- Prompt variant (if applicable): Standard /sp.plan workflow with extensive research phase (6 research topics using Context7 MCP server) before planning
- Next experiment (smallest change to try): Proceed to /sp.tasks phase to generate actionable task breakdown. Consider using specialized agents (Plan agent for architecture refinement, Explore agent for codebase analysis) if needed. After tasks generated, run /sp.implement to execute implementation via Claude Code. Monitor actual implementation timeline vs estimated 22 days to calibrate future estimates.
