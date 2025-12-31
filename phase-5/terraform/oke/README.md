# Oracle Kubernetes Engine (OKE) Terraform Configuration

This directory contains Terraform configuration for provisioning an OKE cluster on Oracle Cloud Infrastructure (OCI) using the **Always-Free Tier**.

## Prerequisites

1. **OCI Account**: Create account at https://cloud.oracle.com/
   - Always-Free Tier: 2 AMD VMs OR 4 Arm Ampere A1 cores (24GB RAM total)
   - $300 credit for 30 days (optional for exceeding free tier)

2. **OCI CLI**: Install from https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm
   ```bash
   bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
   ```

3. **Terraform**: Install from https://www.terraform.io/downloads
   ```bash
   # macOS
   brew install terraform

   # Windows
   choco install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

4. **kubectl**: Install from https://kubernetes.io/docs/tasks/tools/
   ```bash
   # macOS
   brew install kubectl

   # Windows
   choco install kubernetes-cli

   # Linux
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   ```

5. **Dapr CLI**: Install from https://docs.dapr.io/getting-started/install-dapr-cli/
   ```bash
   # macOS/Linux
   curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | bash

   # Windows
   powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"
   ```

## Configuration

1. **Create API Keys** in OCI Console:
   - Go to User Settings → API Keys → Add API Key
   - Download private key and note the fingerprint

2. **Copy variables file**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. **Edit `terraform.tfvars`** with your OCI credentials:
   - `tenancy_ocid`: From OCI Console → Tenancy
   - `user_ocid`: From OCI Console → User Settings
   - `fingerprint`: From API Key creation
   - `private_key_path`: Path to downloaded private key
   - `compartment_ocid`: From OCI Console → Identity → Compartments
   - `region`: Choose nearest region (e.g., "us-ashburn-1")
   - `ssh_public_key`: Generate with `ssh-keygen -t rsa -b 4096`

## Deployment

### Provision OKE Cluster

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply configuration (provision cluster)
terraform apply

# Outputs
# - cluster_id
# - cluster_endpoint
# - kubeconfig_path
```

### Configure kubectl

```bash
# Export kubeconfig
export KUBECONFIG=$(terraform output -raw kubeconfig_path)

# Verify cluster access
kubectl get nodes

# Expected output: 2 nodes in Ready state
```

### Verify Dapr Installation

```bash
# Check Dapr system pods
kubectl get pods -n dapr-system

# Expected pods:
# - dapr-operator
# - dapr-sentry
# - dapr-placement-server
# - dapr-sidecar-injector

# Verify Dapr components
kubectl get components
```

## Always-Free Tier Limits

**Compute**:
- 2 AMD Compute VMs (1 OCPU, 1GB RAM each) **OR**
- 4 Arm Ampere A1 cores (24GB RAM total) ← **This configuration uses Arm**

**Storage**:
- 200GB total block storage (100GB used: 50GB per node)

**Networking**:
- 1 Load Balancer (10Mbps)
- 10TB outbound data transfer per month

## Cost Monitoring

```bash
# Check node resource usage
kubectl top nodes

# Check pod resource usage
kubectl top pods --all-namespaces

# Monitor always-free tier usage in OCI Console
# → Governance → Cost Analysis → Cost Tracking
```

## Cleanup

```bash
# Destroy all resources
terraform destroy

# Confirm with 'yes'
```

**Warning**: This will delete the cluster, nodes, VCN, and all associated resources.

## Troubleshooting

### Issue: "Service limit exceeded"
**Solution**: Reduce `node_count` to 1 or switch to AMD shape (`VM.Standard.E2.1.Micro`)

### Issue: "Dapr installation failed"
**Solution**:
```bash
# Manually install Dapr
dapr init -k --runtime-version 1.12 --enable-ha=true --enable-mtls=true
```

### Issue: "Nodes not ready"
**Solution**: Wait 5-10 minutes for nodes to initialize. Check status:
```bash
kubectl describe nodes
```

### Issue: "Cannot connect to cluster"
**Solution**: Verify kubeconfig:
```bash
export KUBECONFIG=$(pwd)/kubeconfig
kubectl config current-context
```

## Next Steps

1. **Deploy Application**: Use Helm charts in `../../helm/todo-app/`
2. **Configure Secrets**: Set up OCI Vault secrets (see `../../dapr/components/secretstore-oci-vault.yaml`)
3. **Deploy Kafka**: Use Redpanda Cloud or self-hosted Strimzi
4. **Configure Monitoring**: Deploy Prometheus, Grafana, Zipkin

## References

- [OCI Always-Free Tier](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [OKE Documentation](https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm)
- [Terraform OCI Provider](https://registry.terraform.io/providers/oracle/oci/latest/docs)
- [Dapr on Kubernetes](https://docs.dapr.io/operations/hosting/kubernetes/)
