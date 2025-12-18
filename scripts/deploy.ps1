# ============================================================================
# One-Command Deployment Script for Todo App on Minikube (PowerShell)
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

$ErrorActionPreference = "Stop"

# Helper functions
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
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

# ============================================================================
# Step 1: Validate Prerequisites
# ============================================================================
Print-Header "Step 1: Validating Prerequisites"

if (-not (Test-CommandExists "minikube")) {
    Write-ColorOutput Red "❌ Error: minikube not found"
    Write-ColorOutput Yellow "Install minikube: https://minikube.sigs.k8s.io/docs/start/"
    exit 1
}
$minikubeVersion = (minikube version --short 2>$null)
Write-ColorOutput Green "✓ minikube found: $minikubeVersion"

if (-not (Test-CommandExists "helm")) {
    Write-ColorOutput Red "❌ Error: helm not found"
    Write-ColorOutput Yellow "Install helm: https://helm.sh/docs/intro/install/"
    exit 1
}
$helmVersion = (helm version --short 2>$null)
Write-ColorOutput Green "✓ helm found: $helmVersion"

if (-not (Test-CommandExists "docker")) {
    Write-ColorOutput Red "❌ Error: docker not found"
    Write-ColorOutput Yellow "Install docker: https://docs.docker.com/get-docker/"
    exit 1
}
$dockerVersion = (docker --version)
Write-ColorOutput Green "✓ docker found: $dockerVersion"

if (-not (Test-CommandExists "kubectl")) {
    Write-ColorOutput Red "❌ Error: kubectl not found"
    Write-ColorOutput Yellow "Install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
}
Write-ColorOutput Green "✓ kubectl found"

# ============================================================================
# Step 2: Start Minikube
# ============================================================================
Print-Header "Step 2: Starting Minikube"

$minikubeStatus = (minikube status 2>$null)
if ($LASTEXITCODE -eq 0) {
    Write-ColorOutput Green "✓ Minikube is already running"
} else {
    Write-ColorOutput Yellow "Starting Minikube..."
    minikube start
    Write-ColorOutput Green "✓ Minikube started successfully"
}

# ============================================================================
# Step 3: Configure Docker to Use Minikube Daemon
# ============================================================================
Print-Header "Step 3: Configuring Docker for Minikube"

Write-ColorOutput Yellow "Setting Docker environment variables..."
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Write-ColorOutput Green "✓ Docker configured to use Minikube daemon"

# ============================================================================
# Step 4: Build Docker Images
# ============================================================================
Print-Header "Step 4: Building Docker Images"

# Get project root from script location
$ScriptPath = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
$ProjectRoot = Split-Path -Parent $ScriptPath
$Phase4Path = Join-Path $ProjectRoot "phase-4"
$FrontendPath = Join-Path $Phase4Path "frontend"
$BackendPath = Join-Path $Phase4Path "backend"

# Verify paths exist
Write-ColorOutput Yellow "Script location: $ScriptPath"
Write-ColorOutput Yellow "Project root: $ProjectRoot"
Write-ColorOutput Yellow "Phase-4 path: $Phase4Path"
Write-ColorOutput Yellow "Frontend path: $FrontendPath"
Write-ColorOutput Yellow "Backend path: $BackendPath"

if (-not (Test-Path $Phase4Path)) {
    Write-ColorOutput Red "Error: phase-4 directory not found at $Phase4Path"
    Write-ColorOutput Yellow "Please ensure the phase-4 directory exists in the project root"
    exit 1
}

if (-not (Test-Path $FrontendPath)) {
    Write-ColorOutput Red "Error: frontend directory not found at $FrontendPath"
    exit 1
}

if (-not (Test-Path $BackendPath)) {
    Write-ColorOutput Red "Error: backend directory not found at $BackendPath"
    exit 1
}

# Build frontend image
Write-ColorOutput Yellow "Building frontend image..."
$FrontendDockerfile = Join-Path $FrontendPath "Dockerfile"
if (-not (Test-Path $FrontendDockerfile)) {
    Write-ColorOutput Red "Error: Dockerfile not found at $FrontendDockerfile"
    exit 1
}
Push-Location $FrontendPath
docker build -t todo-frontend:latest .
$FrontendBuildResult = $LASTEXITCODE
Pop-Location
if ($FrontendBuildResult -ne 0) {
    Write-ColorOutput Red "❌ Frontend build failed"
    exit 1
}
Write-ColorOutput Green "✓ Frontend image built: todo-frontend:latest"

