# AI DevOps Tools Guide

This guide documents AI-powered tools that help developers understand and troubleshoot Kubernetes deployments. These tools translate natural language queries into precise kubectl commands and provide intelligent assistance for common DevOps tasks.

## Table of Contents

- [kubectl-ai](#kubectl-ai)
- [Kagent](#kagent)
- [Docker AI (Gordon)](#docker-ai-gordon)
- [Troubleshooting Cheat Sheet](#troubleshooting-cheat-sheet)

---

## kubectl-ai

kubectl-ai is an intelligent interface from Google Cloud Platform that translates user intent into precise Kubernetes operations, making Kubernetes management more accessible and efficient.

### Installation

**Linux/macOS (Recommended)**:
```bash
# Install using the official install script
curl -sSL https://raw.githubusercontent.com/GoogleCloudPlatform/kubectl-ai/main/install.sh | bash
```

**Manual Installation**:
```bash
# Download the release for your platform from GitHub releases
# Example for macOS ARM64:
tar -zxvf kubectl-ai_Darwin_arm64.tar.gz
chmod a+x kubectl-ai
sudo mv kubectl-ai /usr/local/bin/
```

**Using Krew (kubectl plugin manager)**:
```bash
kubectl krew install ai
```

**NixOS**:
```nix
environment.systemPackages = with pkgs; [
  kubectl-ai
];
```

Or temporarily:
```bash
nix-shell -p kubectl-ai
```

### Configuration

Set up your API key (Gemini is the default provider):
```bash
# Using Gemini (default)
export GEMINI_API_KEY=your_api_key_here

# Using OpenAI
export OPENAI_API_KEY=your_api_key_here
```

### Usage Examples

**Interactive Mode** (maintains conversation context):
```bash
kubectl-ai
# >>> "show me all pods in the default namespace"
# >>> "which ones are not running?"
# >>> "show me their logs"
```

**One-Shot Mode** (execute a single query):
```bash
kubectl-ai --quiet "fetch logs for nginx app in hello namespace"
```

**Using Different LLM Models**:
```bash
kubectl-ai --model gemini-2.5-flash-preview-04-17
kubectl-ai --llm-provider openai --model gpt-4.1
```

**Pipe Input from Other Commands**:
```bash
echo "list pods in the default namespace" | kubectl-ai
cat error.log | kubectl-ai "explain the error"
```

**Skip Permission Confirmations** (use with caution):
```bash
kubectl-ai --quiet --skip-permissions "scale nginx deployment to 5 replicas"
```

### Common Queries for Todo App

```bash
# Check pod status
kubectl-ai "show me all pods that are not running"

# Get logs from backend
kubectl-ai "get logs from the todo-backend pod"

# Describe services
kubectl-ai "describe the todo-frontend service"

# Scale deployments
kubectl-ai "scale todo-frontend deployment to 3 replicas"

# Check resource usage
kubectl-ai "show me pods using more than 500Mi memory"

# Troubleshoot issues
kubectl-ai "why is my todo-backend pod crashing?"
```

---

## Kagent

Kagent is a Kubernetes-native framework for building, deploying, and managing AI agents, offering extensibility and observability for Kubernetes operations.

### Installation

**Using kubectl (from bundle)**:
```bash
kubectl apply -f https://raw.githubusercontent.com/kagent-dev/kagent/main/dist/install.yaml
```

**Using Helm with kagent CLI**:
```bash
# Set your API key
export OPENAI_API_KEY=your-openai-api-key
# Or for other providers:
export ANTHROPIC_API_KEY=your-anthropic-api-key
export AZURE_API_KEY=your-azure-api-key

# Set the default model provider
export KAGENT_DEFAULT_MODEL_PROVIDER=openAI
# Or: ollama, azureOpenAI, anthropic

# Install using make
make kagent-cli-install
```

**Build Installer Locally**:
```bash
make build-installer
# The installer will be available at dist/install.yaml
kubectl apply -f dist/install.yaml
```

### Usage Examples

**Resource Listing**:
```bash
# Basic listing
kubectl get pods -n todo
kubectl get deployments -n todo
kubectl get services -n todo

# Detailed listing
kubectl get pods -n todo -o wide
kubectl get nodes -o wide
```

**Resource Details**:
```bash
# Resource description
kubectl describe pod todo-backend-xxx -n todo
kubectl describe deployment todo-backend -n todo
kubectl describe service todo-frontend -n todo

# Resource configuration
kubectl get configmap todo-app-config -n todo -o yaml
kubectl get secret todo-app-secrets -n todo -o yaml
```

**Health Checks**:
```bash
# Component status
kubectl get componentstatuses

# Node status
kubectl get nodes -o wide

# Deployment status
kubectl get deployments -n todo -o wide
kubectl get pods -n todo -o wide
```

**Log Analysis**:
```bash
# Basic logs
kubectl logs todo-backend-xxx -n todo

# Advanced log queries
kubectl logs todo-backend-xxx -n todo --since=1h
kubectl logs todo-backend-xxx -n todo -c todo-backend
```

### Kagent Troubleshooting Commands

```bash
# Diagnose a specific pod
kagent diagnose pod todo-backend-xxx -n todo

# Troubleshoot a deployment
kagent troubleshoot deployment todo-backend -n todo

# Analyze cluster health
kagent analyze cluster

# Get recommendations for optimization
kagent recommend optimization -n todo
```

---

## Docker AI (Gordon)

Docker AI, powered by Gordon, is an AI-powered assistant built into Docker Desktop that helps with container management, image optimization, and troubleshooting.

### Prerequisites

- Docker Desktop installed and running
- Gordon enabled in Docker Desktop settings

### Enabling Docker AI

1. Open Docker Desktop
2. Go to Settings > Features in development
3. Enable "Docker AI" or "Gordon"
4. Restart Docker Desktop if prompted

### Usage Examples

**Starting a Conversation**:
```bash
docker ai
```

**Ask About Capabilities**:
```bash
docker ai "What can you do?"
```

**Container Management**:
```bash
# List all running containers
docker ai "Show me all running containers"

# List containers by resource usage
docker ai "List all containers using more than 1GB of memory"

# View container logs
docker ai "Show me logs from my running api-container from the last hour"
```

**Dockerfile Migration and Optimization**:
```bash
# Start conversation and request migration
docker ai
# >>> "Migrate my dockerfile to DHI"
```

### Docker AI for Todo App Development

```bash
# Build optimization suggestions
docker ai "How can I optimize my todo-frontend Dockerfile?"

# Security best practices
docker ai "Check my Dockerfile for security issues"

# Multi-stage build help
docker ai "Convert my Dockerfile to use multi-stage builds"

# Image size reduction
docker ai "How can I reduce the size of my todo-backend image?"

# Troubleshoot build issues
docker ai "Why is my Docker build failing?"
```

---

## Troubleshooting Cheat Sheet

Quick reference for common Kubernetes troubleshooting commands and their AI tool equivalents.

### Pod Issues

| Issue | kubectl Command | kubectl-ai Query |
|-------|----------------|------------------|
| List all pods | `kubectl get pods -n todo` | "show all pods in todo namespace" |
| Pod not running | `kubectl describe pod <name> -n todo` | "why is pod <name> not running?" |
| View pod logs | `kubectl logs <pod> -n todo` | "show logs for <pod>" |
| Previous container logs | `kubectl logs <pod> -n todo --previous` | "show previous logs for crashed <pod>" |
| Pod events | `kubectl get events -n todo --sort-by='.lastTimestamp'` | "show recent events in todo namespace" |

### Deployment Issues

| Issue | kubectl Command | kubectl-ai Query |
|-------|----------------|------------------|
| Deployment status | `kubectl rollout status deployment/<name> -n todo` | "what's the status of <name> deployment?" |
| Deployment history | `kubectl rollout history deployment/<name> -n todo` | "show rollout history for <name>" |
| Rollback deployment | `kubectl rollout undo deployment/<name> -n todo` | "rollback <name> deployment" |
| Scale deployment | `kubectl scale deployment/<name> --replicas=3 -n todo` | "scale <name> to 3 replicas" |

### Service Issues

| Issue | kubectl Command | kubectl-ai Query |
|-------|----------------|------------------|
| List services | `kubectl get svc -n todo` | "show all services in todo namespace" |
| Service endpoints | `kubectl get endpoints -n todo` | "show endpoints for services" |
| Test service connectivity | `kubectl run test --rm -it --image=busybox -- wget -qO- http://<svc>:<port>` | "test connectivity to <service>" |

### Resource Issues

| Issue | kubectl Command | kubectl-ai Query |
|-------|----------------|------------------|
| Resource usage | `kubectl top pods -n todo` | "show resource usage for pods" |
| Node resources | `kubectl top nodes` | "show node resource usage" |
| Describe resources | `kubectl describe node <name>` | "describe node <name>" |

### Configuration Issues

| Issue | kubectl Command | kubectl-ai Query |
|-------|----------------|------------------|
| View ConfigMap | `kubectl get configmap <name> -n todo -o yaml` | "show configmap <name> contents" |
| View Secret (encoded) | `kubectl get secret <name> -n todo -o yaml` | "show secret <name> structure" |
| Decode secret value | `kubectl get secret <name> -n todo -o jsonpath='{.data.<key>}' \| base64 -d` | "decode <key> from secret <name>" |

### Health Check Issues

| Issue | kubectl Command | kubectl-ai Query |
|-------|----------------|------------------|
| Check probe config | `kubectl describe pod <name> -n todo \| grep -A5 "Liveness\|Readiness"` | "show health probe config for <pod>" |
| Test health endpoint | `kubectl exec <pod> -n todo -- curl -s localhost:8000/health` | "test health endpoint in <pod>" |
| Watch pod restarts | `kubectl get pods -n todo -w` | "watch pod status changes" |

### Quick Diagnostic Commands

```bash
# Full cluster status overview
kubectl get all -n todo

# Check for problems across all resources
kubectl get events -n todo --sort-by='.lastTimestamp' | head -20

# Verify service DNS resolution
kubectl run test --rm -it --image=busybox -n todo -- nslookup todo-backend

# Check pod resource consumption
kubectl top pods -n todo --sort-by=memory

# Get pod IP addresses
kubectl get pods -n todo -o wide

# Check persistent volume claims
kubectl get pvc -n todo

# Verify secrets exist
kubectl get secrets -n todo

# Check configmaps
kubectl get configmaps -n todo
```

### AI-Assisted Debugging Workflow

1. **Identify the Problem**:
   ```bash
   kubectl-ai "what's wrong with my todo app deployment?"
   ```

2. **Get Detailed Information**:
   ```bash
   kubectl-ai "describe the failing pod and explain the issue"
   ```

3. **Check Logs**:
   ```bash
   kubectl-ai "show me error logs from the last hour"
   ```

4. **Get Recommendations**:
   ```bash
   kubectl-ai "how do I fix this issue?"
   ```

5. **Apply Fix with Confirmation**:
   ```bash
   kubectl-ai "apply the suggested fix"
   # Review the command before confirming
   ```

---

## Additional Resources

- [kubectl-ai GitHub Repository](https://github.com/GoogleCloudPlatform/kubectl-ai)
- [Kagent Documentation](https://github.com/kagent-dev/kagent)
- [Docker AI Documentation](https://docs.docker.com/ai/gordon)
- [Kubernetes Official Documentation](https://kubernetes.io/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)

---

## Notes

- All AI tools require API keys for their respective LLM providers
- kubectl-ai and kagent require kubectl to be configured with cluster access
- Docker AI requires Docker Desktop with Gordon enabled
- Always review AI-suggested commands before executing them in production
- These tools are meant to assist, not replace, understanding of Kubernetes concepts
