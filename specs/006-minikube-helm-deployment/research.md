# Phase 0: Research & Technology Decisions

**Feature**: Kubernetes Deployment with Minikube and Helm
**Created**: 2025-12-18
**Status**: Complete

## Research Questions Resolved

This document captures all technology research conducted to resolve unknowns from the Technical Context and ensure informed architectural decisions.

---

## 1. Kubernetes API Versions and Manifest Syntax

**Decision**: Use `apps/v1` for Deployments, `v1` for Services/ConfigMaps/Secrets

**Rationale**:
- `apps/v1` is the stable, current API version for Deployments (verified via Context7 from kubernetes.io)
- `v1` is the stable API version for core resources (Services, ConfigMaps, Secrets, Pods)
- These versions are supported in Kubernetes 1.28+ (our target version)
- Using stable API versions ensures compatibility and avoids deprecation warnings

**Alternatives Considered**:
- `extensions/v1beta1` - Deprecated, should not be used
- `apps/v1beta2` - Deprecated in favor of apps/v1

**Sources**: Context7 query to /websites/kubernetes_io (latest Kubernetes documentation)

---

## 2. Helm 3.x Chart Structure and Best Practices

**Decision**: Use standard Helm 3 chart structure with values.yaml, templates/, and Chart.yaml

**Chart Structure**:
```
todo-app/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default configuration values
├── templates/
│   ├── deployment.yaml # Deployment manifests
│   ├── service.yaml    # Service manifests
│   ├── configmap.yaml  # ConfigMap for non-sensitive config
│   ├── secret.yaml     # Secret for sensitive credentials
│   └── _helpers.tpl    # Template helpers
└── charts/             # Sub-charts (if needed)
```

**Rationale**:
- Standard Helm 3 structure is well-documented and widely adopted
- Separation of concerns: templates define structure, values.yaml defines configuration
- Template helpers (`_helpers.tpl`) enable code reuse for labels, names, selectors
- Values can be overridden at installation time (`helm install -f custom-values.yaml`)

**Best Practices from Context7**:
- Use flat value structures where possible (e.g., `serverName: nginx` vs nested `server: { name: nginx }`)
- Include `required` function for mandatory values: `{{ required "database URL is required" .Values.databaseUrl }}`
- Use `.Values` object for all configuration access
- Leverage Sprig template functions for string manipulation, conditionals

**Alternatives Considered**:
- Nested value structures - More complex, harder to template
- Kustomize - Different tool, less flexible for multi-environment configuration

**Sources**: Context7 query to /websites/helm_sh (Helm 3.x official documentation)

---

## 3. Minikube Docker Daemon Integration

**Decision**: Use `eval $(minikube docker-env)` to build images in Minikube context

**Workflow**:
```bash
# 1. Point Docker CLI to Minikube's Docker daemon
eval $(minikube docker-env)

# 2. Build images (stored in Minikube, not local Docker)
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend

# 3. Deploy to Kubernetes (images already available)
helm install todo-app ./k8s/todo-app

# 4. Pods use local images without pulling from registry
```

**Rationale**:
- Images built in Minikube context are immediately available to Kubernetes
- No need to push to external registry (Docker Hub, etc.)
- Significantly faster iteration cycle for local development
- Reduces external dependencies and network usage

**Alternative Approach**:
```bash
# Alternative: Use minikube image build command directly
minikube image build -t todo-frontend:latest ./frontend
```

**Alternatives Considered**:
- Push to external registry - Slower, requires network, adds complexity
- Use minikube image load - Extra step, less intuitive workflow

**Sources**: Context7 query to /kubernetes/minikube (Minikube official repository and docs)

---

## 4. Health Probe Configuration Patterns

**Decision**: Implement HTTP health probes with separate liveness and readiness endpoints

**Frontend Health Probes**:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

**Backend Health Probes**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 45
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 20
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

**Rationale**:
- HTTP probes are simpler than exec probes, don't require shell in container
- Separate endpoints allow different logic:
  - `/health` or `/api/health` - Basic process health (always return 200 if process alive)
  - `/ready` or `/api/ready` - Dependency health (check database, external services)
- `initialDelaySeconds` prevents premature restarts during app startup
- Backend needs longer `initialDelaySeconds` (45s) to establish database connection
- `failureThreshold=3` for liveness gives grace period before restart
- `failureThreshold=2` for readiness quickly removes unhealthy pods from load balancer

**Best Practices**:
- Readiness probe should verify external dependencies (database connectivity)
- Liveness probe should only check if the application process is alive
- Avoid expensive operations in health checks (they run frequently)
- Return 200 for healthy, 500+ for unhealthy