# Build backend image
Write-ColorOutput Yellow "Building backend image..."
$BackendDockerfile = Join-Path $BackendPath "Dockerfile"
if (-not (Test-Path $BackendDockerfile)) {
    Write-ColorOutput Red "Error: Dockerfile not found at $BackendDockerfile"
    exit 1
}
Push-Location $BackendPath
docker build -t todo-backend:latest .
$BackendBuildResult = $LASTEXITCODE
Pop-Location
if ($BackendBuildResult -ne 0) {
    Write-ColorOutput Red "❌ Backend build failed"
    exit 1
}
Write-ColorOutput Green "✓ Backend image built: todo-backend:latest"

# Verify images
Write-ColorOutput Yellow "Verifying built images..."
docker images | Select-String "todo-"
Write-ColorOutput Green "✓ Images verified"

# ============================================================================
# Step 4.5: Load Environment Variables from .env Files
# ============================================================================
Print-Header "Step 4.5: Loading Environment Variables"

# Function to parse .env file
function Read-EnvFile {
    param([string]$FilePath)

    $envVars = @{}
    if (Test-Path $FilePath) {
        Write-ColorOutput Yellow "Reading: $FilePath"
        Get-Content $FilePath | ForEach-Object {
            $line = $_.Trim()
            # Skip comments and empty lines
            if ($line -and -not $line.StartsWith('#')) {
                $parts = $line -split '=', 2
                if ($parts.Count -eq 2) {
                    $key = $parts[0].Trim()
                    $value = $parts[1].Trim()
                    # Remove quotes if present
                    $value = $value.Trim('"', "'")
                    $envVars[$key] = $value
                }
            }
        }
    }
    return $envVars
}

# Read backend .env file
$BackendEnvFile = Join-Path $BackendPath ".env"
$backendEnv = Read-EnvFile -FilePath $BackendEnvFile

# Read frontend .env file
$FrontendEnvFile = Join-Path $FrontendPath ".env"
$frontendEnv = Read-EnvFile -FilePath $FrontendEnvFile

# Merge environment variables (backend takes precedence)
$mergedEnv = $frontendEnv + $backendEnv

# Set required environment variables if not already set
if (-not $env:DATABASE_URL -and $mergedEnv.ContainsKey("DATABASE_URL")) {
    $env:DATABASE_URL = $mergedEnv["DATABASE_URL"]
    Write-ColorOutput Green "✓ Loaded DATABASE_URL from .env"
}

if (-not $env:BETTER_AUTH_SECRET -and $mergedEnv.ContainsKey("BETTER_AUTH_SECRET")) {
    $env:BETTER_AUTH_SECRET = $mergedEnv["BETTER_AUTH_SECRET"]
    Write-ColorOutput Green "✓ Loaded BETTER_AUTH_SECRET from .env"
}

if (-not $env:LLM_PROVIDER -and $mergedEnv.ContainsKey("LLM_PROVIDER")) {
    $env:LLM_PROVIDER = $mergedEnv["LLM_PROVIDER"]
    Write-ColorOutput Green "✓ Loaded LLM_PROVIDER from .env: $env:LLM_PROVIDER"
}

# Load API key based on LLM provider
if (-not $env:LLM_PROVIDER -and $mergedEnv.ContainsKey("LLM_PROVIDER")) {
    $env:LLM_PROVIDER = $mergedEnv["LLM_PROVIDER"]
}
$llmProvider = if ($env:LLM_PROVIDER) { $env:LLM_PROVIDER } else { "openai" }

# Load appropriate API key based on provider
if ($llmProvider.ToLower() -eq "openrouter") {
    if (-not $env:OPENAI_API_KEY -and $mergedEnv.ContainsKey("OPENROUTER_API_KEY")) {
        $env:OPENAI_API_KEY = $mergedEnv["OPENROUTER_API_KEY"]
        Write-ColorOutput Green "✓ Loaded OPENROUTER_API_KEY from .env (using as OPENAI_API_KEY)"
    }
}
elseif ($llmProvider.ToLower() -eq "gemini") {
    if (-not $env:OPENAI_API_KEY -and $mergedEnv.ContainsKey("GEMINI_API_KEY")) {
        $env:OPENAI_API_KEY = $mergedEnv["GEMINI_API_KEY"]
        Write-ColorOutput Green "✓ Loaded GEMINI_API_KEY from .env (using as OPENAI_API_KEY)"
    }
}
else {
    if (-not $env:OPENAI_API_KEY -and $mergedEnv.ContainsKey("OPENAI_API_KEY")) {
        $env:OPENAI_API_KEY = $mergedEnv["OPENAI_API_KEY"]
        Write-ColorOutput Green "✓ Loaded OPENAI_API_KEY from .env"
    }
}

