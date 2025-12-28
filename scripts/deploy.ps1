# ============================================================================
# One-Command Deployment Script for Todo App on Minikube (PowerShell)
# ============================================================================
# This script automates the entire deployment workflow:
# 1. Validates prerequisites (minikube, kubectl, docker)
# 2. Starts Minikube if not running
# 3. Configures Docker to use Minikube's daemon
# 4. Generates required lock files (uv.lock)
# 5. Builds Docker images in Minikube context
# 6. Creates Kubernetes namespace and secrets
# 7. Deploys frontend and backend with kubectl
# 8. Waits for pods to be ready
# 9. Displays access URLs
# ============================================================================

$ErrorActionPreference = "Stop"

# ============================================================================
# Helper Functions
# ============================================================================
function Write-ColorOutput($ForegroundColor, [string]$Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

function Print-Header($Message) {
    Write-Output ""
    Write-ColorOutput Blue "============================================================================"
    Write-ColorOutput Blue $Message
    Write-ColorOutput Blue "============================================================================"
}

function Test-CommandExists($Command) {
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Read-EnvFile {
    param([string]$FilePath)

    $envVars = @{}
    if (Test-Path $FilePath) {
        Write-ColorOutput Yellow "Reading: $FilePath"
        Get-Content $FilePath | ForEach-Object {
            $line = $_.Trim()
            if ($line -and -not $line.StartsWith('#')) {
                $parts = $line -split '=', 2
                if ($parts.Count -eq 2) {
                    $key = $parts[0].Trim()
                    $value = $parts[1].Trim().Trim('"', "'")
                    $envVars[$key] = $value
                }
            }
        }
    }
    return $envVars
}

# ============================================================================
# Step 1: Validate Prerequisites
# ============================================================================
Print-Header "Step 1: Validating Prerequisites"

$requiredTools = @("minikube", "kubectl", "docker")
foreach ($tool in $requiredTools) {
    if (Test-CommandExists $tool) {
        Write-ColorOutput Green "✓ $tool found"
    } else {
        Write-ColorOutput Red "❌ Error: $tool not found"
        exit 1
    }
}

# ============================================================================
# Step 2: Setup Project Paths
# ============================================================================
Print-Header "Step 2: Setting Up Paths"

$ScriptPath = $PSScriptRoot
if (-not $ScriptPath) {
    $ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
}
$ProjectRoot = Split-Path -Parent $ScriptPath
$Phase4Path = Join-Path $ProjectRoot "phase-4"
$FrontendPath = Join-Path $Phase4Path "frontend"
$BackendPath = Join-Path $Phase4Path "backend"

Write-ColorOutput Yellow "Project Root: $ProjectRoot"
Write-ColorOutput Yellow "Frontend Path: $FrontendPath"
Write-ColorOutput Yellow "Backend Path: $BackendPath"

# Verify paths exist
if (-not (Test-Path $FrontendPath)) {
    Write-ColorOutput Red "❌ Error: frontend directory not found"
    exit 1
}
if (-not (Test-Path $BackendPath)) {
    Write-ColorOutput Red "❌ Error: backend directory not found"
    exit 1
}

# ============================================================================
# Step 3: Start Minikube
# ============================================================================
Print-Header "Step 3: Starting Minikube"

minikube status 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "✓ Minikube is already running"
} else {
    Write-ColorOutput Yellow "Starting Minikube..."
    minikube start
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Failed to start Minikube"
        exit 1
    }
    Write-ColorOutput Green "✓ Minikube started successfully"
}

# ============================================================================
# Step 4: Configure Docker for Minikube
# ============================================================================
Print-Header "Step 4: Configuring Docker for Minikube"

Write-ColorOutput Yellow "Setting Docker environment..."
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Write-ColorOutput Green "✓ Docker configured for Minikube"

# ============================================================================
# Step 5: Generate Lock Files
# ============================================================================
Print-Header "Step 5: Generating Dependency Lock Files"

Push-Location $BackendPath
Write-ColorOutput Yellow "Generating uv.lock for backend..."
uv lock 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "✓ uv.lock generated"
} else {
    Write-ColorOutput Red "❌ Failed to generate uv.lock"
    Pop-Location
    exit 1
}
Pop-Location

# ============================================================================
# Step 6: Build Docker Images
# ============================================================================
Print-Header "Step 6: Building Docker Images"

# Build Frontend
Write-ColorOutput Yellow "Building frontend image..."
Push-Location $FrontendPath
docker build -t todo-frontend:latest .
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Frontend build failed"
    Pop-Location
    exit 1
}
Pop-Location
Write-ColorOutput Green "✓ Frontend image built: todo-frontend:latest"

# Build Backend
Write-ColorOutput Yellow "Building backend image..."
Push-Location $BackendPath
docker build -t todo-backend:latest .
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Backend build failed"
    Pop-Location
    exit 1
}
Pop-Location
Write-ColorOutput Green "✓ Backend image built: todo-backend:latest"

# ============================================================================
# Step 7: Load Environment Variables
# ============================================================================
Print-Header "Step 7: Loading Environment Variables"

$BackendEnvFile = Join-Path $BackendPath ".env"
$FrontendEnvFile = Join-Path $FrontendPath ".env"

