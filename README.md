# Todo Console Application

A comprehensive todo application project showcasing the evolution from a simple CLI application to a full-stack web application with Kubernetes deployment.

## Project Overview

This repository contains the complete evolution of a todo application, progressing through multiple phases:

- **Phase 1**: CLI Todo Application (Python + Click framework)
- **Phase 2**: Full-Stack Web Application (Next.js + FastAPI) ✅ **COMPLETED**
- **Phase 3**: AI-Powered Chatbot (OpenAI ChatKit + Agents SDK) ✅ **COMPLETED**
- **Phase 4**: Kubernetes Deployment (Minikube + Helm) 🚧 **IN PROGRESS**

## Phase 2: Full-Stack Web Application ✅

**Status: COMPLETE** - Phase 2 includes a fully functional full-stack todo web application with modern features.

### Architecture

- **Frontend**: Next.js 16+ with TypeScript, Tailwind CSS, Better Auth
- **Backend**: FastAPI with PostgreSQL (Neon Serverless), Drizzle ORM, JWT authentication
- **Database**: PostgreSQL (Neon Serverless)
- **Authentication**: Better Auth with JWT tokens
- **Deployment**: Docker-ready, Vercel (frontend), GitHub Actions CI/CD

### Features

#### Frontend Features
- ✅ Modern UI with Shadcn UI components
- ✅ Framer Motion animations
- ✅ Dark/Light mode support
- ✅ Responsive design (mobile-first)
- ✅ Real-time task management
- ✅ Advanced filtering and sorting
- ✅ Search with debouncing
- ✅ Drag and drop task reordering
- ✅ Export/Import (CSV, JSON, PDF)
- ✅ PWA support (offline mode)
- ✅ Keyboard shortcuts
- ✅ Optimistic UI updates
- ✅ Toast notifications
- ✅ Loading states and error handling

#### Backend Features
- ✅ RESTful API with FastAPI
- ✅ JWT authentication with Better Auth
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Task CRUD operations
- ✅ Advanced filtering and sorting
- ✅ Export/Import functionality
- ✅ PDF generation
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Comprehensive error handling
- ✅ Request logging
- ✅ Database migrations with Alembic

### Project Structure

```
todo_console/
├── phase-1/                    # CLI Todo Application
│   └── cli_todo_app/
│
└── phase-2/                    # Full-Stack Web Application ✅
    ├── frontend/               # Next.js frontend
    │   ├── app/               # Next.js App Router
    │   ├── components/        # React components
    │   ├── lib/               # Utilities and API client
    │   └── ...
    │
    └── backend/               # FastAPI backend
        ├── routes/            # API routes
        ├── services/          # Business logic
        ├── models/            # Database models
        ├── schemas/           # Pydantic schemas
        ├── utils/             # Utilities
        └── tests/             # Test suite
```

## Getting Started

### Prerequisites

- **For Phase 1**: Python 3.13+, UV package manager
- **For Phase 2**:
  - Node.js 20+ and pnpm 9+ (Frontend)
  - Python 3.13+ and UV (Backend)
  - PostgreSQL database (Neon Serverless recommended)

### Phase 2 Setup

#### Backend Setup

1. Navigate to backend directory:
```bash
cd phase-2/backend
```

2. Install dependencies:
```bash
uv sync
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
uv run alembic upgrade head
```

5. Start the backend server:
```bash
uv run uvicorn main:app --reload
```

Backend will run on `http://localhost:8000`

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd phase-2/frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server:
```bash
pnpm run dev
```

Frontend will run on `http://localhost:3000`

## Phase 4: Kubernetes Deployment 🚧

**Status: IN PROGRESS** - Deploy the application to a local Minikube Kubernetes cluster using Helm charts.

### Prerequisites

Before deploying to Kubernetes, ensure you have the following tools installed:

- **Minikube** 1.32+ - Local Kubernetes cluster ([Installation Guide](https://minikube.sigs.k8s.io/docs/start/))
- **Helm** 3.x - Kubernetes package manager ([Installation Guide](https://helm.sh/docs/intro/install/))
- **Docker** 24+ - Container runtime ([Installation Guide](https://docs.docker.com/get-docker/))
- **kubectl** - Kubernetes command-line tool ([Installation Guide](https://kubernetes.io/docs/tasks/tools/))

Verify installations:
```bash
minikube version
helm version
docker --version
kubectl version --client
```

### One-Command Deployment

The easiest way to deploy is using the automated deployment script:

**Linux/macOS (Bash):**
```bash
# Set required environment variables in phase-4/backend/.env:
# - DATABASE_URL
# - BETTER_AUTH_SECRET
# - OPENAI_API_KEY (or OPENROUTER_API_KEY/GEMINI_API_KEY based on LLM_PROVIDER)

# Run the deployment script
./scripts/deploy.sh
```

**Windows (PowerShell):**
```powershell
# Run the deployment script
.\scripts\deploy.ps1
```

The deployment script automatically:
1. Validates prerequisites (minikube, helm, docker, kubectl)
2. Starts Minikube if not running
3. Configures Docker to use Minikube's daemon
4. Builds Docker images in Minikube context
5. Loads environment variables from `.env` files
6. Installs/upgrades Helm chart with secrets
7. Waits for pods to be ready
8. Displays access URLs

**Expected completion time**: Under 10 minutes on first run, faster on subsequent runs.

### Manual Deployment

If you prefer manual control:

```bash
# Start Minikube
minikube start

# Configure Docker to use Minikube's daemon
eval $(minikube docker-env)

# Build images
docker build -t todo-frontend:latest ./phase-4/frontend
docker build -t todo-backend:latest ./phase-4/backend

# Deploy using Helm
helm upgrade --install todo-app ./k8s/todo-app \
  --create-namespace \
  --namespace todo \
  --set secrets.databaseUrl="your-database-url" \
  --set secrets.betterAuthSecret="your-auth-secret" \
  --set secrets.openaiApiKey="your-openai-key"

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=todo-app -n todo --timeout=120s

# Access the application
echo "Frontend: http://$(minikube ip):30300"
```

### Configuration Customization via Helm Values

The deployment can be customized by overriding Helm chart values. There are multiple ways to customize your deployment:

#### Method 1: Using --set flags

Override individual values during deployment:

```bash
helm upgrade --install todo-app ./k8s/todo-app \
  --namespace todo \
  --create-namespace \
  --set frontend.replicaCount=3 \
  --set backend.replicaCount=2 \
  --set secrets.databaseUrl="your-db-url" \
  --set secrets.betterAuthSecret="your-secret" \
  --set secrets.openaiApiKey="your-key"
```

#### Method 2: Using a custom values file

Create a `values-local.yaml` file (not committed to git) with your overrides:

```yaml
frontend:
  replicaCount: 3
  resources:
    requests:
      memory: "512Mi"
      cpu: "200m"

backend:
  replicaCount: 2

secrets:
  databaseUrl: "postgresql://user:pass@host:5432/dbname"
  betterAuthSecret: "your-secret-key"
  openaiApiKey: "your-openai-api-key"
  llmProvider: "openai"
```

Then deploy with:

```bash
helm upgrade --install todo-app ./k8s/todo-app \
  --namespace todo \
  --create-namespace \
  -f ./k8s/todo-app/values-local.yaml
```

See `k8s/todo-app/values-example.yaml` for a complete example of customizable values.

### Required Environment Variables

For the automated deployment script, create a `.env` file in `phase-4/backend/` with:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
BETTER_AUTH_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
LLM_PROVIDER=openai  # or: openrouter, gemini, groq
```

### Horizontal Scaling

The Todo application supports horizontal scaling to handle increased load. Both frontend and backend can be scaled independently.

#### Scaling via kubectl

Scale deployments dynamically using kubectl:

```bash
# Scale frontend to 3 replicas
kubectl scale deployment todo-frontend --replicas=3 -n todo

# Scale backend to 2 replicas
kubectl scale deployment todo-backend --replicas=2 -n todo

# Verify scaling
kubectl get pods -n todo -l app=todo-frontend
kubectl get pods -n todo -l app=todo-backend
```

#### Scaling via Helm

Update replica counts in your values file and redeploy:

```bash
helm upgrade todo-app ./k8s/todo-app \
  --namespace todo \
  --set frontend.replicaCount=3 \
  --set backend.replicaCount=2 \
  --reuse-values
```

Or update your `values-local.yaml` and apply:

```yaml
frontend:
  replicaCount: 3
backend:
  replicaCount: 2
```

```bash
helm upgrade todo-app ./k8s/todo-app \
  --namespace todo \
  -f ./k8s/todo-app/values-local.yaml
```

#### Recommended Scaling Guidelines

- **Development**: 1 replica each (minimal resource usage)
- **Staging**: 2 replicas each (test load balancing)
- **Production**: 3+ replicas each (high availability)

**Note**: Each replica requires the resources specified in `values.yaml`. Ensure your cluster has sufficient capacity before scaling.

### Cleanup

Remove the deployment when no longer needed.

#### Option 1: Complete Cleanup (Recommended)

Remove all resources including persistent data:

```bash
# Step 1: Uninstall Helm release
helm uninstall todo-app -n todo

# Step 2: Delete namespace (removes all resources)
kubectl delete namespace todo

# Step 3: Stop Minikube (optional - frees system resources)
minikube stop

# Step 4: Delete Minikube cluster (optional - complete cleanup)
minikube delete
```

#### Option 2: Keep Cluster Running

Remove only the Todo application:

```bash
# Uninstall Helm release only
helm uninstall todo-app -n todo

# Optionally delete the namespace
kubectl delete namespace todo
```

#### Option 3: Temporary Pod Removal

Stop pods but keep configuration:

```bash
# Scale down to zero replicas (keeps resources)
kubectl scale deployment todo-frontend --replicas=0 -n todo
kubectl scale deployment todo-backend --replicas=0 -n todo

# Later, scale back up
kubectl scale deployment todo-frontend --replicas=2 -n todo
kubectl scale deployment todo-backend --replicas=2 -n todo
```

#### Verify Cleanup

```bash
# Check if resources were removed
kubectl get all -n todo

# Check if namespace was deleted
kubectl get namespace todo

# Verify Minikube status
minikube status
```

**Note**: Deleting the namespace removes all resources (deployments, services, secrets, configmaps) in one command.

### AI DevOps Tools

This project includes documentation for AI-powered DevOps tools that help developers understand and troubleshoot Kubernetes deployments:

- **kubectl-ai**: Natural language interface for kubectl commands
- **Kagent**: Kubernetes-native AI agent framework
- **Docker AI (Gordon)**: AI assistant built into Docker Desktop

See [AI DevOps Tools Guide](docs/ai-devops-tools.md) for installation, usage examples, and a troubleshooting cheat sheet.

### Kubernetes Resources

- **Helm Chart**: `k8s/todo-app/`
- **Frontend Service**: NodePort on port 30300
- **Backend Service**: ClusterIP on port 8000
- **ConfigMaps**: Non-sensitive configuration
- **Secrets**: Database credentials, API keys

### Health Checks

Both frontend and backend include health check endpoints:

- **Frontend**: `/api/health` (liveness), `/api/ready` (readiness)
- **Backend**: `/health` (liveness), `/ready` (readiness)

### Known Limitations and Troubleshooting

#### Known Limitations

1. **Local Development Only**: This deployment is optimized for Minikube. Production deployments require additional considerations:
   - External database (not included in Helm chart)
   - Ingress controller for domain-based routing
   - TLS/SSL certificates
   - Persistent volume claims for stateful data

2. **Minikube Docker Context**: Images must be built in Minikube's Docker context (`eval $(minikube docker-env)`). Images built outside this context won't be available to Kubernetes.

3. **NodePort Access**: Frontend is exposed via NodePort (30300). This requires using Minikube's IP address, not `localhost`.

4. **Resource Constraints**: Default Minikube configuration may not have enough resources for multiple replicas. Increase with:
   ```bash
   minikube start --cpus=4 --memory=8192
   ```

5. **Database Connectivity**: Backend requires external PostgreSQL database. The Helm chart does not include a database deployment.

#### Common Issues and Solutions

##### Issue: Pods stuck in `ImagePullBackOff`

**Cause**: Images not available in Minikube's Docker context.

**Solution**:
```bash
# Switch to Minikube's Docker daemon
eval $(minikube docker-env)

# Rebuild images
docker build -t todo-frontend:latest ./phase-4/frontend
docker build -t todo-backend:latest ./phase-4/backend

# Verify images exist
docker images | grep todo
```

##### Issue: Pods in `CrashLoopBackOff`

**Cause**: Application crashes during startup, often due to missing/invalid configuration.

**Solution**:
```bash
# Check pod logs for errors
kubectl logs -n todo -l app=todo-backend --tail=100

# Common fixes:
# 1. Verify secrets are set correctly
kubectl get secret todo-app-secrets -n todo -o yaml

# 2. Check database connectivity
kubectl exec -n todo deployment/todo-backend -- curl http://localhost:8000/health

# 3. Verify environment variables
kubectl describe pod -n todo -l app=todo-backend | grep -A 20 "Environment:"
```

##### Issue: Frontend can't reach backend

**Cause**: Service misconfiguration or network policy issues.

**Solution**:
```bash
# Test backend service from frontend pod
kubectl exec -n todo deployment/todo-frontend -- curl http://todo-backend:8000/health

# Verify service endpoints
kubectl get endpoints -n todo todo-backend

# Check service configuration
kubectl describe service -n todo todo-backend
```

##### Issue: `helm install` fails with "release already exists"

**Cause**: Previous installation wasn't cleaned up properly.

**Solution**:
```bash
# List existing releases
helm list -n todo

# Uninstall existing release
helm uninstall todo-app -n todo

# Clean up namespace if needed
kubectl delete namespace todo

# Try installation again
./scripts/deploy.sh
```

##### Issue: Database connection errors in backend logs

**Cause**: Invalid `DATABASE_URL` or database not accessible.

**Solution**:
```bash
# 1. Verify DATABASE_URL format
# Should be: postgresql://user:pass@host:port/dbname

# 2. Test database connectivity from backend pod
kubectl exec -n todo deployment/todo-backend -- sh -c \
  'apt-get update && apt-get install -y postgresql-client && psql $DATABASE_URL -c "SELECT 1"'

# 3. Check if DATABASE_URL secret is set correctly
kubectl get secret todo-app-secrets -n todo -o jsonpath='{.data.databaseUrl}' | base64 -d
```

##### Issue: Minikube won't start or is slow

**Cause**: Resource constraints or conflicting virtualization.

**Solution**:
```bash
# Delete and recreate with more resources
minikube delete
minikube start --cpus=4 --memory=8192 --driver=docker

# Check Minikube status
minikube status

# View Minikube logs
minikube logs
```

##### Issue: Changes to code not reflected in pods

**Cause**: Using cached images with `:latest` tag.

**Solution**:
```bash
# Rebuild images
eval $(minikube docker-env)
docker build -t todo-frontend:latest ./phase-4/frontend --no-cache
docker build -t todo-backend:latest ./phase-4/backend --no-cache

# Force pod recreation
kubectl rollout restart deployment/todo-frontend -n todo
kubectl rollout restart deployment/todo-backend -n todo
```

#### Getting Help

For additional help:
- Check pod logs: `kubectl logs -n todo <pod-name> --tail=100`
- Describe resources: `kubectl describe pod -n todo <pod-name>`
- Use AI DevOps tools: See [AI DevOps Tools Guide](docs/ai-devops-tools.md)
- Review Helm chart values: `helm get values todo-app -n todo`

## Documentation

- [Backend README](phase-2/backend/README.md) - Complete backend documentation
- [Frontend README](phase-2/frontend/README.md) - Complete frontend documentation
- [AI DevOps Tools Guide](docs/ai-devops-tools.md) - AI-powered Kubernetes tools and troubleshooting

## Environment Variables

⚠️ **Important**: All `.env` and `.env.local` files are gitignored to protect sensitive information.

### Backend Environment Variables
See [backend/.env.example](phase-2/backend/.env.example) for required variables.

### Frontend Environment Variables
See [frontend/.env.example](phase-2/frontend/.env.example) for required variables.

## Testing

### Backend Tests
```bash
cd phase-2/backend
uv run pytest
```

### Frontend Tests
```bash
cd phase-2/frontend
pnpm run test
```

## CI/CD

Both frontend and backend have GitHub Actions workflows configured:
- `.github/workflows/backend-ci.yml` - Backend CI/CD pipeline
- `.github/workflows/frontend-ci.yml` - Frontend CI/CD pipeline

## License

This project is part of a learning exercise and development showcase.