# ============================================================================
# Step 5: Install/Upgrade Helm Chart
# ============================================================================
Print-Header "Step 5: Installing/Upgrading Helm Chart"

# Verify required environment variables are set
if (-not $env:DATABASE_URL -or -not $env:BETTER_AUTH_SECRET -or -not $env:OPENAI_API_KEY) {
    Write-ColorOutput Red "❌ Error: Required environment variables not set"
    Write-ColorOutput Yellow "Missing variables:"
    if (-not $env:DATABASE_URL) { Write-Output "  - DATABASE_URL" }
    if (-not $env:BETTER_AUTH_SECRET) { Write-Output "  - BETTER_AUTH_SECRET" }
    if (-not $env:OPENAI_API_KEY) { Write-Output "  - OPENAI_API_KEY (or OPENROUTER_API_KEY/GEMINI_API_KEY based on LLM_PROVIDER)" }
    Write-Output ""
    Write-ColorOutput Yellow "Please ensure these variables are set in:"
    Write-ColorOutput Yellow "  - $BackendEnvFile"
    Write-ColorOutput Yellow "  - $FrontendEnvFile"
    Write-ColorOutput Yellow "Or set them manually as environment variables"
    exit 1
}

Write-ColorOutput Yellow "Installing/upgrading todo-app Helm chart..."

$llmProvider = if ($env:LLM_PROVIDER) { $env:LLM_PROVIDER } else { "openai" }

helm upgrade --install todo-app ./k8s/todo-app `
    --create-namespace `
    --namespace todo `
    --set secrets.databaseUrl="$env:DATABASE_URL" `
    --set secrets.betterAuthSecret="$env:BETTER_AUTH_SECRET" `
    --set secrets.openaiApiKey="$env:OPENAI_API_KEY" `
    --set secrets.llmProvider="$llmProvider" `
    --wait `
    --timeout 10m

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Helm installation failed"
    exit 1
}
Write-ColorOutput Green "✓ Helm chart installed/upgraded successfully"

# ============================================================================
# Step 6: Wait for Pods to be Ready
# ============================================================================
Print-Header "Step 6: Waiting for Pods to be Ready"

Write-ColorOutput Yellow "Waiting for all pods to be ready (timeout: 120s)..."
kubectl wait --for=condition=ready pod `
    -l app.kubernetes.io/instance=todo-app `
    -n todo `
    --timeout=120s

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Timeout waiting for pods to be ready"
    Write-ColorOutput Yellow "Check pod status with: kubectl get pods -n todo"
    Write-ColorOutput Yellow "Check pod logs with: kubectl logs -n todo PODNAME"
    exit 1
}
Write-ColorOutput Green "✓ All pods are ready"

# ============================================================================
# Step 7: Display Access URLs and Status
# ============================================================================
Print-Header "Step 7: Deployment Complete!"

$MinikubeIP = (minikube ip)

Write-ColorOutput Green "Todo App deployed successfully!"
Write-Output ""
Write-ColorOutput Blue "Access URLs:"
Write-ColorOutput Green "  Frontend:  http://$MinikubeIP:30300"
Write-ColorOutput Green "  Backend:   http://todo-app-backend.todo.svc.cluster.local:8000 (internal)"
Write-Output ""
Write-ColorOutput Blue "Useful Commands:"
Write-Output "  View all resources:    kubectl get all -n todo"
Write-Output "  View pods:             kubectl get pods -n todo"
Write-Output "  View services:         kubectl get svc -n todo"
Write-Output "  View logs (frontend):  kubectl logs -n todo -l app=todo-frontend"
Write-Output "  View logs (backend):   kubectl logs -n todo -l app=todo-backend"
Write-Output "  Open frontend:         minikube service todo-app-frontend -n todo"
Write-Output "  Port forward backend:  kubectl port-forward -n todo svc/todo-app-backend 8000:8000"
Write-Output ""
Write-ColorOutput Blue "To uninstall:"
Write-Output "  helm uninstall todo-app -n todo"
Write-Output "  kubectl delete namespace todo"
Write-Output ""
Write-ColorOutput Green "[OK] Deployment completed successfully at $(Get-Date)"
