# Complete Azure Deployment Guide - Phase-5 Todo App

**Version**: 1.0.0  
**Last Updated**: 2025-12-31  
**Target**: Microsoft Azure (AKS - Azure Kubernetes Service)

This comprehensive guide covers deploying the Phase-5 Todo App on Microsoft Azure, including AKS, Azure Container Registry (ACR), Azure Event Hubs (Kafka), Azure Key Vault, Azure Database for PostgreSQL, and all monitoring components.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Docker Image Building](#docker-image-building)
5. [Kubernetes & Helm Configuration](#kubernetes--helm-configuration)
6. [Kafka/Event Hubs Setup](#kafkaevent-hubs-setup)
7. [Dapr Configuration](#dapr-configuration)
8. [Monitoring & Observability](#monitoring--observability)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Troubleshooting](#troubleshooting)
11. [Cost Optimization](#cost-optimization)

---

## Prerequisites

### Required Tools

```bash
# Install Azure CLI
# Windows (PowerShell)
Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi
Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'

# macOS
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Install kubectl
# Windows (via Chocolatey)
choco install kubernetes-cli

# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
# Windows (via Chocolatey)
choco install kubernetes-helm

# macOS
brew install helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Dapr CLI
# Windows (PowerShell)
powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"

# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash

# Install Terraform
# Windows (via Chocolatey)
choco install terraform

# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### Azure Account Setup

1. **Create Azure Account**
   - Sign up at https://azure.microsoft.com/free/
   - Free tier includes: $200 credit, 12 months free services

2. **Install Azure CLI and Login**
   ```bash
   az login
   az account list
   az account set --subscription "<subscription-id>"
   ```

3. **Set Default Resource Group and Location**
   ```bash
   export RESOURCE_GROUP="todo-app-rg"
   export LOCATION="eastus"  # or westus2, westeurope, etc.
   ```

### Required Azure Services

- **Azure Kubernetes Service (AKS)** - Managed Kubernetes
- **Azure Container Registry (ACR)** - Docker image storage
- **Azure Event Hubs** - Kafka-compatible messaging (or Confluent Cloud)
- **Azure Database for PostgreSQL** - Managed PostgreSQL
- **Azure Key Vault** - Secrets management
- **Azure Monitor** - Logging and metrics
- **Azure Application Gateway** - Ingress/Load Balancer (optional)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Azure Cloud                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Azure Kubernetes Service (AKS)               │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Frontend   │  │   Backend    │  │  Recurring   │   │  │
│  │  │   (Next.js)  │  │  (FastAPI)   │  │Task Service  │   │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │  │
│  │         │                 │                  │            │  │
│  │         └─────────────────┼──────────────────┘          │  │
│  │                           │                               │  │
│  │                    ┌──────▼───────┐                       │  │
│  │                    │  Dapr Sidecar │                       │  │
│  │                    └──────┬───────┘                       │  │
│  │                           │                               │  │
│  │  ┌────────────────────────┼──────────────────────────┐   │  │
│  │  │  Notification Service  │                          │   │  │
│  │  └────────────────────────┘                          │   │  │
│  └───────────────────────┬──────────────────────────────┘   │  │
│                          │                                    │
│  ┌───────────────────────┼──────────────────────────────┐   │
│  │    Azure Event Hubs (Kafka API)                       │   │
│  │    Topics: task-events, reminders, task-updates        │   │
│  └───────────────────────┼──────────────────────────────┘   │
│                          │                                    │
│  ┌───────────────────────┼──────────────────────────────┐   │
│  │    Azure Database for PostgreSQL                      │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │    Azure Key Vault (Secrets)                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │    Azure Container Registry (ACR)                        │  │
│  │    Images: backend, frontend, services                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Deployment

### Step 1: Create Azure Resource Group

```bash
# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Verify
az group show --name $RESOURCE_GROUP
```

### Step 2: Create Azure Container Registry (ACR)

```bash
# Set ACR name (must be globally unique)
export ACR_NAME="todoapp$(date +%s | sha256sum | head -c 8)"

# Create ACR
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Get ACR login credentials
export ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
export ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# Login to ACR
az acr login --name $ACR_NAME

# Verify
az acr repository list --name $ACR_NAME
```

### Step 3: Provision AKS Cluster with Terraform

```bash
cd phase-5/terraform/aks

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
resource_group_name = "$RESOURCE_GROUP"
location            = "$LOCATION"
cluster_name        = "todo-aks-cluster"
kubernetes_version  = "1.28.0"
node_count          = 2
vm_size             = "Standard_B2s"  # 2 vCPUs, 4GB RAM
os_disk_size_gb     = 50
EOF

# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply infrastructure (creates AKS cluster)
terraform apply -auto-approve

# Get kubeconfig
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name todo-aks-cluster \
  --overwrite-existing

# Verify cluster access
kubectl cluster-info
kubectl get nodes
```

**Expected Output:**
```
NAME                                STATUS   ROLES   AGE   VERSION
aks-default-12345678-vmss000000     Ready    agent   2m    v1.28.0
aks-default-12345678-vmss000001     Ready    agent   2m    v1.28.0
```

### Step 4: Attach ACR to AKS

```bash
# Attach ACR to AKS (enables AKS to pull images from ACR)
az aks update \
  --resource-group $RESOURCE_GROUP \
  --name todo-aks-cluster \
  --attach-acr $ACR_NAME

# Verify
az aks show \
  --resource-group $RESOURCE_GROUP \
  --name todo-aks-cluster \
  --query "servicePrincipalProfile"
```

### Step 5: Create Azure Database for PostgreSQL

```bash
# Set database variables
export DB_SERVER_NAME="todo-postgres-$(date +%s | sha256sum | head -c 8)"
export DB_ADMIN_USER="todoadmin"
export DB_ADMIN_PASSWORD="$(openssl rand -base64 32)"  # Generate secure password
export DB_NAME="todo"

# Create PostgreSQL server (Basic tier for dev, GeneralPurpose for prod)
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password $DB_ADMIN_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME

# Get connection string
export DATABASE_URL="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_SERVER_NAME}.postgres.database.azure.com:5432/${DB_NAME}?sslmode=require"

# Allow AKS to access database (get AKS outbound IPs)
export AKS_OUTBOUND_IPS=$(az aks show \
  --resource-group $RESOURCE_GROUP \
  --name todo-aks-cluster \
  --query "networkProfile.loadBalancerProfile.effectiveOutboundIPs[].id" -o tsv)

# Add firewall rule (if needed)
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name AllowAKS \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255
```

### Step 6: Create Azure Event Hubs (Kafka)

```bash
# Set Event Hubs variables
export EVENT_HUBS_NAMESPACE="todo-events-$(date +%s | sha256sum | head -c 8)"

# Create Event Hubs namespace (Kafka enabled)
az eventhubs namespace create \
  --resource-group $RESOURCE_GROUP \
  --name $EVENT_HUBS_NAMESPACE \
  --location $LOCATION \
  --sku Standard \
  --enable-kafka true

# Get connection string
export EVENT_HUBS_CONNECTION_STRING=$(az eventhubs namespace authorization-rule keys list \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $EVENT_HUBS_NAMESPACE \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv)

# Create Event Hubs (topics)
az eventhubs eventhub create \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $EVENT_HUBS_NAMESPACE \
  --name task-events \
  --partition-count 12 \
  --message-retention 7

az eventhubs eventhub create \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $EVENT_HUBS_NAMESPACE \
  --name reminders \
  --partition-count 12 \
  --message-retention 7

az eventhubs eventhub create \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $EVENT_HUBS_NAMESPACE \
  --name task-updates \
  --partition-count 12 \
  --message-retention 7

# Get Event Hubs broker URL
export KAFKA_BROKERS="${EVENT_HUBS_NAMESPACE}.servicebus.windows.net:9093"
```

**Alternative: Use Confluent Cloud (Managed Kafka)**
```bash
# If using Confluent Cloud instead of Event Hubs
# Sign up at https://www.confluent.io/confluent-cloud/
# Create cluster and get bootstrap servers
export KAFKA_BROKERS="<confluent-bootstrap-servers>"
export KAFKA_API_KEY="<api-key>"
export KAFKA_API_SECRET="<api-secret>"
```

### Step 7: Create Azure Key Vault

```bash
# Set Key Vault name (must be globally unique)
export KEY_VAULT_NAME="todo-kv-$(date +%s | sha256sum | head -c 8)"

# Create Key Vault
az keyvault create \
  --resource-group $RESOURCE_GROUP \
  --name $KEY_VAULT_NAME \
  --location $LOCATION \
  --sku standard

# Store secrets in Key Vault
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "database-url" \
  --value "$DATABASE_URL"

az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "kafka-brokers" \
  --value "$KAFKA_BROKERS"

az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "event-hubs-connection-string" \
  --value "$EVENT_HUBS_CONNECTION_STRING"

# Get AKS managed identity (for Key Vault access)
export AKS_IDENTITY=$(az aks show \
  --resource-group $RESOURCE_GROUP \
  --name todo-aks-cluster \
  --query "identity.principalId" -o tsv)

# Grant AKS access to Key Vault
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --object-id $AKS_IDENTITY \
  --secret-permissions get list
```

### Step 8: Install Dapr on AKS

```bash
# Install Dapr with mTLS enabled (production)
dapr init -k \
  --runtime-version 1.12 \
  --enable-ha=true \
  --enable-mtls=true \
  --wait

# Verify Dapr installation
kubectl get pods -n dapr-system

# Expected pods:
# - dapr-operator-*
# - dapr-placement-server-*
# - dapr-sentry-*
# - dapr-sidecar-injector-*

# Check Dapr status
dapr status -k
```

---

## Docker Image Building

### Step 9: Build and Push Docker Images

```bash
# Set image tags
export GIT_SHA=$(git rev-parse --short HEAD)
export IMAGE_TAG="${GIT_SHA:-latest}"

# Navigate to project root
cd phase-5

# Build Backend Image
cd backend
docker build -t $ACR_NAME.azurecr.io/todo-backend:$IMAGE_TAG .
docker build -t $ACR_NAME.azurecr.io/todo-backend:latest .
docker push $ACR_NAME.azurecr.io/todo-backend:$IMAGE_TAG
docker push $ACR_NAME.azurecr.io/todo-backend:latest

# Build Frontend Image
cd ../frontend
docker build -t $ACR_NAME.azurecr.io/todo-frontend:$IMAGE_TAG .
docker build -t $ACR_NAME.azurecr.io/todo-frontend:latest .
docker push $ACR_NAME.azurecr.io/todo-frontend:$IMAGE_TAG
docker push $ACR_NAME.azurecr.io/todo-frontend:latest

# Build Recurring Task Service
cd ../services/recurring-task-service
docker build -t $ACR_NAME.azurecr.io/recurring-task-service:$IMAGE_TAG .
docker build -t $ACR_NAME.azurecr.io/recurring-task-service:latest .
docker push $ACR_NAME.azurecr.io/recurring-task-service:$IMAGE_TAG
docker push $ACR_NAME.azurecr.io/recurring-task-service:latest

# Build Notification Service
cd ../notification-service
docker build -t $ACR_NAME.azurecr.io/notification-service:$IMAGE_TAG .
docker build -t $ACR_NAME.azurecr.io/notification-service:latest .
docker push $ACR_NAME.azurecr.io/notification-service:$IMAGE_TAG
docker push $ACR_NAME.azurecr.io/notification-service:latest

# Verify images in ACR
az acr repository list --name $ACR_NAME
az acr repository show-tags --name $ACR_NAME --repository todo-backend
```

### Dockerfile Overview

**Backend Dockerfile** (`phase-5/backend/Dockerfile`):
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile** (`phase-5/frontend/Dockerfile`):
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
CMD ["npm", "start"]
```

---

## Kubernetes & Helm Configuration

### Step 10: Create Kubernetes Secrets

```bash
# Create namespace
kubectl create namespace todo-app

# Create secret for database (from Key Vault or directly)
kubectl create secret generic azure-keyvault-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=kafka-brokers="$KAFKA_BROKERS" \
  --from-literal=event-hubs-connection-string="$EVENT_HUBS_CONNECTION_STRING" \
  -n todo-app

# For Event Hubs SASL authentication
kubectl create secret generic kafka-credentials \
  --from-literal=username="\$ConnectionString" \
  --from-literal=password="$EVENT_HUBS_CONNECTION_STRING" \
  -n todo-app
```

### Step 11: Configure Dapr Components for Azure

Create `phase-5/dapr/components/pubsub-azure-eventhubs.yaml`:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
  namespace: todo-app
spec:
  type: pubsub.kafka
  version: v1
  metadata:
    - name: brokers
      value: "<EVENT_HUBS_NAMESPACE>.servicebus.windows.net:9093"
    - name: authType
      value: "sasl_ssl"
    - name: saslUsername
      secretKeyRef:
        name: kafka-credentials
        key: username
    - name: saslPassword
      secretKeyRef:
        name: kafka-credentials
        key: password
    - name: saslMechanism
      value: "PLAIN"
    - name: consumerGroup
      value: "phase5-consumer-group"
    - name: clientId
      value: "phase5-client"
    - name: maxMessageBytes
      value: "1048576"
    - name: enableIdempotence
      value: "true"
    - name: acks
      value: "all"
    - name: compressionType
      value: "snappy"
    - name: partitionScheme
      value: "hash"
scopes:
  - backend
  - recurring-task-service
  - notification-service
```

Apply Dapr components:

```bash
# Update pubsub component with Azure Event Hubs
sed "s/<EVENT_HUBS_NAMESPACE>/$EVENT_HUBS_NAMESPACE/g" \
  phase-5/dapr/components/pubsub-azure-eventhubs.yaml | \
  kubectl apply -f -

# Apply other Dapr components
kubectl apply -f phase-5/dapr/components/statestore-postgresql.yaml
kubectl apply -f phase-5/dapr/components/jobs-scheduler.yaml

# Create Dapr secret store for Azure Key Vault
kubectl apply -f phase-5/dapr/components/secretstore-azure-keyvault.yaml

# Verify components
kubectl get components -n todo-app
```

### Step 12: Deploy Application with Helm

```bash
# Update Helm values for AKS
cd phase-5/helm/todo-app

# Update values-aks.yaml with your ACR name
sed -i "s/<ACR_NAME>/$ACR_NAME/g" values-aks.yaml
sed -i "s/<AZURE_KEYVAULT_NAME>/$KEY_VAULT_NAME/g" values-aks.yaml

# Install application
helm install todo-app . \
  -f values-aks.yaml \
  --set backend.image.repository=$ACR_NAME.azurecr.io/todo-backend \
  --set frontend.image.repository=$ACR_NAME.azurecr.io/todo-frontend \
  --set recurringTaskService.image.repository=$ACR_NAME.azurecr.io/recurring-task-service \
  --set notificationService.image.repository=$ACR_NAME.azurecr.io/notification-service \
  --set backend.image.tag=$IMAGE_TAG \
  --set frontend.image.tag=$IMAGE_TAG \
  --set recurringTaskService.image.tag=$IMAGE_TAG \
  --set notificationService.image.tag=$IMAGE_TAG \
  --namespace todo-app \
  --create-namespace

# Wait for deployment
kubectl wait --for=condition=available \
  --timeout=300s \
  deployment/backend \
  deployment/frontend \
  deployment/recurring-task-service \
  deployment/notification-service \
  -n todo-app

# Check pod status
kubectl get pods -n todo-app
kubectl get services -n todo-app
```

### Step 13: Configure Ingress (Optional)

```bash
# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

# Get Load Balancer IP
kubectl get service ingress-nginx-controller -n ingress-nginx

# Create Ingress resource
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: todo-app-ingress
  namespace: todo-app
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - todo-aks.example.com
      secretName: todo-aks-tls
  rules:
    - host: todo-aks.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
EOF
```

---

## Kafka/Event Hubs Setup

### Event Hubs Configuration

**Connection Details:**
- **Broker URL**: `<namespace>.servicebus.windows.net:9093`
- **Authentication**: SASL_SSL with connection string
- **Topics**: `task-events`, `reminders`, `task-updates`
- **Partitions**: 12 per topic (for user_id partitioning)

**Verify Event Hubs:**
```bash
# List Event Hubs
az eventhubs eventhub list \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $EVENT_HUBS_NAMESPACE

# Get Event Hub details
az eventhubs eventhub show \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $EVENT_HUBS_NAMESPACE \
  --name task-events
```

---

## Dapr Configuration

### Dapr Components Summary

1. **Pub/Sub (Kafka/Event Hubs)**: `pubsub-azure-eventhubs.yaml`
2. **State Store (PostgreSQL)**: `statestore-postgresql.yaml`
3. **Secrets (Azure Key Vault)**: `secretstore-azure-keyvault.yaml`
4. **Jobs Scheduler**: `jobs-scheduler.yaml`

### Verify Dapr

```bash
# Check Dapr components
kubectl get components -n todo-app

# Check Dapr sidecars
kubectl get pods -n todo-app -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}' | grep daprd

# Test Dapr health
kubectl exec -it <backend-pod> -n todo-app -- curl http://localhost:3500/v1.0/healthz
```

---

## Monitoring & Observability

### Step 14: Deploy Monitoring Stack

```bash
# Install Prometheus and Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin \
  --set grafana.service.type=LoadBalancer

# Install Zipkin
kubectl apply -f phase-5/monitoring/zipkin/zipkin-production.yaml -n monitoring

# Get Grafana Load Balancer IP
kubectl get service prometheus-grafana -n monitoring

# Access Grafana
# URL: http://<load-balancer-ip>
# Username: admin
# Password: admin
```

### Azure Monitor Integration

```bash
# Enable Azure Monitor for AKS
az aks enable-addons \
  --resource-group $RESOURCE_GROUP \
  --name todo-aks-cluster \
  --addons monitoring

# View logs in Azure Portal
# Navigate to: AKS Cluster → Insights → Logs
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy-azure.yml`:

```yaml
name: Deploy to Azure AKS

on:
  push:
    branches: [main]

env:
  AZURE_RESOURCE_GROUP: todo-app-rg
  AKS_CLUSTER_NAME: todo-aks-cluster
  ACR_NAME: ${{ secrets.ACR_NAME }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Build and Push Images
        run: |
          az acr build --registry $ACR_NAME --image todo-backend:${{ github.sha }} ./phase-5/backend
          az acr build --registry $ACR_NAME --image todo-frontend:${{ github.sha }} ./phase-5/frontend
      
      - name: Deploy to AKS
        run: |
          az aks get-credentials --resource-group $AZURE_RESOURCE_GROUP --name $AKS_CLUSTER_NAME
          helm upgrade --install todo-app ./phase-5/helm/todo-app \
            -f ./phase-5/helm/todo-app/values-aks.yaml \
            --set backend.image.tag=${{ github.sha }} \
            --set frontend.image.tag=${{ github.sha }}
```

---

## Troubleshooting

### Common Issues

**1. Pods Not Starting**
```bash
kubectl describe pod <pod-name> -n todo-app
kubectl logs <pod-name> -n todo-app
```

**2. Image Pull Errors**
```bash
# Verify ACR attachment
az aks show --resource-group $RESOURCE_GROUP --name todo-aks-cluster --query "servicePrincipalProfile"

# Check ACR credentials
az acr credential show --name $ACR_NAME
```

**3. Dapr Sidecar Issues**
```bash
kubectl logs <pod-name> -c daprd -n todo-app
dapr status -k
```

**4. Event Hubs Connection**
```bash
# Test Event Hubs connection
kubectl exec -it <backend-pod> -n todo-app -- \
  curl -X POST http://localhost:3500/v1.0/publish/kafka-pubsub/task-events \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## Cost Optimization

### Azure Cost Estimates (Monthly)

- **AKS Cluster (2 nodes, Standard_B2s)**: ~$60-80
- **ACR (Basic)**: ~$5
- **Azure Database for PostgreSQL (Basic)**: ~$30-50
- **Event Hubs (Standard)**: ~$10-20
- **Key Vault (Standard)**: ~$0.15 per 10,000 operations
- **Azure Monitor**: ~$2-5
- **Total**: ~$110-165/month

### Cost Reduction Tips

1. Use **Spot Instances** for non-production
2. **Scale down** during off-hours
3. Use **Azure Database Basic tier** for dev
4. **Delete unused resources**
5. Use **Reserved Instances** for production (1-3 year commitment)

---

## Quick Reference Commands

```bash
# Get all resources
az resource list --resource-group $RESOURCE_GROUP

# View AKS cluster
az aks show --resource-group $RESOURCE_GROUP --name todo-aks-cluster

# Scale AKS nodes
az aks scale --resource-group $RESOURCE_GROUP --name todo-aks-cluster --node-count 3

# View logs
kubectl logs -f deployment/backend -n todo-app

# Restart deployment
kubectl rollout restart deployment/backend -n todo-app

# Delete everything (CAUTION)
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

---

## Next Steps

1. ✅ Verify all pods are running
2. ✅ Test application endpoints
3. ✅ Configure custom domain and TLS
4. ✅ Set up monitoring alerts
5. ✅ Configure backup strategy
6. ✅ Document runbooks
7. ✅ Set up CI/CD pipeline

---

For more details, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - General deployment guide
- [MONITORING.md](./MONITORING.md) - Monitoring setup
- [RUNBOOK.md](./RUNBOOK.md) - Operations runbook

