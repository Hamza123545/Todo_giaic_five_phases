#!/bin/bash
set -e

# Phase V - Azure (AKS) Deployment Script
# Comprehensive deployment script for Microsoft Azure

echo "🚀 Phase V: Deploying Todo Application to Azure AKS"
echo "===================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

command -v az >/dev/null 2>&1 || { echo -e "${RED}✗ Azure CLI not found. Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}✗ kubectl not found. Install: https://kubernetes.io/docs/tasks/tools/${NC}"; exit 1; }
command -v helm >/dev/null 2>&1 || { echo -e "${RED}✗ Helm not found. Install: https://helm.sh/docs/intro/install/${NC}"; exit 1; }
command -v dapr >/dev/null 2>&1 || { echo -e "${RED}✗ Dapr CLI not found. Install: https://docs.dapr.io/getting-started/install-dapr-cli/${NC}"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo -e "${RED}✗ Terraform not found. Install: https://www.terraform.io/downloads${NC}"; exit 1; }

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Check Azure login
echo -e "${BLUE}🔐 Checking Azure login...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to Azure. Please run: az login${NC}"
    exit 1
fi

# Get Azure subscription
export SUBSCRIPTION_ID=$(az account show --query id -o tsv)
export TENANT_ID=$(az account show --query tenantId -o tsv)
echo -e "${GREEN}✅ Logged in to Azure (Subscription: $SUBSCRIPTION_ID)${NC}"

# Set variables (customize as needed)
export RESOURCE_GROUP="${RESOURCE_GROUP:-todo-app-rg}"
export LOCATION="${LOCATION:-eastus}"
export CLUSTER_NAME="${CLUSTER_NAME:-todo-aks-cluster}"
export ACR_NAME="${ACR_NAME:-todoapp$(date +%s | sha256sum | head -c 8)}"
export KEY_VAULT_NAME="${KEY_VAULT_NAME:-todo-kv-$(date +%s | sha256sum | head -c 8)}"
export EVENT_HUBS_NAMESPACE="${EVENT_HUBS_NAMESPACE:-todo-events-$(date +%s | sha256sum | head -c 8)}"
export DB_SERVER_NAME="${DB_SERVER_NAME:-todo-postgres-$(date +%s | sha256sum | head -c 8)}"

echo ""
echo -e "${BLUE}📝 Configuration:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  AKS Cluster: $CLUSTER_NAME"
echo "  ACR: $ACR_NAME"
echo "  Key Vault: $KEY_VAULT_NAME"
echo "  Event Hubs: $EVENT_HUBS_NAMESPACE"
echo "  PostgreSQL: $DB_SERVER_NAME"
echo ""

read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Step 1: Create Resource Group
echo -e "${BLUE}📦 Step 1/12: Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION || echo "Resource group may already exist"
echo -e "${GREEN}✅ Resource group created${NC}"

# Step 2: Create ACR
echo -e "${BLUE}📦 Step 2/12: Creating Azure Container Registry...${NC}"
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true || echo "ACR may already exist"
echo -e "${GREEN}✅ ACR created${NC}"

# Step 3: Provision AKS with Terraform
echo -e "${BLUE}📦 Step 3/12: Provisioning AKS cluster with Terraform...${NC}"
cd phase-5/terraform/aks

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
resource_group_name = "$RESOURCE_GROUP"
location            = "$LOCATION"
cluster_name        = "$CLUSTER_NAME"
kubernetes_version  = "1.28.0"
node_count          = 2
vm_size             = "Standard_B2s"
os_disk_size_gb     = 50
EOF

terraform init
terraform apply -auto-approve
echo -e "${GREEN}✅ AKS cluster provisioned${NC}"

# Get kubeconfig
az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME --overwrite-existing

# Step 4: Attach ACR to AKS
echo -e "${BLUE}📦 Step 4/12: Attaching ACR to AKS...${NC}"
az aks update --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME --attach-acr $ACR_NAME
echo -e "${GREEN}✅ ACR attached${NC}"

# Step 5: Create PostgreSQL
echo -e "${BLUE}📦 Step 5/12: Creating Azure Database for PostgreSQL...${NC}"
export DB_ADMIN_USER="todoadmin"
export DB_ADMIN_PASSWORD="$(openssl rand -base64 32)"
export DB_NAME="todo"

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
  --public-access 0.0.0.0 || echo "PostgreSQL may already exist"

az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME || echo "Database may already exist"

export DATABASE_URL="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_SERVER_NAME}.postgres.database.azure.com:5432/${DB_NAME}?sslmode=require"
echo -e "${GREEN}✅ PostgreSQL created${NC}"

# Step 6: Create Event Hubs
echo -e "${BLUE}📦 Step 6/12: Creating Azure Event Hubs...${NC}"
az eventhubs namespace create \
  --resource-group $RESOURCE_GROUP \
  --name $EVENT_HUBS_NAMESPACE \
  --location $LOCATION \
  --sku Standard \
  --enable-kafka true || echo "Event Hubs namespace may already exist"

export EVENT_HUBS_CONNECTION_STRING=$(az eventhubs namespace authorization-rule keys list \
  --resource-group $RESOURCE_GROUP \
  --namespace-name $EVENT_HUBS_NAMESPACE \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv)

# Create Event Hubs
for topic in task-events reminders task-updates; do
  az eventhubs eventhub create \
    --resource-group $RESOURCE_GROUP \
    --namespace-name $EVENT_HUBS_NAMESPACE \
    --name $topic \
    --partition-count 12 \
    --message-retention 7 || echo "Event Hub $topic may already exist"
done

export KAFKA_BROKERS="${EVENT_HUBS_NAMESPACE}.servicebus.windows.net:9093"
echo -e "${GREEN}✅ Event Hubs created${NC}"

