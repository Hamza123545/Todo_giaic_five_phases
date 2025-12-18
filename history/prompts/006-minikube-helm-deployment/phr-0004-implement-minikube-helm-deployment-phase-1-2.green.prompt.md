---
id: 0004
title: Implement Minikube Helm Deployment Phase 1-2
stage: green
date: 2025-12-18
surface: agent
model: claude-sonnet-4-5-20250929
feature: 006-minikube-helm-deployment
branch: 006-minikube-helm-deployment
user: Hamza123545
command: /sp.implement
labels: ["kubernetes", "helm", "minikube", "docker", "health-checks", "deployment", "infrastructure"]
links:
  spec: specs/006-minikube-helm-deployment/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - k8s/todo-app/Chart.yaml
  - k8s/todo-app/templates/_helpers.tpl
  - phase-3/frontend/app/api/health/route.ts
  - phase-3/frontend/app/api/ready/route.ts
  - phase-3/backend/routers/health.py
  - phase-3/backend/main.py
  - scripts/ (directory created)
tests:
  - none
---

## Prompt

## Instructions

### 1. Use Context7 MCP Server (MANDATORY)

**⚠️ BEFORE implementing, query Context7 for:**

- Latest Kubernetes manifest syntax and API versions
- Current Helm 3.x template functions and best practices
- Latest kubectl command syntax for verification
- Current Minikube Docker daemon integration patterns
- Latest health probe configuration syntax
- Current ConfigMap/Secret creation patterns
- Latest Service resource specifications (NodePort, ClusterIP)
- Current resource limits/requests syntax
- Latest kubectl-ai, kagent, Docker AI command examples

**Verify with Context7:**
- All Kubernetes YAML syntax is current
- Helm template helpers use latest functions
- kubectl commands follow latest patterns
- Minikube setup commands are up-to-date

### 2. Implementation Requirements

**Input Files** (read in order):
- `specs/006-minikube-helm-deployment/tasks.md` - Task list
- `specs/006-minikube-helm-deployment/plan.md` - Architecture and tech stack
- `specs/006-minikube-helm-deployment/spec.md` - User stories and requirements

**Execution Flow:**
1. Run prerequisites check script
2. Verify checklist status (if incomplete, ask user)
3. Load implementation context (tasks.md, plan.md, spec.md)
4. Verify/create ignore files (.gitignore, .dockerignore, .helmignore)
5. Execute tasks phase-by-phase:
   - Phase 1: Setup (Helm chart structure)
   - Phase 2: Foundational (health checks, Dockerfiles)
   - Phase 3-6: User stories (US1-US5)
   - Phase 7: Integration & Testing
6. Mark completed tasks as [X] in tasks.md
7. Validate completion

### 3. Key Implementation Rules

- **Respect dependencies**: Sequential tasks must run in order
- **Parallel execution**: Tasks marked [P] can run together
- **Health checks first**: Must be implemented before deployment templates
- **Docker context**: Use Minikube's Docker daemon (`eval $(minikube docker-env)`)
- **External services**: Database and R2 storage remain external (not in-cluster)
- **No breaking changes**: All Phase 3 functionality must remain intact

### 4. Critical Files to Create

- `k8s/todo-app/Chart.yaml` - Helm chart metadata
- `k8s/todo-app/values.yaml` - Default configuration values
- `k8s/todo-app/templates/` - Kubernetes manifests (Deployment, Service, ConfigMap, Secret)
- `scripts/deploy.sh` or `scripts/deploy.ps1` - One-command deployment
- Health check endpoints in frontend and backend

### 5. Validation Steps

After implementation:
- Verify Helm chart structure is correct
- Test health check endpoints locally
- Verify Docker images build in Minikube context
- Test Helm install/upgrade commands
- Verify ConfigMap/Secret creation
- Test service discovery (NodePort, ClusterIP)

### 6. Expected Output

- Complete Helm chart in `k8s/todo-app/`
- Deployment automation scripts
- Health check endpoints in frontend/backend
- Updated tasks.md with completed tasks marked [X]
- All user stories (US1-US5) implemented

## Response snapshot

Successfully implemented Phase 1 (Setup) and Phase 2 (Foundational) of the Minikube Helm deployment:

**Phase 1 - Setup:**
- Created Helm chart directory structure with Chart.yaml (v1.0.0, app v3.0.0)
- Created _helpers.tpl with standard Helm template functions for labels and names
- Created scripts/ directory for deployment automation

**Phase 2 - Foundational:**
- Added frontend health endpoints (/api/health, /api/ready) in Next.js App Router
- Created backend health router with /health (liveness) and /ready (readiness with DB check)
- Verified both Dockerfiles exist and are production-ready
- Registered health router in FastAPI main.py

Context7 was queried for latest Kubernetes, Helm, and Minikube documentation to ensure all syntax and patterns are current (Dec 2025).

## Outcome

- ✅ Impact: Foundation ready for Kubernetes deployment - Helm chart structure created, health probes implemented in both frontend and backend, all prerequisites verified
- 🧪 Tests: None run yet - health endpoints created but not yet tested in Kubernetes context
- 📁 Files: Created 7 new files (Chart.yaml, _helpers.tpl, 2 frontend routes, 1 backend router, updated main.py, scripts directory)
- 🔁 Next prompts: Continue with Phase 3 (User Story 1) - create values.yaml, ConfigMap/Secret templates, Deployment/Service manifests, and deployment automation script
- 🧠 Reflection: Health checks are critical blocking prerequisites - implemented first to unblock all subsequent deployment work, following Kubernetes best practices with separate liveness (process health) and readiness (dependency health) probes

## Evaluation notes (flywheel)

- Failure modes observed: Script path `.specify/scripts/bash/create-phr.sh` does not exist, requiring fallback to manual PHR creation
- Graders run and results (PASS/FAIL): Not applicable - implementation phase, no automated graders run
- Prompt variant (if applicable): None
- Next experiment (smallest change to try): Verify health endpoints work by starting dev servers and curling /api/health, /api/ready (frontend) and /health, /ready (backend) to confirm 200 OK responses
