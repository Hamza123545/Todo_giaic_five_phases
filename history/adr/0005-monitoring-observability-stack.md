# ADR-0005: Monitoring and Observability Stack (Zipkin + Prometheus + Grafana)

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together (e.g., "Frontend Stack" not separate ADRs for framework, styling, deployment).

- **Status:** Accepted
- **Date:** 2025-12-29
- **Feature:** 007-phase5-cloud-deployment
- **Context:** Phase V introduces distributed architecture with 5 microservices communicating via Kafka events and Dapr service invocation. Debugging requires understanding: (1) distributed traces across service boundaries, (2) metrics for performance monitoring (consumer lag, request latency), (3) centralized logs for troubleshooting failures. The monitoring stack must run on OKE Always-Free Tier (24GB RAM total) with minimal resource overhead while providing sufficient observability for production issues.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: ✅ Long-term consequence - affects debugging capabilities, incident response, performance optimization, SLA monitoring
     2) Alternatives: ✅ Multiple viable options - Jaeger (richer features), cloud-native solutions (vendor lock-in), ELK Stack (higher resources)
     3) Scope: ✅ Cross-cutting concern - impacts all microservices, Dapr configuration, log formatting, metric collection
     All three tests passed - ADR justified. -->

## Decision

Use lightweight observability stack optimized for resource-constrained environments:

- **Distributed Tracing**: Zipkin (NOT Jaeger) - single binary, ~500MB RAM vs Jaeger's ~1GB RAM
- **Metrics Collection**: Prometheus (de-facto Kubernetes standard) + Grafana for visualization
- **Centralized Logging**: OCI Logging (cloud-native for OKE), with structured JSON logs from application
- **Dapr Integration**: All services automatically instrumented (Dapr exports traces to Zipkin, metrics to Prometheus)
- **Sampling Rate**: 100% sampling for Phase V (reduce to 10% if high traffic exceeds resource limits)
- **Retention**: Zipkin 7 days, Prometheus 15 days, OCI Logging 30 days

Deployment configuration:
- Zipkin: Single pod (500MB RAM, 250m CPU)
- Prometheus: Single pod (4GB RAM, 1 core) - scrapes Dapr sidecars + custom app metrics
- Grafana: Single pod (1GB RAM, 500m CPU) - dashboards for Kafka, Dapr, application metrics
- Total overhead: 5.5GB RAM, 1.75 cores (23% of OKE free tier resources)

## Consequences

### Positive

- **Low Resource Usage**: Zipkin (500MB) vs Jaeger (1GB) saves 500MB RAM - critical for OKE free tier (24GB total)
- **Simple Deployment**: Zipkin single binary deployment vs Jaeger multi-component (Jaeger requires Cassandra/Elasticsearch backend)
- **Automatic Instrumentation**: Dapr sidecars automatically export traces and metrics (no manual instrumentation code)
- **Standard Tooling**: Prometheus + Grafana industry standard (rich dashboard ecosystem, familiar to engineers)
- **Distributed Trace Visualization**: Zipkin UI shows full request path across services (e.g., Task Service → Dapr Pub/Sub → Kafka → Recurring Task Service)
- **Kafka Monitoring**: Prometheus Kafka Exporter provides consumer lag metrics (alerts if lag >60s)
- **Cost Efficiency**: OCI Logging free tier (1GB/month ingestion) sufficient for Phase V volume (~10MB/day logs)
- **Dashboard Import**: Grafana marketplace has pre-built dashboards for Kafka (ID 7589), Dapr (ID 19004)

### Negative

