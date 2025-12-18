#!/bin/bash
# ============================================================================
# One-Command Deployment Script for Todo App on Minikube
# ============================================================================
# This script automates the entire deployment workflow:
# 1. Validates prerequisites (minikube, helm, docker, kubectl)
# 2. Starts Minikube if not running
# 3. Configures Docker to use Minikube's daemon
# 4. Builds Docker images in Minikube context
# 5. Installs/upgrades Helm chart
# 6. Waits for pods to be ready
# 7. Displays access URLs
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Print section header
print_header() {
    echo ""
    print_message "${BLUE}" "============================================================================"
    print_message "${BLUE}" "$1"
    print_message "${BLUE}" "============================================================================"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# Step 1: Validate Prerequisites
# ============================================================================
print_header "Step 1: Validating Prerequisites"

if ! command_exists minikube; then
    print_message "${RED}" "❌ Error: minikube not found"
    print_message "${YELLOW}" "Install minikube: https://minikube.sigs.k8s.io/docs/start/"
    exit 1
fi
print_message "${GREEN}" "✓ minikube found: $(minikube version --short)"

if ! command_exists helm; then
    print_message "${RED}" "❌ Error: helm not found"
    print_message "${YELLOW}" "Install helm: https://helm.sh/docs/intro/install/"
    exit 1
fi
print_message "${GREEN}" "✓ helm found: $(helm version --short)"

if ! command_exists docker; then
    print_message "${RED}" "❌ Error: docker not found"
    print_message "${YELLOW}" "Install docker: https://docs.docker.com/get-docker/"
    exit 1
fi
print_message "${GREEN}" "✓ docker found: $(docker --version)"

if ! command_exists kubectl; then
    print_message "${RED}" "❌ Error: kubectl not found"
    print_message "${YELLOW}" "Install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi
print_message "${GREEN}" "✓ kubectl found: $(kubectl version --client --short 2>/dev/null || echo 'kubectl installed')"

# ============================================================================
# Step 2: Start Minikube
# ============================================================================
print_header "Step 2: Starting Minikube"

if minikube status >/dev/null 2>&1; then
    print_message "${GREEN}" "✓ Minikube is already running"
else
    print_message "${YELLOW}" "Starting Minikube..."
    minikube start
    print_message "${GREEN}" "✓ Minikube started successfully"
fi

# ============================================================================
# Step 3: Configure Docker to Use Minikube Daemon
# ============================================================================
print_header "Step 3: Configuring Docker for Minikube"

print_message "${YELLOW}" "Setting Docker environment variables..."
eval $(minikube docker-env)
print_message "${GREEN}" "✓ Docker configured to use Minikube daemon"

# Verify Docker is using Minikube daemon
if docker ps | grep -q "kube"; then
    print_message "${GREEN}" "✓ Docker verified - connected to Minikube daemon"
else
    print_message "${YELLOW}" "⚠ Warning: Docker may not be using Minikube daemon"
fi

# ============================================================================
# Step 4: Build Docker Images
# ============================================================================
print_header "Step 4: Building Docker Images"

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PHASE4_DIR="$PROJECT_ROOT/phase-4"

# Build frontend image
print_message "${YELLOW}" "Building frontend image..."
cd "$PHASE4_DIR/frontend"
docker build -t todo-frontend:latest .
print_message "${GREEN}" "✓ Frontend image built: todo-frontend:latest"

# Build backend image
print_message "${YELLOW}" "Building backend image..."
cd "$PHASE4_DIR/backend"
docker build -t todo-backend:latest .
print_message "${GREEN}" "✓ Backend image built: todo-backend:latest"

# Verify images
cd "$PROJECT_ROOT"
print_message "${YELLOW}" "Verifying built images..."
docker images | grep "todo-"
print_message "${GREEN}" "✓ Images verified"

# ============================================================================
# Step 4.5: Load Environment Variables from .env Files
# ============================================================================
print_header "Step 4.5: Loading Environment Variables"

# Function to load .env file
load_env_file() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        print_message "${YELLOW}" "Reading: $env_file"
        while IFS='=' read -r key value || [ -n "$key" ]; do
            # Skip comments and empty lines
            if [[ ! "$key" =~ ^#.* ]] && [ -n "$key" ]; then
                # Remove quotes and export
                value="${value%\"}"
                value="${value#\"}"
                value="${value%\'}"
                value="${value#\'}"
                export "$key=$value"
            fi
        done < "$env_file"
    fi
}

# Load backend .env
BACKEND_ENV="$PHASE4_DIR/backend/.env"
if [ -f "$BACKEND_ENV" ]; then
    load_env_file "$BACKEND_ENV"
fi

# Load frontend .env
FRONTEND_ENV="$PHASE4_DIR/frontend/.env"
if [ -f "$FRONTEND_ENV" ]; then
    load_env_file "$FRONTEND_ENV"
fi

# Display loaded variables
if [ -n "$DATABASE_URL" ]; then
    print_message "${GREEN}" "✓ Loaded DATABASE_URL from .env"
fi

if [ -n "$BETTER_AUTH_SECRET" ]; then
    print_message "${GREEN}" "✓ Loaded BETTER_AUTH_SECRET from .env"
fi

if [ -n "$LLM_PROVIDER" ]; then
    print_message "${GREEN}" "✓ Loaded LLM_PROVIDER from .env: $LLM_PROVIDER"
fi

# Load API key based on LLM provider
LLM_PROVIDER="${LLM_PROVIDER:-openai}"
case "${LLM_PROVIDER,,}" in
    openrouter)
        if [ -z "$OPENAI_API_KEY" ] && [ -n "$OPENROUTER_API_KEY" ]; then
            export OPENAI_API_KEY="$OPENROUTER_API_KEY"
            print_message "${GREEN}" "✓ Loaded OPENROUTER_API_KEY from .env (using as OPENAI_API_KEY)"
        fi
        ;;
    gemini)
        if [ -z "$OPENAI_API_KEY" ] && [ -n "$GEMINI_API_KEY" ]; then
            export OPENAI_API_KEY="$GEMINI_API_KEY"
            print_message "${GREEN}" "✓ Loaded GEMINI_API_KEY from .env (using as OPENAI_API_KEY)"
        fi
        ;;
    *)
        if [ -n "$OPENAI_API_KEY" ]; then
            print_message "${GREEN}" "✓ Loaded OPENAI_API_KEY from .env"
        fi
        ;;
