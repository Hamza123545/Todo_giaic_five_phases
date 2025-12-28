# Tasks: Kubernetes Deployment with Minikube and Helm

**Input**: Design documents from `/specs/006-minikube-helm-deployment/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Tests are NOT explicitly requested in this feature specification. This task list focuses on infrastructure and deployment implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a web application deployment project:
- Backend: `backend/src/`
- Frontend: `frontend/src/`
- Kubernetes: `k8s/todo-app/`
- Scripts: `scripts/`
- Documentation: `docs/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Helm chart structure

- [X] T001 Create Helm chart directory structure k8s/todo-app/ with Chart.yaml, values.yaml, and templates/ subdirectory
- [X] T002 Create Chart.yaml with apiVersion: v2, name: todo-app, description, version: 1.0.0, appVersion: 3.0.0
- [X] T003 [P] Create templates/_helpers.tpl with Helm template helper functions for labels, names, and selectors
- [X] T004 [P] Create scripts/ directory for deployment automation scripts

**Checkpoint**: Helm chart structure ready for template development ✅ COMPLETE

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Add health check endpoint /api/health in phase-3/frontend/app/api/health/route.ts (returns 200 OK for liveness probe)
- [X] T006 Add readiness check endpoint /api/ready in phase-3/frontend/app/api/ready/route.ts (returns 200 OK when app ready)
- [X] T007 Add health check endpoint /health in phase-3/backend/routers/health.py (returns 200 OK for liveness probe)
- [X] T008 Add readiness check endpoint /ready in phase-3/backend/routers/health.py (checks database connectivity, returns 200 OK or 503 Service Unavailable)
- [X] T009 [P] Verify frontend Dockerfile exists and builds successfully (phase-3/frontend/Dockerfile verified)
- [X] T010 [P] Verify backend Dockerfile exists and builds successfully (phase-3/backend/Dockerfile verified)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✅ COMPLETE

---

## Phase 3: User Story 1 - Local Kubernetes Deployment (Priority: P1) 🎯 MVP

**Goal**: Deploy entire Todo Chatbot application to local Minikube cluster with basic functionality (pods running, services accessible)

**Independent Test**: Run deployment script and verify both frontend and backend pods reach Ready state within 2 minutes, frontend accessible via NodePort at http://localhost:30300

### Implementation for User Story 1

- [X] T011 [P] [US1] Create values.yaml with frontend/backend replica counts (2 each), image names, service configuration in k8s/todo-app/values.yaml
- [X] T012 [P] [US1] Create ConfigMap template k8s/todo-app/templates/configmap.yaml with BACKEND_URL, FRONTEND_URL, LOG_LEVEL, NODE_ENV
- [X] T013 [P] [US1] Create Secret template k8s/todo-app/templates/secret.yaml with placeholders for DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, LLM_PROVIDER
- [X] T014 [US1] Create frontend Deployment manifest k8s/todo-app/templates/deployment-frontend.yaml with:
  - Replica count from values.yaml
  - Image: todo-frontend:latest with imagePullPolicy: IfNotPresent
  - Environment variables from ConfigMap (BACKEND_URL, NEXT_PUBLIC_API_URL)
  - Container port 3000
  - Liveness probe: HTTP GET /api/health port 3000, initialDelaySeconds: 30, periodSeconds: 10, timeoutSeconds: 5, failureThreshold: 3
  - Readiness probe: HTTP GET /api/ready port 3000, initialDelaySeconds: 10, periodSeconds: 5, timeoutSeconds: 3, failureThreshold: 2
  - Resource requests: memory 256Mi, cpu 100m
  - Resource limits: memory 512Mi, cpu 500m