- **Fewer Features than Jaeger**: Zipkin lacks adaptive sampling, service dependency graphs, advanced UI features
- **No Long-Term Storage**: Zipkin in-memory storage (7 days retention) - cannot analyze historical trends beyond 1 week
- **Manual Correlation**: Must manually correlate traces (Zipkin), metrics (Prometheus), logs (OCI Logging) - no unified observability platform
- **Limited Log Analysis**: OCI Logging basic search (not ELK Stack's advanced queries, aggregations, visualizations)
- **Resource Contention**: Prometheus 4GB RAM allocation = 17% of OKE free tier - may need tuning if application needs grow
- **No Anomaly Detection**: No built-in anomaly detection (must manually configure Prometheus alert rules)

## Alternatives Considered

### Alternative A: Jaeger (Distributed Tracing)

**Components**:
- Jaeger All-in-One (agent + collector + query + UI)
- Cassandra or Elasticsearch for trace storage
- Advanced features: adaptive sampling, service dependency graphs, trace comparison

**Why rejected**:
- Higher resource usage: Jaeger All-in-One ~1GB RAM (doubles Zipkin's 500MB)
- Complex deployment: Jaeger requires Cassandra (2GB+ RAM) or Elasticsearch (2GB+ RAM) for production - total 3GB+ vs Zipkin 500MB
- Overkill for Phase V: Advanced features (adaptive sampling, service graphs) not needed for 5 microservices
- OKE free tier constraints: 24GB RAM total - Jaeger + Cassandra (3GB) + Prometheus (4GB) + Grafana (1GB) = 8GB (33% overhead)

### Alternative B: Cloud-Native Observability (Azure Monitor, GCP Cloud Trace, AWS X-Ray)

**Components**:
- Azure Application Insights (distributed tracing + metrics + logs in one platform)
- Google Cloud Trace + Cloud Logging + Cloud Monitoring
- AWS X-Ray + CloudWatch Logs + CloudWatch Metrics

**Why rejected**:
- Vendor lock-in: Cannot run on OKE without external dependencies (violates multi-cloud requirement)
- Cost: Azure App Insights $2.30/GB ingestion (10MB/day logs × 30 days = $0.69/month - not free)
- No local development: Cannot run Azure Monitor on Minikube (requires cloud connection)
- Network egress: Sending traces/logs to Azure from OKE incurs OCI egress charges

### Alternative C: ELK Stack (Elasticsearch + Logstash + Kibana)

**Components**:
- Elasticsearch for log storage and search (distributed search engine)
- Logstash for log ingestion and transformation
- Kibana for log visualization and dashboarding
- Advanced features: full-text search, log aggregations, anomaly detection

**Why rejected**:
- High resource usage: Elasticsearch minimum 2GB RAM, Logstash 1GB, Kibana 1GB = 4GB total (17% of OKE free tier)
- Complex setup: Elasticsearch cluster management, index tuning, shard allocation (steep learning curve)
- Overkill for Phase V: Advanced log analysis features not needed for 5 microservices with low traffic
- Alternative exists: OCI Logging provides basic log search for free (sufficient for Phase V)

### Alternative D: Grafana Loki (Lightweight Logging)

**Components**:
- Loki for log aggregation (inspired by Prometheus, stores log metadata not full text)
- Promtail for log shipping
- Grafana for log visualization
- Lower resource usage than ELK Stack (~500MB RAM)

**Why rejected**:
- Less mature: Loki newer than Elasticsearch (fewer production deployments, less community support)
- Limited query language: LogQL simpler than Elasticsearch's Query DSL (cannot do complex aggregations)
- OCI Logging sufficient: OCI Logging provides free tier with basic search (good enough for Phase V)
- Preference for cloud-native: OCI Logging integrates natively with OKE (automatic log collection, no Promtail deployment)

## References

- Feature Spec: [specs/007-phase5-cloud-deployment/spec.md](../../specs/007-phase5-cloud-deployment/spec.md) (Success Criteria SC-018, SC-019, SC-020: Monitoring requirements)
- Implementation Plan: [specs/007-phase5-cloud-deployment/plan.md](../../specs/007-phase5-cloud-deployment/plan.md)
- Technical Research: [specs/007-phase5-cloud-deployment/research.md](../../specs/007-phase5-cloud-deployment/research.md) (Section 5: Monitoring and Observability)
- Monitoring Configuration: specs/007-phase5-cloud-deployment/monitoring/ (to be created in implementation phase)
- Related ADRs: ADR-0001 (Infrastructure Abstraction with Dapr - automatic trace/metrics export), ADR-0004 (OKE Always-Free Tier - resource constraints)
- Zipkin Documentation: https://zipkin.io/
- Prometheus Documentation: https://prometheus.io/docs/
- Grafana Dashboard Marketplace: https://grafana.com/grafana/dashboards/
