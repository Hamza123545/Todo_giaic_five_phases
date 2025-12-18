# Quickstart: Deployment Verification Scenarios

**Feature**: Kubernetes Deployment with Minikube and Helm
**Created**: 2025-12-18
**Purpose**: Step-by-step verification scenarios for testing deployment

---

## Prerequisites

Before starting verification, ensure:
- [ ] Minikube installed and running: `minikube version`
- [ ] Helm 3.x installed: `helm version`
- [ ] Docker installed: `docker version`
- [ ] kubectl installed: `kubectl version --client`

---

## Scenario 1: Initial Deployment (P1)

**Objective**: Verify basic deployment of frontend and backend to Minikube

**Steps**:

1. **Start Minikube** (if not running):
   ```bash
   minikube start
   ```

2. **Configure Docker to use Minikube daemon**:
   ```bash
   eval $(minikube docker-env)
   ```

   Verify configuration:
   ```bash
   docker ps  # Should show Minikube containers
   ```

3. **Build Docker images** (in Minikube context):
   ```bash
   cd frontend
   docker build -t todo-frontend:latest .
   cd ../backend
   docker build -t todo-backend:latest .
   ```

   Verify images:
   ```bash
   docker images | grep todo
   # Expected: todo-frontend:latest and todo-backend:latest
   ```

4. **Create namespace**:
   ```bash
   kubectl create namespace todo
   ```

5. **Install Helm chart**:
   ```bash
   helm install todo-app ./k8s/todo-app \
     --namespace todo \
     --set secrets.databaseUrl="postgresql://user:pass@neon.tech:5432/db" \
     --set secrets.betterAuthSecret="test-secret" \
     --set secrets.openaiApiKey="sk-test-key" \
     --wait \
     --timeout 10m
   ```

6. **Verify deployments**:
   ```bash
   kubectl get deployments -n todo
   # Expected: todo-frontend and todo-backend with READY 2/2
   ```

7. **Verify pods**:
   ```bash
   kubectl get pods -n todo
   # Expected: 4 pods total (2 frontend, 2 backend), all Running
   ```

8. **Check pod readiness** (should complete within 2 minutes):
   ```bash
   kubectl wait --for=condition=ready pod \
     -l app.kubernetes.io/instance=todo-app \
     -n todo \
     --timeout=120s
   ```

9. **Verify services**:
   ```bash
   kubectl get services -n todo
   # Expected:
   # - todo-frontend (NodePort, port 3000:30300)
   # - todo-backend (ClusterIP, port 8000)
   ```

10. **Access frontend**:
    ```bash
    # Get Minikube IP
    minikube ip
    # Open browser: http://<minikube-ip>:30300
    # Or use: minikube service todo-frontend -n todo
    ```

11. **Verify frontend loads** (should load within 5 seconds):
    - Browser should show login page
    - No console errors
    - Network tab shows successful API calls

**Success Criteria**:
- ✅ All pods reach Ready state within 2 minutes
- ✅ Frontend accessible via NodePort
- ✅ Frontend loads within 5 seconds
- ✅ No pod restarts or errors in logs

---

## Scenario 2: Health Monitoring and Auto-Recovery (P2)

**Objective**: Verify health probes detect failures and trigger restarts

**Steps**:

1. **Verify health probe configuration**:
   ```bash
   kubectl describe pod -n todo -l app=todo-backend | grep -A 5 "Liveness"
   kubectl describe pod -n todo -l app=todo-backend | grep -A 5 "Readiness"
   ```

2. **Test liveness probe failure** (simulate unresponsive application):
   ```bash
   # Get a backend pod name
   BACKEND_POD=$(kubectl get pods -n todo -l app=todo-backend -o jsonpath='{.items[0].metadata.name}')

   # Simulate failure (exec into pod and kill process)
   kubectl exec -n todo $BACKEND_POD -- kill 1
   ```

3. **Observe pod restart**:
   ```bash
   kubectl get pods -n todo -l app=todo-backend -w
   # Expected: Pod should restart within 30 seconds
   ```

4. **Verify restart counter**:
   ```bash
   kubectl get pods -n todo -l app=todo-backend
   # Expected: RESTARTS column should show 1
   ```

5. **Test readiness probe** (verify database connectivity check):
   ```bash
   # Check readiness probe endpoint directly
   kubectl exec -n todo $BACKEND_POD -- curl -f http://localhost:8000/ready
   # Expected: HTTP 200 if database connection healthy
   ```