**Alternatives Considered**:
- TCP socket probes - Less informative, can't verify application logic
- Exec probes - More complex, require shell in container
- Same endpoint for liveness/readiness - Less flexibility, couples concerns

**Sources**: Context7 query to /websites/kubernetes_io (health probe configuration documentation)

---

## 5. ConfigMap and Secret Management Patterns

**Decision**: Use separate ConfigMaps for non-sensitive config, Secrets for credentials

**ConfigMap Usage** (Non-sensitive configuration):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: todo-app-config
data:
  FRONTEND_URL: "http://localhost:30300"
  BACKEND_URL: "http://todo-backend:8000"
  LOG_LEVEL: "info"
  NODE_ENV: "production"
```

**Secret Usage** (Sensitive credentials):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: todo-app-secrets
type: Opaque
stringData:  # Use stringData for plain text (auto base64 encoded)
  DATABASE_URL: "postgresql://user:pass@neon.tech:5432/todo_db"
  BETTER_AUTH_SECRET: "your-secret-key-here"
  OPENAI_API_KEY: "sk-..."
  LLM_PROVIDER: "openai"
```

**Injection Pattern** (Environment variables from both sources):
```yaml
spec:
  containers:
  - name: backend
    env:
    # From ConfigMap
    - name: LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: todo-app-config
          key: LOG_LEVEL
    # From Secret
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: todo-app-secrets
          key: DATABASE_URL
```

**Rationale**:
- Separation of concerns: ConfigMaps for non-sensitive, Secrets for sensitive
- Secrets are base64 encoded (not encryption, but better than plaintext in manifests)
- Can update ConfigMaps/Secrets independently without rebuilding images
- `stringData` field in Secrets allows plain text input (auto-encoded to base64)
- Environment variable injection is simplest pattern for 12-factor apps

**Security Best Practices**:
- Never commit Secrets to git (use `.gitignore`, or encrypted Sealed Secrets)
- Use Helm values files with placeholders, inject real values at deploy time
- Consider external secret management (Vault, AWS Secrets Manager) for production

**Alternatives Considered**:
- Volume mounts - More complex, overkill for environment variables
- Hardcoded in Dockerfile - Violates 12-factor app, requires rebuild for config changes
- Single Secret for all config - Mixes sensitive and non-sensitive data

**Sources**: Context7 query to /websites/kubernetes_io (ConfigMap and Secret resource specs)

---

## 6. Resource Limits and Requests

**Decision**: Define resource requests and limits for all containers

**Frontend Resources**:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**Backend Resources**:
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

**Rationale**:
- `requests` - Minimum resources guaranteed, used for scheduling decisions
- `limits` - Maximum resources allowed, prevents resource exhaustion
- Frontend (Next.js) is lighter, backend (FastAPI + AI agents) needs more resources
- Backend AI agent operations (LLM calls, MCP tools) may spike CPU usage
- Prevents one misbehaving pod from starving others (noisy neighbor problem)

**Best Practices**:
- Set `requests` based on normal operation, `limits` with headroom for spikes
- Monitor actual usage in Minikube and adjust values iteratively
- Use `kubectl top pods` to observe real resource consumption

**Alternatives Considered**:
- No resource limits - Risky, allows resource exhaustion
- Same limits for frontend/backend - Wasteful for frontend, insufficient for backend

**Sources**: Kubernetes best practices for resource management

---

## 7. Service Discovery Patterns

**Decision**: Use ClusterIP for backend (internal), NodePort for frontend (external)

**Backend Service** (ClusterIP - internal only):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-backend
spec:
  type: ClusterIP
  selector:
    app: todo-backend
  ports:
  - port: 8000
    targetPort: 8000
```

**Frontend Service** (NodePort - external access):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: todo-frontend
spec:
  type: NodePort
  selector:
    app: todo-frontend
  ports:
  - port: 3000
    targetPort: 3000
    nodePort: 30300
```

**Rationale**:
- ClusterIP exposes backend only within cluster (security best practice)
- Frontend calls backend via DNS: `http://todo-backend:8000`
- NodePort exposes frontend on host machine port 30300
- Users access frontend via `http://localhost:30300` (Minikube IP + NodePort)
- External database/storage accessed via public URLs (not in-cluster services)

**Service Discovery**:
- Kubernetes DNS automatically creates `<service-name>.<namespace>.svc.cluster.local`
- Short name `todo-backend` resolves within same namespace
- Frontend env var: `BACKEND_URL=http://todo-backend:8000`

**Alternatives Considered**:
- LoadBalancer - Not supported in Minikube without metallb addon
- Ingress - Overkill for simple local deployment, adds complexity
- Both as NodePort - Exposes backend unnecessarily