esac

# ============================================================================
# Step 5: Install/Upgrade Helm Chart
# ============================================================================
print_header "Step 5: Installing/Upgrading Helm Chart"

# Verify required environment variables are set
if [ -z "$DATABASE_URL" ] || [ -z "$BETTER_AUTH_SECRET" ] || [ -z "$OPENAI_API_KEY" ]; then
    print_message "${RED}" "❌ Error: Required environment variables not set"
    print_message "${YELLOW}" "Missing variables:"
    [ -z "$DATABASE_URL" ] && echo "  - DATABASE_URL"
    [ -z "$BETTER_AUTH_SECRET" ] && echo "  - BETTER_AUTH_SECRET"
    [ -z "$OPENAI_API_KEY" ] && echo "  - OPENAI_API_KEY (or OPENROUTER_API_KEY/GEMINI_API_KEY based on LLM_PROVIDER)"
    echo ""
    print_message "${YELLOW}" "Please ensure these variables are set in:"
    print_message "${YELLOW}" "  - $BACKEND_ENV"
    print_message "${YELLOW}" "  - $FRONTEND_ENV"
    print_message "${YELLOW}" "Or set them manually as environment variables"
    exit 1
fi

print_message "${YELLOW}" "Installing/upgrading todo-app Helm chart..."

helm upgrade --install todo-app ./k8s/todo-app \
    --create-namespace \
    --namespace todo \
    --set secrets.databaseUrl="$DATABASE_URL" \
    --set secrets.betterAuthSecret="$BETTER_AUTH_SECRET" \
    --set secrets.openaiApiKey="$OPENAI_API_KEY" \
    --set secrets.llmProvider="${LLM_PROVIDER:-openai}" \
    --wait \
    --timeout 10m

print_message "${GREEN}" "✓ Helm chart installed/upgraded successfully"

# ============================================================================
# Step 6: Wait for Pods to be Ready
# ============================================================================
print_header "Step 6: Waiting for Pods to be Ready"

print_message "${YELLOW}" "Waiting for all pods to be ready (timeout: 120s)..."
if kubectl wait --for=condition=ready pod \
    -l app.kubernetes.io/instance=todo-app \
    -n todo \
    --timeout=120s; then
    print_message "${GREEN}" "✓ All pods are ready"
else
    print_message "${RED}" "❌ Timeout waiting for pods to be ready"
    print_message "${YELLOW}" "Check pod status with: kubectl get pods -n todo"
    print_message "${YELLOW}" "Check pod logs with: kubectl logs -n todo <pod-name>"
    exit 1
fi

# ============================================================================
# Step 7: Display Access URLs and Status
# ============================================================================
print_header "Step 7: Deployment Complete!"

MINIKUBE_IP=$(minikube ip)

print_message "${GREEN}" "🎉 Todo App deployed successfully!"
echo ""
print_message "${BLUE}" "Access URLs:"
print_message "${GREEN}" "  Frontend:  http://$MINIKUBE_IP:30300"
print_message "${GREEN}" "  Backend:   http://todo-app-backend.todo.svc.cluster.local:8000 (internal)"
echo ""
print_message "${BLUE}" "Useful Commands:"
echo "  View all resources:    kubectl get all -n todo"
echo "  View pods:             kubectl get pods -n todo"
echo "  View services:         kubectl get svc -n todo"
echo "  View logs (frontend):  kubectl logs -n todo -l app=todo-frontend"
echo "  View logs (backend):   kubectl logs -n todo -l app=todo-backend"
echo "  Open frontend:         minikube service todo-app-frontend -n todo"
echo "  Port forward backend:  kubectl port-forward -n todo svc/todo-app-backend 8000:8000"
echo ""
print_message "${BLUE}" "To uninstall:"
echo "  helm uninstall todo-app -n todo"
echo "  kubectl delete namespace todo"
echo ""
print_message "${GREEN}" "✓ Deployment completed successfully in $(date)"