6. **Verify traffic routing during failure**:
   ```bash
   # While one pod is restarting, verify service still responds
   kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
     curl http://todo-backend.todo.svc.cluster.local:8000/health
   # Expected: Success (traffic routed to healthy pods)
   ```

**Success Criteria**:
- ✅ Liveness probe restarts failed pods within 30 seconds
- ✅ Readiness probe prevents traffic to unhealthy pods
- ✅ Service remains available during pod restarts
- ✅ Pods show liveness/readiness configurations in describe output

---

## Scenario 3: Configuration Management (P3)

**Objective**: Verify secrets are secure and configuration is manageable

**Steps**:

1. **Verify ConfigMap**:
   ```bash
   kubectl get configmap todo-app-config -n todo -o yaml
   # Expected: Contains BACKEND_URL, LOG_LEVEL, etc. (non-sensitive)
   ```

2. **Verify Secret**:
   ```bash
   kubectl get secret todo-app-secrets -n todo -o yaml
   # Expected: Contains DATABASE_URL, BETTER_AUTH_SECRET, etc. (base64 encoded)
   ```

3. **Confirm secrets not in plaintext**:
   ```bash
   kubectl describe pod -n todo -l app=todo-backend | grep -i "database"
   # Expected: Should NOT show plaintext credentials
   ```

4. **Verify environment variable injection**:
   ```bash
   BACKEND_POD=$(kubectl get pods -n todo -l app=todo-backend -o jsonpath='{.items[0].metadata.name}')
   kubectl exec -n todo $BACKEND_POD -- env | grep DATABASE_URL
   # Expected: Shows DATABASE_URL value (injected from Secret)
   ```

5. **Test configuration update without rebuild**:
   ```bash
   # Update ConfigMap
   kubectl patch configmap todo-app-config -n todo \
     --type merge -p '{"data":{"LOG_LEVEL":"debug"}}'

   # Restart pods to pick up new config
   kubectl rollout restart deployment todo-backend -n todo

   # Verify new value
   kubectl exec -n todo $(kubectl get pods -n todo -l app=todo-backend -o jsonpath='{.items[0].metadata.name}') \
     -- env | grep LOG_LEVEL
   # Expected: Shows "debug"
   ```

6. **Verify no secrets in logs**:
   ```bash
   kubectl logs -n todo -l app=todo-backend --tail=100 | grep -i "secret\|password\|api.*key"
   # Expected: No plaintext credentials in logs
   ```

**Success Criteria**:
- ✅ Secrets base64 encoded, not visible in pod describe
- ✅ Environment variables correctly injected from ConfigMap and Secret
- ✅ Configuration updates possible without image rebuild
- ✅ No plaintext secrets in logs or pod specifications

---

## Scenario 4: End-to-End Functionality (P1)

**Objective**: Verify all Phase 3 features work in Kubernetes deployment

**Steps**:

1. **Access frontend**:
   ```bash
   minikube service todo-frontend -n todo
   # Opens browser to frontend
   ```

2. **Test user authentication**:
   - Sign up with new user
   - Sign in with credentials
   - Verify JWT token issued (check browser DevTools → Application → Cookies)

3. **Test task CRUD operations**:
   - Create new task via UI
   - Verify task appears in list
   - Mark task complete
   - Edit task title
   - Delete task

4. **Test AI chatbot**:
   - Navigate to chat interface
   - Send message: "Add a task to buy groceries"
   - Verify chatbot responds and task is created
   - Send message: "Show me all my tasks"
   - Verify chatbot lists tasks

5. **Verify data persistence**:
   ```bash
   # Restart all pods
   kubectl rollout restart deployment -n todo

   # Wait for pods to be ready
   kubectl wait --for=condition=ready pod -n todo --all --timeout=120s

   # Login again and verify tasks still exist
   ```

6. **Verify database connectivity**:
   ```bash
   # Check backend logs for database connections
   kubectl logs -n todo -l app=todo-backend --tail=50 | grep -i "database\|postgres"
   # Expected: Successful database connection logs
   ```

**Success Criteria**:
- ✅ User can login and receive JWT token
- ✅ All task CRUD operations work
- ✅ AI chatbot creates and lists tasks via natural language
- ✅ Data persists across pod restarts
- ✅ Backend successfully connects to external Neon database

