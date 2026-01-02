#!/bin/bash
set -e

# Phase V - Deployment Verification Script
# Verifies Grafana, Dapr, Kubernetes, Helm, and Kafka

echo "🔍 Phase V: Verifying Deployment Components"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get Minikube IP (if using Minikube)
MINIKUBE_IP=$(minikube ip 2>/dev/null || echo "localhost")

echo ""
echo -e "${BLUE}=== 1. KUBERNETES VERIFICATION ===${NC}"
echo ""

# Check kubectl
if command -v kubectl &> /dev/null; then
    echo -e "${GREEN}✓ kubectl is installed${NC}"
    kubectl version --client --short
else
    echo -e "${RED}✗ kubectl is not installed${NC}"
    exit 1
fi

# Check cluster connection
if kubectl cluster-info &> /dev/null; then
    echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}"
    kubectl cluster-info | head -1
else
    echo -e "${RED}✗ Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

# Check all pods
echo ""
echo "Pod Status:"
kubectl get pods -o wide

# Check services
echo ""
echo "Services:"
kubectl get services

# Check namespaces
echo ""
echo "Namespaces:"
kubectl get namespaces

echo ""
echo -e "${BLUE}=== 2. HELM VERIFICATION ===${NC}"
echo ""

# Check Helm
if command -v helm &> /dev/null; then
    echo -e "${GREEN}✓ Helm is installed${NC}"
    helm version --short
else
    echo -e "${RED}✗ Helm is not installed${NC}"
    exit 1
fi

# List Helm releases
echo ""
echo "Helm Releases:"
helm list

# Check Helm repos
echo ""
echo "Helm Repositories:"
helm repo list

echo ""
echo -e "${BLUE}=== 3. DAPR VERIFICATION ===${NC}"
echo ""

# Check Dapr CLI
if command -v dapr &> /dev/null; then
    echo -e "${GREEN}✓ Dapr CLI is installed${NC}"
    dapr --version
else
    echo -e "${YELLOW}⚠ Dapr CLI is not installed (optional)${NC}"
fi

# Check Dapr system pods
echo ""
echo "Dapr System Pods:"
kubectl get pods -n dapr-system -o wide || echo "Dapr system namespace not found"

# Check Dapr components
echo ""
echo "Dapr Components:"
kubectl get components -A || echo "No Dapr components found"

# Check Dapr configurations
echo ""
echo "Dapr Configurations:"
kubectl get configurations -A || echo "No Dapr configurations found"

# Check Dapr sidecars
echo ""
echo "Pods with Dapr Sidecars:"
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}' | grep daprd || echo "No Dapr sidecars found"

# Dapr Dashboard access
echo ""
echo -e "${YELLOW}To access Dapr Dashboard, run:${NC}"
echo "  dapr dashboard -k"
echo "  Then visit: http://localhost:8080"

echo ""
echo -e "${BLUE}=== 4. KAFKA VERIFICATION ===${NC}"
echo ""

# Check Kafka pods
echo "Kafka Pods:"
kubectl get pods -l app.kubernetes.io/name=kafka -o wide || echo "Kafka pods not found"

# Check Kafka service
echo ""
echo "Kafka Service:"
kubectl get svc -l app.kubernetes.io/name=kafka || echo "Kafka service not found"