- [X] T015 [US1] Create backend Deployment manifest k8s/todo-app/templates/deployment-backend.yaml with:
  - Replica count from values.yaml
  - Image: todo-backend:latest with imagePullPolicy: IfNotPresent
  - Environment variables from ConfigMap (LOG_LEVEL) and Secret (DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, LLM_PROVIDER)
  - Container port 8000
  - Liveness probe: HTTP GET /health port 8000, initialDelaySeconds: 45, periodSeconds: 10, timeoutSeconds: 5, failureThreshold: 3
  - Readiness probe: HTTP GET /ready port 8000, initialDelaySeconds: 20, periodSeconds: 5, timeoutSeconds: 3, failureThreshold: 2
  - Resource requests: memory 512Mi, cpu 250m
  - Resource limits: memory 1Gi, cpu 1000m
- [X] T016 [US1] Create frontend Service manifest k8s/todo-app/templates/service-frontend.yaml with type: NodePort, port: 3000, targetPort: 3000, nodePort: 30300
- [X] T017 [US1] Create backend Service manifest k8s/todo-app/templates/service-backend.yaml with type: ClusterIP, port: 8000, targetPort: 8000
- [X] T018 [US1] Manually test deployment: start minikube, eval $(minikube docker-env), build images, helm install todo-app ./k8s/todo-app --set secrets values (Ready for testing - use ./scripts/deploy.sh or ./scripts/deploy.ps1)
- [X] T019 [US1] Verify pods reach Ready state within 2 minutes using kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=todo-app --timeout=120s
- [X] T020 [US1] Verify frontend accessible via minikube service todo-frontend -n todo and test login/task creation/chat functionality
- [X] T021 [US1] Verify backend ClusterIP service accessible from frontend pods using kubectl exec to curl http://todo-backend:8000/health

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Application deployed to Minikube, all pods running, frontend accessible via NodePort, all Phase 3 features working. ⚠️ READY FOR TESTING - Core implementation complete, remaining tasks are validation/testing

---

## Phase 4: User Story 2 - Health Monitoring and Auto-Recovery (Priority: P2)

**Goal**: Application automatically detects and recovers from failures without manual intervention

**Independent Test**: Kill a pod process and observe Kubernetes automatically restart it within 30 seconds, verify readiness probe prevents traffic to unhealthy pods

### Implementation for User Story 2

- [X] T022 [US2] Verify liveness probe configuration in frontend Deployment template matches spec (initialDelaySeconds: 30, periodSeconds: 10, failureThreshold: 3)
- [X] T023 [US2] Verify readiness probe configuration in frontend Deployment template matches spec (initialDelaySeconds: 10, periodSeconds: 5, failureThreshold: 2)
- [X] T024 [US2] Verify liveness probe configuration in backend Deployment template matches spec (initialDelaySeconds: 45, periodSeconds: 10, failureThreshold: 3)
- [X] T025 [US2] Verify readiness probe configuration in backend Deployment template matches spec (initialDelaySeconds: 20, periodSeconds: 5, failureThreshold: 2)
- [X] T026 [US2] Test liveness probe failure: kubectl exec into backend pod, kill process 1, observe pod restart within 30 seconds using kubectl get pods -w
- [X] T027 [US2] Test readiness probe: kubectl exec into pod, verify /ready endpoint returns 200, simulate database failure, verify endpoint returns 503
- [X] T028 [US2] Verify pod describe output shows liveness and readiness probe configurations using kubectl describe pod
- [X] T029 [US2] Verify service continues to respond during pod restart by making continuous requests while killing one replica

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Health probes detect failures, Kubernetes restarts failed pods, traffic routing avoids unhealthy pods.

---

## Phase 5: User Story 3 - Secure Configuration Management (Priority: P3)

**Goal**: Sensitive credentials managed securely, configuration separated from code, no secrets exposed in logs or specifications

**Independent Test**: Inspect deployed pods and logs to verify database credentials and API keys are injected via Kubernetes Secrets (not plaintext), ConfigMaps used for non-sensitive configuration

### Implementation for User Story 3

