# Feature Specification: Kubernetes Deployment with Minikube and Helm

**Feature Branch**: `006-minikube-helm-deployment`
**Created**: 2025-12-18
**Status**: Draft
**Input**: User description: "Deploy Phase 3 Todo Chatbot application (Next.js frontend + FastAPI backend with AI agents) to a local Minikube Kubernetes cluster using Helm 3.x charts. The deployment must include health checks (liveness and readiness probes), proper configuration management using ConfigMaps and Secrets, service configuration (NodePort for frontend, ClusterIP for backend), one-command deployment automation, and integration with AI DevOps tools (kubectl-ai, kagent, Docker AI/Gordon). The application must connect to external Neon PostgreSQL database and Cloudflare R2 storage (not in-cluster). Images must be built in Minikube's Docker daemon context. All Phase 3 functionality must remain intact with no breaking changes."

## User Scenarios & Testing

### User Story 1 - Local Kubernetes Deployment (Priority: P1)

As a developer, I need to deploy the entire Todo Chatbot application to a local Minikube cluster so that I can test Kubernetes configurations and deployment workflows before production.

**Why this priority**: This is the foundation for all other deployment features. Without basic deployment capability, no other Kubernetes features (health checks, scaling, monitoring) can be tested. This delivers immediate value by allowing developers to validate that the application works in a containerized orchestration environment.

**Independent Test**: Can be fully tested by running a single deployment command and verifying that both frontend and backend pods are running and accessible via their respective services. Delivers the core value of having the application operational in Kubernetes.

**Acceptance Scenarios**:

1. **Given** Minikube is running and Helm is installed, **When** developer runs the deployment script, **Then** both frontend and backend pods reach Ready state within 2 minutes
2. **Given** application is deployed, **When** developer accesses the frontend via NodePort, **Then** the application loads within 5 seconds and displays the login page
3. **Given** application is deployed, **When** developer tests end-to-end functionality (login, create todo, chat), **Then** all features work without errors and data persists to external Neon database
4. **Given** images are updated, **When** developer rebuilds images in Minikube context and redeploys, **Then** new images are used without pushing to external registry

---

### User Story 2 - Health Monitoring and Auto-Recovery (Priority: P2)

As a platform operator, I need the application to automatically detect and recover from failures so that the system remains available without manual intervention.

**Why this priority**: While deployment is the foundation (P1), health monitoring and auto-recovery are critical for production-readiness and reliability testing. This feature validates that the Kubernetes self-healing mechanisms work correctly with the application.

**Independent Test**: Can be tested independently by deliberately killing pods or simulating failure conditions (e.g., making health endpoints return errors) and observing that Kubernetes automatically restarts failed containers within the defined timeout period.

**Acceptance Scenarios**:

1. **Given** application is deployed with health probes configured, **When** a pod's health check fails, **Then** Kubernetes restarts the pod within 30 seconds
2. **Given** frontend pod is running, **When** the application becomes unresponsive (liveness probe fails), **Then** Kubernetes terminates and restarts the container automatically
3. **Given** backend pod is starting, **When** the application is not yet ready (readiness probe fails), **Then** Kubernetes does not route traffic to the pod until readiness check passes
4. **Given** health probes are configured, **When** viewing pod status, **Then** all pods show liveness and readiness probe configurations with appropriate thresholds

---

### User Story 3 - Secure Configuration Management (Priority: P3)

As a security-conscious developer, I need sensitive credentials managed securely and configuration separated from code so that secrets are never exposed in logs, source control, or pod specifications.

**Why this priority**: Security is important, but the application can function with hardcoded credentials in development environments (P1, P2). This priority allows initial testing while ensuring production-readiness through proper secret management.

**Independent Test**: Can be tested by inspecting deployed pods and logs to verify that database credentials, API keys, and other secrets are injected via Kubernetes Secrets (not visible in plaintext) and non-sensitive configuration is managed via ConfigMaps.

**Acceptance Scenarios**:

1. **Given** application uses database credentials, **When** credentials are stored as Kubernetes Secrets, **Then** pod specifications and logs do not expose plaintext credentials
2. **Given** application has environment-specific configuration, **When** non-sensitive config is stored in ConfigMaps, **Then** configuration can be updated without rebuilding images
3. **Given** Secrets are created for sensitive data, **When** viewing pod environment variables, **Then** secret values are injected from Kubernetes Secrets, not hardcoded
4. **Given** ConfigMaps and Secrets are deployed, **When** pods are created, **Then** environment variables from both sources are correctly injected into containers

---

### User Story 4 - AI-Assisted DevOps Workflow (Priority: P4)

As a developer new to Kubernetes, I need AI-powered tools to help me understand and troubleshoot the deployment so that I can diagnose issues faster and learn Kubernetes concepts in context.

**Why this priority**: AI DevOps tools enhance developer productivity but are not required for core deployment functionality. The application must deploy and work correctly (P1-P3) before optimizing the developer experience with AI assistance.

**Independent Test**: Can be tested by running documented AI DevOps tool commands (kubectl-ai, kagent, Docker AI) and verifying they provide helpful output for common Kubernetes operations and troubleshooting scenarios.

**Acceptance Scenarios**:

1. **Given** kubectl-ai is installed, **When** developer asks natural language questions about pod status, **Then** kubectl-ai provides accurate kubectl commands and explanations
2. **Given** kagent is configured, **When** developer needs to troubleshoot failing pods, **Then** kagent suggests relevant debugging steps and commands
3. **Given** Docker AI integration is documented, **When** developer builds images in Minikube, **Then** Docker AI provides context-aware guidance for image optimization
4. **Given** AI tools documentation exists, **When** developer follows examples, **Then** all documented AI tool commands execute successfully and provide useful output

---

### User Story 5 - One-Command Deployment Automation (Priority: P5)

As a developer, I need a single command to deploy the entire application so that I can quickly set up or reset my development environment without manual steps.

**Why this priority**: While valuable for developer experience, automation is built on top of working deployment mechanisms (P1-P4). Manual deployment steps can be followed initially, and automation provides convenience once the core deployment is proven stable.

**Independent Test**: Can be tested by running the deployment script on a fresh Minikube cluster and verifying that all resources (Helm charts, images, services, pods) are created and configured correctly without any manual intervention.

**Acceptance Scenarios**:

1. **Given** Minikube is running and Helm is installed, **When** developer runs the deployment script, **Then** script completes successfully in under 10 minutes
2. **Given** deployment script exists, **When** running on a fresh cluster, **Then** script handles all setup (namespace creation, image building, Helm installation) automatically
3. **Given** previous deployment exists, **When** rerunning deployment script, **Then** script cleanly updates existing resources without errors
4. **Given** deployment fails midway, **When** rerunning script, **Then** script recovers gracefully and completes the deployment

---

### Edge Cases

- What happens when Minikube is not running or Docker daemon is not accessible?
  - Deployment script should detect missing prerequisites and provide clear error messages with remediation steps
- How does the system handle database connection failures to external Neon PostgreSQL?
  - Health probes should detect connection failures and Kubernetes should restart pods automatically
  - Application should implement connection retry logic with exponential backoff
- What happens when Helm chart installation fails partway through?
  - Script should provide rollback capability to clean up partial deployments
  - Failed resources should be clearly identified in error output
- How does the system handle resource exhaustion (CPU, memory limits)?
  - Pods should have resource requests and limits defined
  - Kubernetes should evict or throttle pods that exceed limits, not crash the node
- What happens when ConfigMap or Secret values are invalid?
  - Application should fail fast during startup with clear error messages
  - Health probes should prevent traffic routing to misconfigured pods
- How does the system handle port conflicts (NodePort already in use)?
  - Deployment should fail with clear error indicating port conflict
  - Documentation should specify default ports and how to customize them

## Requirements

### Functional Requirements