# List Kafka topics
echo ""
echo "Kafka Topics:"
KAFKA_POD=$(kubectl get pods -l app.kubernetes.io/name=kafka -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$KAFKA_POD" ]; then
    echo "Using Kafka pod: $KAFKA_POD"
    kubectl exec "$KAFKA_POD" -- kafka-topics.sh --bootstrap-server localhost:9092 --list 2>/dev/null || echo "Could not list topics"
else
    echo "Kafka pod not found"
fi

# Check Kafka Helm release
echo ""
echo "Kafka Helm Release:"
helm list | grep kafka || echo "Kafka Helm release not found"

# Kafka connection test
echo ""
echo "Testing Kafka Connection:"
if [ -n "$KAFKA_POD" ]; then
    kubectl exec "$KAFKA_POD" -- kafka-broker-api-versions.sh --bootstrap-server localhost:9092 --version 2>/dev/null && \
        echo -e "${GREEN}✓ Kafka is responding${NC}" || \
        echo -e "${RED}✗ Kafka is not responding${NC}"
else
    echo "Cannot test Kafka connection (pod not found)"
fi

echo ""
echo -e "${BLUE}=== 5. GRAFANA VERIFICATION ===${NC}"
echo ""

# Check Grafana pods
echo "Grafana Pods:"
kubectl get pods -l app.kubernetes.io/name=grafana -o wide || echo "Grafana pods not found"

# Check Grafana service
echo ""
echo "Grafana Service:"
kubectl get svc -l app.kubernetes.io/name=grafana || echo "Grafana service not found"

# Check Grafana Helm release
echo ""
echo "Grafana Helm Release:"
helm list | grep prometheus || echo "Prometheus/Grafana Helm release not found"

# Grafana access
echo ""
echo -e "${YELLOW}Grafana Access:${NC}"
GRAFANA_NODEPORT=$(kubectl get svc -l app.kubernetes.io/name=grafana -o jsonpath='{.items[0].spec.ports[?(@.name=="http")].nodePort}' 2>/dev/null)
if [ -n "$GRAFANA_NODEPORT" ]; then
    echo "  NodePort: http://${MINIKUBE_IP}:${GRAFANA_NODEPORT}"
    echo "  Username: admin"
    echo "  Password: admin"
    echo ""
    echo "  Or use port-forward:"
    echo "  kubectl port-forward svc/grafana 30000:3000"
    echo "  Then visit: http://localhost:30000"
else
    echo "  Grafana service not found or NodePort not configured"
    echo "  Try: kubectl port-forward svc/grafana 30000:3000"
fi

echo ""
echo -e "${BLUE}=== 6. PROMETHEUS VERIFICATION ===${NC}"
echo ""

# Check Prometheus pods
echo "Prometheus Pods:"
kubectl get pods -l app.kubernetes.io/name=prometheus -o wide || echo "Prometheus pods not found"

# Prometheus access
echo ""
echo -e "${YELLOW}Prometheus Access:${NC}"
PROMETHEUS_NODEPORT=$(kubectl get svc -l app.kubernetes.io/name=prometheus -o jsonpath='{.items[0].spec.ports[?(@.name=="http")].nodePort}' 2>/dev/null)
if [ -n "$PROMETHEUS_NODEPORT" ]; then
    echo "  NodePort: http://${MINIKUBE_IP}:${PROMETHEUS_NODEPORT}"
    echo ""
    echo "  Or use port-forward:"
    echo "  kubectl port-forward svc/prometheus 30090:9090"
    echo "  Then visit: http://localhost:30090"
else
    echo "  Prometheus service not found or NodePort not configured"
    echo "  Try: kubectl port-forward svc/prometheus 30090:9090"
fi

echo ""
echo -e "${BLUE}=== 7. ZIPKIN VERIFICATION ===${NC}"
echo ""

# Check Zipkin pods
echo "Zipkin Pods:"
kubectl get pods -l app=zipkin -o wide || echo "Zipkin pods not found"

# Zipkin access
echo ""
echo -e "${YELLOW}Zipkin Access:${NC}"
ZIPKIN_NODEPORT=$(kubectl get svc -l app=zipkin -o jsonpath='{.items[0].spec.ports[?(@.name=="http")].nodePort}' 2>/dev/null)
if [ -n "$ZIPKIN_NODEPORT" ]; then
    echo "  NodePort: http://${MINIKUBE_IP}:${ZIPKIN_NODEPORT}"
    echo ""
    echo "  Or use port-forward:"
    echo "  kubectl port-forward svc/zipkin 30001:9411"
    echo "  Then visit: http://localhost:30001"
else
    echo "  Zipkin service not found or NodePort not configured"
    echo "  Try: kubectl port-forward svc/zipkin 30001:9411"
fi

echo ""
echo -e "${BLUE}=== 8. APPLICATION VERIFICATION ===${NC}"
echo ""

# Check application pods
echo "Application Pods:"
kubectl get pods -l app=backend -o wide || echo "Backend pods not found"
kubectl get pods -l app=frontend -o wide || echo "Frontend pods not found"
kubectl get pods -l app=recurring-task-service -o wide || echo "Recurring task service pods not found"
kubectl get pods -l app=notification-service -o wide || echo "Notification service pods not found"

# Check application services
echo ""
echo "Application Services:"
kubectl get svc -l app=backend || echo "Backend service not found"
kubectl get svc -l app=frontend || echo "Frontend service not found"

echo ""
echo -e "${GREEN}=== VERIFICATION SUMMARY ===${NC}"
echo ""
echo "Quick Access Commands:"
echo "---------------------"
echo "📊 Grafana:    kubectl port-forward svc/grafana 30000:3000"
echo "📈 Prometheus: kubectl port-forward svc/prometheus 30090:9090"
echo "🔍 Zipkin:     kubectl port-forward svc/zipkin 30001:9411"
echo "🎛️  Dapr:       dapr dashboard -k"
echo "🌐 Frontend:    kubectl port-forward svc/frontend 3000:3000"
echo "🔧 Backend:     kubectl port-forward svc/backend 8000:8000"
echo ""
echo "Useful Commands:"
echo "----------------"
echo "• View all pods:        kubectl get pods -A"
echo "• View logs:            kubectl logs -f <pod-name>"
echo "• Describe pod:         kubectl describe pod <pod-name>"
echo "• Check events:         kubectl get events --sort-by='.lastTimestamp'"
echo "• Restart pod:          kubectl delete pod <pod-name>"
echo "• Check Dapr:           kubectl get components -A"
echo "• Check Helm releases:  helm list"
echo "• Kafka topics:         kubectl exec <kafka-pod> -- kafka-topics.sh --bootstrap-server localhost:9092 --list"
echo ""