# Step 7: Create Key Vault
echo -e "${BLUE}📦 Step 7/12: Creating Azure Key Vault...${NC}"
az keyvault create \
  --resource-group $RESOURCE_GROUP \
  --name $KEY_VAULT_NAME \
  --location $LOCATION \
  --sku standard || echo "Key Vault may already exist"

# Store secrets
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "database-url" --value "$DATABASE_URL" || true
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "kafka-brokers" --value "$KAFKA_BROKERS" || true
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "event-hubs-connection-string" --value "$EVENT_HUBS_CONNECTION_STRING" || true

# Grant AKS access
export AKS_IDENTITY=$(az aks show --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME --query "identity.principalId" -o tsv)
az keyvault set-policy --name $KEY_VAULT_NAME --object-id $AKS_IDENTITY --secret-permissions get list || true
echo -e "${GREEN}✅ Key Vault created${NC}"

# Step 8: Install Dapr
echo -e "${BLUE}📦 Step 8/12: Installing Dapr on AKS...${NC}"
dapr init -k --runtime-version 1.12 --enable-ha=true --enable-mtls=true --wait
kubectl wait --for=condition=ready pod -l app=dapr-operator -n dapr-system --timeout=300s
echo -e "${GREEN}✅ Dapr installed${NC}"

# Step 9: Build and Push Docker Images
echo -e "${BLUE}📦 Step 9/12: Building and pushing Docker images...${NC}"
cd ../../..
export GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
export IMAGE_TAG="${GIT_SHA:-latest}"

az acr login --name $ACR_NAME

# Build and push images
for service in backend frontend; do
  echo "Building $service..."
  cd phase-5/$service
  docker build -t $ACR_NAME.azurecr.io/todo-$service:$IMAGE_TAG .
  docker build -t $ACR_NAME.azurecr.io/todo-$service:latest .
  docker push $ACR_NAME.azurecr.io/todo-$service:$IMAGE_TAG
  docker push $ACR_NAME.azurecr.io/todo-$service:latest
  cd ../..
done

# Build microservices
for service in recurring-task-service notification-service; do
  echo "Building $service..."
  cd phase-5/services/$service
  docker build -t $ACR_NAME.azurecr.io/$service:$IMAGE_TAG .
  docker build -t $ACR_NAME.azurecr.io/$service:latest .
  docker push $ACR_NAME.azurecr.io/$service:$IMAGE_TAG
  docker push $ACR_NAME.azurecr.io/$service:latest
  cd ../../..
done

echo -e "${GREEN}✅ Images built and pushed${NC}"

# Step 10: Create Kubernetes Secrets
echo -e "${BLUE}📦 Step 10/12: Creating Kubernetes secrets...${NC}"
kubectl create namespace todo-app || echo "Namespace may already exist"

kubectl create secret generic azure-keyvault-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=kafka-brokers="$KAFKA_BROKERS" \
  --from-literal=event-hubs-connection-string="$EVENT_HUBS_CONNECTION_STRING" \
  -n todo-app || kubectl create secret generic azure-keyvault-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=kafka-brokers="$KAFKA_BROKERS" \
  --from-literal=event-hubs-connection-string="$EVENT_HUBS_CONNECTION_STRING" \
  -n todo-app --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic kafka-credentials \
  --from-literal=username="\$ConnectionString" \
  --from-literal=password="$EVENT_HUBS_CONNECTION_STRING" \
  -n todo-app || kubectl create secret generic kafka-credentials \
  --from-literal=username="\$ConnectionString" \
  --from-literal=password="$EVENT_HUBS_CONNECTION_STRING" \
  -n todo-app --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✅ Secrets created${NC}"

# Step 11: Deploy Dapr Components
echo -e "${BLUE}📦 Step 11/12: Deploying Dapr components...${NC}"
cd phase-5

# Update Event Hubs component
sed "s/<EVENT_HUBS_NAMESPACE>/$EVENT_HUBS_NAMESPACE/g" \
  dapr/components/pubsub-azure-eventhubs.yaml | \
  kubectl apply -f - -n todo-app

# Apply other components
kubectl apply -f dapr/components/statestore-postgresql.yaml -n todo-app
kubectl apply -f dapr/components/jobs-scheduler.yaml -n todo-app

echo -e "${GREEN}✅ Dapr components deployed${NC}"

# Step 12: Deploy Application with Helm
echo -e "${BLUE}📦 Step 12/12: Deploying application with Helm...${NC}"
cd helm/todo-app

# Update values-aks.yaml
sed -i.bak "s|<ACR_NAME>|$ACR_NAME|g" values-aks.yaml
sed -i.bak "s|<AZURE_KEYVAULT_NAME>|$KEY_VAULT_NAME|g" values-aks.yaml

helm upgrade --install todo-app . \
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
  --create-namespace \
  --wait --timeout=10m

echo -e "${GREEN}✅ Application deployed${NC}"

# Summary
echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "Access Information:"
echo "-------------------"
echo "Resource Group: $RESOURCE_GROUP"
echo "AKS Cluster: $CLUSTER_NAME"
echo "ACR: $ACR_NAME.azurecr.io"
echo ""
echo "Get kubeconfig:"
echo "  az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME"
echo ""
echo "View pods:"
echo "  kubectl get pods -n todo-app"
echo ""
echo "View services:"
echo "  kubectl get services -n todo-app"
echo ""
echo "Port forward frontend:"
echo "  kubectl port-forward svc/frontend 3000:3000 -n todo-app"
echo ""
echo "Port forward backend:"
echo "  kubectl port-forward svc/backend 8000:8000 -n todo-app"
echo ""