- **FR-001**: System MUST deploy to Minikube 1.32+ Kubernetes cluster using Helm 3.x charts
- **FR-002**: System MUST build Docker images within Minikube's Docker daemon context, not external registries
- **FR-003**: System MUST configure frontend service as NodePort on port 30300 for external access
- **FR-004**: System MUST configure backend service as ClusterIP on port 8000 for internal cluster communication
- **FR-005**: System MUST implement liveness probes for both frontend and backend pods to detect unresponsive containers
- **FR-006**: System MUST implement readiness probes for both frontend and backend pods to control traffic routing
- **FR-007**: System MUST store non-sensitive configuration (frontend URL, backend URL, log levels) in Kubernetes ConfigMaps
- **FR-008**: System MUST store sensitive credentials (database connection string, API keys, JWT secrets) in Kubernetes Secrets
- **FR-009**: System MUST inject environment variables into pods from both ConfigMaps and Secrets
- **FR-010**: System MUST maintain all existing Phase 3 functionality (task CRUD, authentication, AI chatbot) without breaking changes
- **FR-011**: System MUST connect to external Neon PostgreSQL database (not in-cluster)
- **FR-012**: System MUST connect to external Cloudflare R2 storage (not in-cluster)
- **FR-013**: System MUST support horizontal scaling by allowing multiple pod replicas
- **FR-014**: System MUST maintain stateless pod design (no persistent volumes required)
- **FR-015**: System MUST provide one-command deployment script that automates entire deployment process
- **FR-016**: System MUST document integration with AI DevOps tools (kubectl-ai, kagent, Docker AI)
- **FR-017**: System MUST provide Helm chart values file for configuration customization
- **FR-018**: System MUST include health check endpoints in both frontend and backend applications
- **FR-019**: System MUST configure liveness probe initial delay to allow application startup time
- **FR-020**: System MUST configure readiness probe to verify database connectivity before accepting traffic

### Key Entities

- **Minikube Cluster**: Local Kubernetes cluster running on developer machine. Provides container orchestration, networking, and resource management. Single-node cluster sufficient for development and testing.

- **Helm Chart**: Package definition containing Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets) and values templates. Includes separate charts for frontend and backend with configurable parameters.

- **Frontend Pod**: Container running Next.js application. Exposes port 3000 internally, accessible via NodePort 30300 externally. Includes liveness probe (HTTP GET to /api/health) and readiness probe (HTTP GET to /api/ready).

- **Backend Pod**: Container running FastAPI application with AI agents. Exposes port 8000 internally, accessible via ClusterIP service within cluster. Includes liveness probe (HTTP GET to /health) and readiness probe (HTTP GET to /ready, verifying database connection).

- **ConfigMap**: Kubernetes resource storing non-sensitive configuration key-value pairs. Contains frontend URL, backend URL, log levels, feature flags. Mounted as environment variables into pods.

- **Secret**: Kubernetes resource storing sensitive credentials in base64 encoding. Contains DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, LLM provider credentials. Injected as environment variables into pods.

- **NodePort Service**: Kubernetes service type that exposes frontend on a static port (30300) on each cluster node, allowing external access from host machine browser.

- **ClusterIP Service**: Kubernetes service type that exposes backend only within cluster network, allowing frontend pods to communicate with backend via DNS name.

- **Health Probe Endpoint**: HTTP endpoint implemented in application code that returns 200 OK when application is healthy, 500+ when unhealthy. Separate endpoints for liveness (basic process health) and readiness (dependencies ready).

- **Deployment Script**: Automated shell script that orchestrates complete deployment workflow: validates prerequisites, builds images in Minikube context, installs Helm charts, waits for pod readiness, verifies deployment success.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both frontend and backend pods reach Ready state within 2 minutes of deployment command execution
- **SC-002**: Frontend application is accessible via NodePort and loads within 5 seconds of accessing http://localhost:30300
- **SC-003**: End-to-end functionality (user login, task creation, AI chat) works without errors and data persists correctly to external database
- **SC-004**: Health probes successfully detect simulated failures and trigger pod restarts within 30 seconds
- **SC-005**: No secrets or API keys are visible in plaintext when inspecting pod specifications or container logs
- **SC-006**: One-command deployment script completes successfully in under 10 minutes on a fresh Minikube cluster
- **SC-007**: AI DevOps tools (kubectl-ai, kagent, Docker AI) documentation includes working examples that execute successfully
- **SC-008**: Application supports horizontal scaling by successfully running multiple frontend and backend pod replicas
- **SC-009**: Developer can customize deployment configuration (replica count, resource limits, ports) via Helm values file without modifying chart templates
- **SC-010**: All existing Phase 3 automated tests pass after Kubernetes deployment, confirming no functionality regression