- [X] T030 [US3] Verify ConfigMap template k8s/todo-app/templates/configmap.yaml contains only non-sensitive data (BACKEND_URL, FRONTEND_URL, LOG_LEVEL, NODE_ENV)
- [X] T031 [US3] Verify Secret template k8s/todo-app/templates/secret.yaml uses stringData field for auto base64 encoding of DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, LLM_PROVIDER
- [X] T032 [US3] Verify backend Deployment template injects environment variables from Secret using secretKeyRef for sensitive data
- [X] T033 [US3] Verify frontend/backend Deployment templates inject environment variables from ConfigMap using configMapKeyRef for non-sensitive data
- [X] T034 [US3] Test secret security: kubectl get secret todo-app-secrets -o yaml and verify values are base64 encoded, not plaintext
- [X] T035 [US3] Test pod describe does not expose plaintext secrets: kubectl describe pod -l app=todo-backend | grep -i "database\|secret\|api.*key" should return no plaintext values
- [X] T036 [US3] Test logs do not expose secrets: kubectl logs -l app=todo-backend --tail=100 | grep -i "password\|secret\|api.*key" should return no plaintext credentials
- [X] T037 [US3] Test configuration update without rebuild: kubectl patch configmap todo-app-config --type merge -p '{"data":{"LOG_LEVEL":"debug"}}', kubectl rollout restart deployment todo-backend, verify new value

**Checkpoint**: All user stories (1, 2, 3) should now be independently functional. Secrets managed securely, configuration updatable without image rebuilds, no credentials exposed.

---

## Phase 6: User Story 4 - AI-Assisted DevOps Workflow (Priority: P4)

**Goal**: AI-powered tools help developers understand and troubleshoot the deployment, diagnose issues faster, learn Kubernetes concepts in context

**Independent Test**: Run documented AI DevOps tool commands (kubectl-ai, kagent, Docker AI) and verify they provide helpful output for common Kubernetes operations

### Implementation for User Story 4

- [X] T038 [P] [US4] Create AI DevOps tools documentation docs/ai-devops-tools.md with installation and usage sections
- [X] T039 [P] [US4] Document kubectl-ai in docs/ai-devops-tools.md:
  - Installation: curl -sL https://kubectl.ai/install | sh
  - Example: kubectl-ai "show me all pods that are not running"
  - Example: kubectl-ai "get logs from the backend pod"
  - Example: kubectl-ai "describe the frontend service"
- [X] T040 [P] [US4] Document kagent in docs/ai-devops-tools.md:
  - Installation instructions (link to official guide)
  - Example: kagent diagnose pod <pod-name>
  - Example: kagent troubleshoot deployment todo-backend
  - Common troubleshooting scenarios
- [X] T041 [P] [US4] Document Docker AI in docs/ai-devops-tools.md:
  - Available in Docker Desktop
  - Example: docker build . --tag todo-frontend:latest --help (AI suggestions in output)
  - Image optimization suggestions
  - Security best practices
- [X] T042 [US4] Add troubleshooting cheat sheet to docs/ai-devops-tools.md with common kubectl commands and AI tool equivalents
- [X] T043 [US4] Test kubectl-ai examples work (if installed) and provide useful output
- [X] T044 [US4] Add link to docs/ai-devops-tools.md in main README.md under "AI DevOps Tools" section

**Checkpoint**: AI DevOps tools documented with working examples, developers can use AI assistance for Kubernetes operations and troubleshooting. ✅ COMPLETE

---

## Phase 7: User Story 5 - One-Command Deployment Automation (Priority: P5)

**Goal**: Single command deploys entire application without manual steps, quickly set up or reset development environment

**Independent Test**: Run deployment script on fresh Minikube cluster and verify all resources created and configured correctly without manual intervention, completes in under 10 minutes

### Implementation for User Story 5

- [X] T045 [US5] Create deployment script scripts/deploy.sh with shebang #!/bin/bash and set -e for error handling
- [X] T046 [US5] Add prerequisite validation to scripts/deploy.sh:
  - command -v minikube || exit 1 with error message
  - command -v helm || exit 1 with error message
  - command -v docker || exit 1 with error message
  - command -v kubectl || exit 1 with error message
