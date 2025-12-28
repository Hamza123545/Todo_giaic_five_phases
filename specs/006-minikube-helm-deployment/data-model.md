# Phase 1: Kubernetes Resource Data Models

**Feature**: Kubernetes Deployment with Minikube and Helm
**Created**: 2025-12-18
**Status**: Complete

## Overview

This document defines the Kubernetes resource models that represent the deployment infrastructure. These resources are templated in Helm charts and instantiated during deployment.

---

## Kubernetes Resource Models

### 1. Deployment (Frontend)

**Resource Type**: `apps/v1/Deployment`
**Purpose**: Manages frontend (Next.js) pod replicas with rolling updates

**Key Attributes**:
```yaml
metadata:
  name: todo-frontend
  labels:
    app: todo-frontend
    component: frontend
    tier: presentation

spec:
  replicas: 2  # Configurable via Helm values
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
        - name: BACKEND_URL
          valueFrom:
            configMapKeyRef:
              name: todo-app-config
              key: BACKEND_URL
        - name: NEXT_PUBLIC_API_URL
          valueFrom:
            configMapKeyRef:
              name: todo-app-config
              key: BACKEND_URL

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

        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

**State Transitions**:
- Pending → Running: Pods scheduled and containers starting
- Running → Terminating: Deployment scaled down or updated
- Failed → Running: Liveness probe triggers restart

**Validation Rules**:
- `replicas >= 1` (at least one pod)
- `image` must reference locally built image
- Health probe endpoints must be implemented in application

---

### 2. Deployment (Backend)

**Resource Type**: `apps/v1/Deployment`
**Purpose**: Manages backend (FastAPI + AI agents) pod replicas

**Key Attributes**:
```yaml
metadata:
  name: todo-backend
  labels:
    app: todo-backend
    component: backend
    tier: application

spec:
  replicas: 2
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
        - name: BETTER_AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: todo-app-secrets
              key: BETTER_AUTH_SECRET
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: todo-app-secrets
              key: OPENAI_API_KEY
        - name: LLM_PROVIDER
          valueFrom:
            secretKeyRef:
              name: todo-app-secrets
              key: LLM_PROVIDER

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

        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

**Validation Rules**:
- All secret keys must exist in Secret resource
- Database URL must be valid PostgreSQL connection string
- Readiness probe verifies database connectivity

---

### 3. Service (Frontend)

**Resource Type**: `v1/Service`
**Purpose**: Exposes frontend via NodePort for external access

**Key Attributes**:
```yaml
metadata:
  name: todo-frontend
  labels:
    app: todo-frontend

spec:
  type: NodePort
  selector:
    app: todo-frontend
  ports:
  - name: http
    port: 3000
    targetPort: 3000
    nodePort: 30300
```

**Relationships**:
- Selects pods with label `app=todo-frontend`
- Routes traffic to container port 3000
- Exposes on host port 30300 (accessible via `http://localhost:30300`)

**Validation Rules**:
- `nodePort` must be in range 30000-32767
- Selector must match Deployment pod labels

---

### 4. Service (Backend)

**Resource Type**: `v1/Service`
**Purpose**: Exposes backend internally via ClusterIP

**Key Attributes**:
```yaml
metadata:
  name: todo-backend
  labels:
    app: todo-backend

spec:
  type: ClusterIP
  selector:
    app: todo-backend
  ports:
  - name: http
    port: 8000
    targetPort: 8000
```

**Relationships**:
- Selects pods with label `app=todo-backend`
- Creates DNS entry `todo-backend.todo.svc.cluster.local`
- Accessible from frontend pods via `http://todo-backend:8000`

**Validation Rules**:
- Type must be ClusterIP (internal only)
- Selector must match Deployment pod labels

---

### 5. ConfigMap

**Resource Type**: `v1/ConfigMap`
**Purpose**: Stores non-sensitive configuration values

**Key Attributes**:
```yaml
metadata:
  name: todo-app-config
  labels:
    app: todo-app

data:
  BACKEND_URL: "http://todo-backend:8000"
  FRONTEND_URL: "http://localhost:30300"
  LOG_LEVEL: "info"
  NODE_ENV: "production"
```

**Usage Pattern**:
- Injected into pods as environment variables via `configMapKeyRef`
- Can be updated independently of pod deployment
- Updates require pod restart to take effect

**Validation Rules**:
- All keys must be valid environment variable names (uppercase, underscores)
- Values must be strings

---

### 6. Secret

**Resource Type**: `v1/Secret`
**Purpose**: Stores sensitive credentials and API keys

**Key Attributes**:
```yaml
metadata:
  name: todo-app-secrets
  labels:
    app: todo-app

type: Opaque

stringData:  # Auto-converted to base64
  DATABASE_URL: "postgresql://user:pass@neon.tech:5432/todo_db"
  BETTER_AUTH_SECRET: "your-secret-key-here"
  OPENAI_API_KEY: "sk-..."
  LLM_PROVIDER: "openai"
  GEMINI_API_KEY: ""  # Optional
```