---

## Scenario 5: Horizontal Scaling (P1)

**Objective**: Verify application supports multiple replicas

**Steps**:

1. **Verify current replicas**:
   ```bash
   kubectl get deployments -n todo
   # Expected: frontend and backend both show 2/2 replicas
   ```

2. **Scale up frontend**:
   ```bash
   kubectl scale deployment todo-frontend -n todo --replicas=3
   ```

3. **Verify scaling**:
   ```bash
   kubectl get pods -n todo -l app=todo-frontend
   # Expected: 3 pods, all Running
   ```

4. **Test load distribution**:
   ```bash
   # Make requests and observe different pod names in responses
   for i in {1..5}; do
     kubectl run -it --rm debug-$i --image=curlimages/curl --restart=Never -- \
       curl -s http://todo-frontend.todo.svc.cluster.local:3000/api/health | head -1
   done
   # Expected: Requests distributed across all frontend pods
   ```

5. **Scale down to 1 replica**:
   ```bash
   kubectl scale deployment todo-backend -n todo --replicas=1
   kubectl get pods -n todo -l app=todo-backend
   # Expected: Only 1 backend pod running
   ```

6. **Verify application still works with 1 replica**:
   - Test task creation via UI
   - Verify chatbot responds
   - Expected: All functionality works

7. **Scale back to 2 replicas**:
   ```bash
   kubectl scale deployment todo-backend -n todo --replicas=2
   ```

**Success Criteria**:
- ✅ Application scales to 3 replicas successfully
- ✅ Load distributed across multiple pods
- ✅ Application functions correctly with 1 replica
- ✅ Scaling operations complete without errors

---

## Scenario 6: One-Command Deployment (P5)

**Objective**: Verify automated deployment script works end-to-end

**Steps**:

1. **Clean up existing deployment**:
   ```bash
   helm uninstall todo-app -n todo
   kubectl delete namespace todo
   minikube stop
   ```

2. **Run deployment script**:
   ```bash
   time ./deploy.sh
   # Script should complete in under 10 minutes
   ```

3. **Verify script output**:
   - Should show prerequisite checks
   - Should show image build progress
   - Should show Helm install progress
   - Should display frontend and backend URLs

4. **Verify deployment result**:
   ```bash
   kubectl get all -n todo
   # Expected: All resources created and running
   ```

5. **Access application**:
   - Use URLs from script output
   - Verify frontend accessible

6. **Test idempotency** (run script again):
   ```bash
   ./deploy.sh
   # Expected: Script runs successfully, updates existing deployment
   ```

**Success Criteria**:
- ✅ Script completes in under 10 minutes on fresh cluster
- ✅ All resources created correctly
- ✅ Frontend and backend accessible after script completes
- ✅ Script is idempotent (safe to run multiple times)
- ✅ Clear error messages on failure

---

## Debugging Commands

If verification fails, use these debugging commands:

**Check pod status**:
```bash
kubectl get pods -n todo
kubectl describe pod <pod-name> -n todo
kubectl logs <pod-name> -n todo
kubectl logs <pod-name> -n todo --previous  # Previous container logs
```

**Check events**:
```bash
kubectl get events -n todo --sort-by='.lastTimestamp'
```

**Check resource usage**:
```bash
kubectl top pods -n todo
kubectl top nodes
```

**Exec into pod for debugging**:
```bash
kubectl exec -it <pod-name> -n todo -- /bin/sh
```

**Port forward for direct access**:
```bash
kubectl port-forward -n todo deployment/todo-backend 8000:8000
# Access backend at http://localhost:8000
```

**Check service endpoints**:
```bash
kubectl get endpoints -n todo
# Verify services have pod IPs listed
```

---

## Cleanup

To remove all resources:
```bash
helm uninstall todo-app -n todo
kubectl delete namespace todo
minikube stop  # Optional: stop cluster
minikube delete  # Optional: delete cluster completely
```

---

## Summary

Verification scenarios cover:
- ✅ Initial deployment (P1)
- ✅ Health monitoring and auto-recovery (P2)
- ✅ Secure configuration management (P3)
- ✅ End-to-end functionality (P1)
- ✅ Horizontal scaling (P1)
- ✅ One-command deployment automation (P5)

All scenarios map to user stories and success criteria from spec.md. Follow these scenarios during implementation and testing to ensure Phase IV requirements are met.