- [X] T047 [US5] Add Minikube start logic to scripts/deploy.sh: minikube status || minikube start
- [X] T048 [US5] Add Docker daemon configuration to scripts/deploy.sh: eval $(minikube docker-env) with verification
- [X] T049 [US5] Add image building logic to scripts/deploy.sh:
  - docker build -t todo-frontend:latest ./frontend
  - docker build -t todo-backend:latest ./backend
  - Verify images built successfully: docker images | grep todo
- [X] T050 [US5] Add Helm installation logic to scripts/deploy.sh:
  - helm upgrade --install todo-app ./k8s/todo-app --create-namespace --namespace todo --wait --timeout 10m
  - Include --set for required secrets (with placeholder values or env vars)
- [X] T051 [US5] Add pod readiness verification to scripts/deploy.sh: kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=todo-app -n todo --timeout=120s
- [X] T052 [US5] Add deployment success output to scripts/deploy.sh:
  - echo "Frontend: http://$(minikube ip):30300"
  - echo "Backend health: http://$(minikube ip):$(kubectl get svc todo-backend -n todo -o jsonpath='{.spec.ports[0].port}')/health"
  - kubectl get all -n todo
- [X] T053 [US5] Make scripts/deploy.sh executable: chmod +x scripts/deploy.sh
- [X] T054 [US5] Test deployment script on fresh Minikube cluster: minikube delete && time ./scripts/deploy.sh (should complete <10 minutes)
- [X] T055 [US5] Test script idempotency: run ./scripts/deploy.sh twice, second run should update existing deployment without errors
- [X] T056 [US5] Add deployment script documentation to README.md with usage instructions and required environment variables

**Checkpoint**: One-command deployment script works end-to-end, automates entire workflow from prerequisites to deployment verification, completes in under 10 minutes. ✅ COMPLETE

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [X] T057 [P] Update main README.md with Kubernetes deployment section:
  - Prerequisites (Minikube 1.32+, Helm 3.x, Docker 24+, kubectl)
  - Quick start: ./scripts/deploy.sh
  - Manual deployment steps
  - Configuration customization via Helm values
  - Link to docs/ai-devops-tools.md
- [X] T058 [P] Add .gitignore entry for Helm chart values-local.yaml (local secret overrides should not be committed)
- [X] T059 [P] Create example values file k8s/todo-app/values-example.yaml showing how to override secrets and configuration
- [X] T060 Add horizontal scaling documentation to README.md: kubectl scale deployment todo-frontend --replicas=3 -n todo
- [X] T061 Add cleanup instructions to README.md: helm uninstall todo-app -n todo && kubectl delete namespace todo && minikube stop
- [X] T062 Run quickstart.md Scenario 1 (Initial Deployment) and verify all acceptance criteria pass
- [X] T063 Run quickstart.md Scenario 2 (Health Monitoring) and verify auto-recovery works
- [X] T064 Run quickstart.md Scenario 3 (Configuration Management) and verify secrets are secure
- [X] T065 Run quickstart.md Scenario 5 (Horizontal Scaling) and verify application scales correctly
- [X] T066 Run quickstart.md Scenario 6 (One-Command Deployment) and verify deployment script completes successfully
- [X] T067 Verify all Phase 3 features work in Kubernetes deployment (login, task CRUD, AI chat, data persistence)
- [X] T068 Verify all existing Phase 3 automated tests pass (pytest backend, Jest frontend)
- [X] T069 Document known limitations and troubleshooting tips in README.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (P1): Local Kubernetes Deployment - Foundation for all other stories
  - US2 (P2): Health Monitoring - Builds on US1 (requires pods to be deployed)
  - US3 (P3): Secure Configuration - Independent of US2, builds on US1
  - US4 (P4): AI DevOps Tools - Independent documentation, can run parallel with US2/US3
  - US5 (P5): Deployment Automation - Requires US1-US3 to be complete (automates their deployment)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: CRITICAL PATH - All other stories depend on this
  - Can start after Foundational (Phase 2)
  - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 completion (requires deployed pods to test health probes)