**Usage Pattern**:
- Injected into backend pods via `secretKeyRef`
- Base64 encoded automatically when using `stringData`
- Never logged or displayed in pod describe output

**Validation Rules**:
- `DATABASE_URL` must be valid PostgreSQL connection string
- `BETTER_AUTH_SECRET` must be non-empty
- `OPENAI_API_KEY` or `GEMINI_API_KEY` must be set depending on `LLM_PROVIDER`

**Security Requirements**:
- Never commit actual secrets to git
- Use placeholder values in templates
- Inject real values via `helm install --set` or separate values file
- Consider using Sealed Secrets or external secret manager for production

---

## Helm Chart Structure

### Chart.yaml
```yaml
apiVersion: v2
name: todo-app
description: Todo Chatbot application deployment for Minikube
version: 1.0.0
appVersion: "3.0.0"  # Phase 3 application version
```

### values.yaml
```yaml
# Replica counts
frontend:
  replicas: 2
  image: todo-frontend:latest
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"

backend:
  replicas: 2
  image: todo-backend:latest
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "1000m"

# Service configuration
service:
  frontend:
    type: NodePort
    port: 3000
    nodePort: 30300
  backend:
    type: ClusterIP
    port: 8000

# ConfigMap values (non-sensitive)
config:
  backendUrl: "http://todo-backend:8000"
  frontendUrl: "http://localhost:30300"
  logLevel: "info"
  nodeEnv: "production"

# Secret values (sensitive - override at install time)
secrets:
  databaseUrl: "PLACEHOLDER"
  betterAuthSecret: "PLACEHOLDER"
  openaiApiKey: "PLACEHOLDER"
  llmProvider: "openai"
  geminiApiKey: ""
```

**Overriding Values at Install Time**:
```bash
helm install todo-app ./k8s/todo-app \
  --set secrets.databaseUrl="postgresql://..." \
  --set secrets.betterAuthSecret="actual-secret" \
  --set secrets.openaiApiKey="sk-actual-key"
```

---

## Resource Relationships

```
┌─────────────────────────────────────────────────────────┐
│                     Minikube Cluster                    │
│                                                         │
│  ┌──────────────┐          ┌──────────────┐            │
│  │ ConfigMap    │          │ Secret       │            │
│  │ (non-sensitive)│        │ (sensitive)  │            │
│  └──────┬───────┘          └──────┬───────┘            │
│         │                         │                    │
│         ▼                         ▼                    │
│  ┌──────────────────────────────────────────┐          │
│  │         Deployment (Frontend)            │          │
│  │  ┌────────┐  ┌────────┐                 │          │
│  │  │ Pod 1  │  │ Pod 2  │ (replicas)      │          │
│  │  └───┬────┘  └───┬────┘                 │          │
│  └──────┼───────────┼──────────────────────┘          │
│         │           │                                 │
│         ▼           ▼                                 │
│  ┌──────────────────────────────┐                     │
│  │  Service (Frontend)          │                     │
│  │  Type: NodePort              │                     │
│  │  Port: 30300                 │                     │
│  └──────────────┬───────────────┘                     │
│                 │                                     │
│                 │ Accessible from host                │
│                 ▼                                     │
│       http://localhost:30300                         │
│                                                       │
│  ┌──────────────────────────────────────────┐         │
│  │         Deployment (Backend)             │         │
│  │  ┌────────┐  ┌────────┐                 │         │
│  │  │ Pod 1  │  │ Pod 2  │ (replicas)      │         │
│  │  └───┬────┘  └───┬────┘                 │         │
│  └──────┼───────────┼──────────────────────┘         │
│         │           │                                │
│         ▼           ▼                                │
│  ┌──────────────────────────────┐                    │
│  │  Service (Backend)           │                    │
│  │  Type: ClusterIP             │                    │
│  │  DNS: todo-backend           │                    │
│  └──────────────┬───────────────┘                    │
│                 │                                    │
│                 │ Internal cluster DNS              │
│                 ▼                                    │
│       http://todo-backend:8000                      │
│                                                      │
└──────────────────────────────────────────────────────┘
                    │
                    │ External connections
                    ▼
        ┌────────────────────────┐
        │ Neon PostgreSQL        │
        │ (External)             │
        └────────────────────────┘
```

---

## Summary

All Kubernetes resources defined with:
- Clear purpose and relationships
- Validation rules and state transitions
- Security best practices (Secrets for sensitive data)
- Scalability via replica counts
- Health monitoring via probes
- Resource limits for safety

Ready for quickstart.md generation and implementation planning.