$backendEnv = Read-EnvFile -FilePath $BackendEnvFile
$frontendEnv = Read-EnvFile -FilePath $FrontendEnvFile

# Merge environment variables (backend takes precedence)
$mergedEnv = $frontendEnv + $backendEnv

# Verify required variables
Write-ColorOutput Yellow "Verifying required environment variables..."
$required = @("DATABASE_URL", "BETTER_AUTH_SECRET", "OPENAI_API_KEY")
$missing = @()

foreach ($var in $required) {
    if ($mergedEnv.ContainsKey($var)) {
        Write-ColorOutput Green "✓ $var loaded"
    } else {
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-ColorOutput Red "❌ Error: Missing required environment variables"
    foreach ($var in $missing) {
        Write-ColorOutput Red "  - $var"
    }
    exit 1
}

# ============================================================================
# Step 8: Deploy with Kubernetes
# ============================================================================
Print-Header "Step 8: Deploying to Kubernetes"

# Create namespace
Write-ColorOutput Yellow "Creating namespace 'todo'..."
kubectl create namespace todo --dry-run=client -o yaml | kubectl apply -f -
Write-ColorOutput Green "✓ Namespace created/verified"

# Create secret
Write-ColorOutput Yellow "Creating Kubernetes secret with environment variables..."
kubectl create secret generic todo-secrets `
    --from-literal=database-url=$($mergedEnv["DATABASE_URL"]) `
    --from-literal=better-auth-secret=$($mergedEnv["BETTER_AUTH_SECRET"]) `
    --from-literal=openai-api-key=$($mergedEnv["OPENAI_API_KEY"]) `
    --namespace=todo `
    --dry-run=client -o yaml | kubectl apply -f -
Write-ColorOutput Green "✓ Secret created/verified"

# Deploy Frontend
Write-ColorOutput Yellow "Deploying frontend..."
$FrontendDeployment = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-frontend
  namespace: todo
  labels:
    app: todo-frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: todo-frontend
  template:
    metadata:
      labels:
        app: todo-frontend
    spec:
      containers:
      - name: frontend
        image: todo-frontend:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "http://todo-backend.todo.svc.cluster.local:8000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: todo-frontend
  namespace: todo
  labels:
    app: todo-frontend
spec:
  type: NodePort
  ports:
  - port: 3000
    targetPort: 3000
    nodePort: 30300
  selector:
    app: todo-frontend
"@

$FrontendDeployment | kubectl apply -f -
Write-ColorOutput Green "✓ Frontend deployment created/verified"

# Deploy Backend
Write-ColorOutput Yellow "Deploying backend..."
$BackendDeployment = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-backend
  namespace: todo
  labels:
    app: todo-backend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: todo-backend
  template:
    metadata:
      labels:
        app: todo-backend
    spec:
      containers:
      - name: backend
        image: todo-backend:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: database-url
        - name: BETTER_AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: better-auth-secret
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: todo-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: todo-backend
  namespace: todo
  labels:
    app: todo-backend
spec:
  type: ClusterIP
  ports:
  - port: 8000
    targetPort: 8000
  selector:
    app: todo-backend
"@

$BackendDeployment | kubectl apply -f -
Write-ColorOutput Green "✓ Backend deployment created/verified"

# ============================================================================
# Step 9: Wait for Pods
# ============================================================================
Print-Header "Step 9: Waiting for Pods to Be Ready"

Write-ColorOutput Yellow "Waiting for frontend pod..."
kubectl wait --for=condition=ready pod `
    -l app=todo-frontend `
    -n todo `
    --timeout=120s 2>$null
Write-ColorOutput Green "✓ Frontend pod is ready"

Write-ColorOutput Yellow "Waiting for backend pod..."
kubectl wait --for=condition=ready pod `
    -l app=todo-backend `
    -n todo `
    --timeout=120s 2>$null
Write-ColorOutput Green "✓ Backend pod is ready"

# ============================================================================
# Step 10: Display Access Information
# ============================================================================
Print-Header "Step 10: Deployment Complete!"

Write-Host ""
Write-ColorOutput Green "✓ Todo App deployed successfully!"
Write-Host ""

Write-ColorOutput Cyan "Access Information:"
$MinikubeIP = minikube ip
Write-ColorOutput Green "Frontend URL: http://$($MinikubeIP):30300"
Write-ColorOutput Green "Backend Internal: http://todo-backend.todo.svc.cluster.local:8000"

Write-Host ""
Write-ColorOutput Cyan "Useful Commands:"
Write-Output "  View pods:              kubectl get pods -n todo"
Write-Output "  View services:          kubectl get svc -n todo"
Write-Output "  View frontend logs:     kubectl logs -n todo -l app=todo-frontend -f"
Write-Output "  View backend logs:      kubectl logs -n todo -l app=todo-backend -f"
Write-Output "  Describe pod:           kubectl describe pod -n todo <pod-name>"
Write-Output "  Port forward backend:   kubectl port-forward -n todo svc/todo-backend 8000:8000"

Write-Host ""
Write-ColorOutput Cyan "To remove deployment:"
Write-Output "  kubectl delete namespace todo"

Write-Host ""
Write-ColorOutput Green "[OK] Deployment completed successfully at $(Get-Date)"