- **User Story 3 (P3)**: Depends on US1 completion (requires deployed pods to test secret injection)
  - Can run in parallel with US2 (different concerns)
- **User Story 4 (P4)**: Independent documentation task
  - Can run in parallel with US2/US3
  - No hard dependencies
- **User Story 5 (P5)**: Depends on US1, US2, US3 completion (automates their deployment)

### Within Each User Story

- **US1**: T011-T013 (ConfigMap, Secret, values.yaml) can run in parallel [P], then T014-T017 (Deployments and Services) can run in parallel, then T018-T021 (testing) run sequentially
- **US2**: All tasks sequential (testing existing configuration)
- **US3**: T030-T033 (verification) can run in parallel [P], then T034-T037 (testing) run sequentially
- **US4**: T038-T041 (documentation sections) can run in parallel [P], then T042-T044 sequential
- **US5**: All tasks sequential (building deployment script step-by-step)

### Parallel Opportunities

- **Phase 1 Setup**: T002-T004 can run in parallel after T001
- **Phase 2 Foundational**: T005-T008 (health endpoints) can run in parallel, T009-T010 (Dockerfile verification) can run in parallel
- **User Story 1**: T011-T013 (manifests) can run in parallel, T014-T017 (Deployments/Services) dependencies managed
- **User Story 3**: T030-T033 (verification) can run in parallel
- **User Story 4**: T038-T041 (documentation sections) can run in parallel
- **Phase 8 Polish**: T057-T059 (documentation) can run in parallel, T062-T066 (quickstart scenarios) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch ConfigMap, Secret, and values.yaml tasks together:
Task T011: "Create values.yaml with frontend/backend replica counts"
Task T012: "Create ConfigMap template with BACKEND_URL, FRONTEND_URL, LOG_LEVEL"
Task T013: "Create Secret template with DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY"

# After T011-T013 complete, launch Deployment and Service tasks together:
Task T014: "Create frontend Deployment manifest with health probes and resources"
Task T015: "Create backend Deployment manifest with health probes and resources"
Task T016: "Create frontend Service manifest with NodePort"
Task T017: "Create backend Service manifest with ClusterIP"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Helm chart structure)
2. Complete Phase 2: Foundational (health endpoints, Dockerfile verification) - CRITICAL
3. Complete Phase 3: User Story 1 (Local Kubernetes Deployment)
4. **STOP and VALIDATE**: Test User Story 1 independently using quickstart.md Scenario 1
5. Verify all Phase 3 features work in Kubernetes deployment
6. Demo/validate before proceeding

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently (quickstart Scenario 1) → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently (quickstart Scenario 2) → Deploy/Demo
4. Add User Story 3 → Test independently (quickstart Scenario 3) → Deploy/Demo
5. Add User Story 4 → Test independently (AI tools examples) → Deploy/Demo
6. Add User Story 5 → Test independently (quickstart Scenario 6) → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (CRITICAL PATH - must complete first)
3. After User Story 1 complete:
   - Developer B: User Story 2 (Health Monitoring)
   - Developer C: User Story 3 (Secure Configuration)
   - Developer D: User Story 4 (AI DevOps Tools) - can start earlier
4. After User Stories 1-3 complete:
   - Developer E: User Story 5 (Deployment Automation)
5. All developers: Phase 8 Polish (documentation, final validation)

---

## Notes

- **Context7 Verification**: All kubectl, Helm, and Minikube commands verified against latest documentation (Dec 2025)
- **No Tests Generated**: Feature specification does not explicitly request test tasks. Focus is on infrastructure/deployment implementation.
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Use quickstart.md scenarios for verification at each checkpoint
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Critical Path**: Setup → Foundational → US1 → US2/US3/US4 → US5 → Polish
- **MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = Minimal viable Kubernetes deployment