**Sources**: Kubernetes service networking documentation

---

## 8. AI DevOps Tools Integration

**Decision**: Document kubectl-ai, kagent, and Docker AI with practical examples

**kubectl-ai** (Natural language kubectl):
- Install: `curl -sL https://kubectl.ai/install | sh`
- Example: `kubectl-ai "show me all pods that are not running"`
- Use case: Debugging, learning kubectl commands

**kagent** (Kubernetes troubleshooting agent):
- Install: Follow official installation guide
- Example: `kagent diagnose pod <pod-name>`
- Use case: Root cause analysis, automated troubleshooting

**Docker AI** (Dockerfile optimization):
- Integrated into Docker Desktop
- Example: `docker build . --tag myapp --help` (AI suggestions in output)
- Use case: Image size optimization, security best practices

**Rationale**:
- AI tools enhance developer productivity, especially for Kubernetes beginners
- Lower learning curve for complex kubectl commands
- Faster troubleshooting with context-aware suggestions
- Not required for core functionality, but valuable for Phase IV completeness

**Documentation Approach**:
- Create `docs/ai-devops-tools.md` with installation steps
- Include practical examples for common scenarios
- Link to official documentation
- Provide troubleshooting cheat sheet

**Sources**: Official tool websites and GitHub repositories

---

## 9. Deployment Automation Script Design

**Decision**: Create `deploy.sh` script that orchestrates full deployment workflow

**Script Workflow**:
```bash
#!/bin/bash
# deploy.sh - One-command deployment to Minikube

set -e  # Exit on error

# 1. Validate prerequisites
command -v minikube >/dev/null || { echo "minikube not found"; exit 1; }
command -v helm >/dev/null || { echo "helm not found"; exit 1; }
command -v docker >/dev/null || { echo "docker not found"; exit 1; }

# 2. Start Minikube (if not running)
minikube status || minikube start

# 3. Point Docker to Minikube daemon
eval $(minikube docker-env)

# 4. Build images
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend

# 5. Install/upgrade Helm chart
helm upgrade --install todo-app ./k8s/todo-app \
  --create-namespace \
  --namespace todo \
  --wait \
  --timeout 10m

# 6. Wait for pods to be ready
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/instance=todo-app \
  -n todo \
  --timeout=120s

# 7. Display access URL
echo "Frontend: http://$(minikube ip):30300"
echo "Backend health: http://$(minikube ip):$(kubectl get svc todo-backend -n todo -o jsonpath='{.spec.ports[0].nodePort}')/health"
```

**Rationale**:
- Single command abstracts multi-step workflow
- Idempotent - safe to run multiple times
- Validates prerequisites before starting
- Provides clear feedback and error messages
- Displays access URLs after successful deployment

**Error Handling**:
- `set -e` causes script to exit on first error
- Explicit checks for required commands
- Timeout protection for long-running operations

**Alternatives Considered**:
- Makefile - Less portable across Windows/Linux/Mac
- Manual steps - Error-prone, not meeting P5 requirement

**Sources**: Bash scripting best practices

---

## 10. Image Pull Policy for Local Development

**Decision**: Use `imagePullPolicy: IfNotPresent` for locally built images

**Configuration**:
```yaml
spec:
  containers:
  - name: backend
    image: todo-backend:latest
    imagePullPolicy: IfNotPresent  # Don't pull from registry
```

**Rationale**:
- `IfNotPresent` uses local image if available, doesn't pull from registry
- Images built in Minikube context are already present locally
- `latest` tag with `IfNotPresent` ensures local development workflow works
- Prevents unnecessary registry pulls that would fail (images not pushed)

**Alternatives Considered**:
- `Always` - Would try to pull from registry, fail for local images
- `Never` - Too restrictive, would fail if image not present

**Sources**: Kubernetes image pull policy documentation

---

## Summary

All research questions resolved. Key decisions:

1. **Kubernetes API**: apps/v1 for Deployments, v1 for core resources
2. **Helm Structure**: Standard chart layout with templates/, values.yaml
3. **Image Building**: `eval $(minikube docker-env)` + `docker build`
4. **Health Probes**: Separate HTTP endpoints for liveness/readiness
5. **Configuration**: ConfigMaps (non-sensitive), Secrets (sensitive)
6. **Resources**: Defined requests/limits for scheduling and safety
7. **Services**: ClusterIP (backend), NodePort (frontend)
8. **AI Tools**: kubectl-ai, kagent, Docker AI with practical examples
9. **Automation**: Shell script orchestrating complete workflow
10. **Image Policy**: IfNotPresent for local development

All decisions verified against latest documentation via Context7 queries. Ready to proceed to Phase 1 (Design & Contracts).
