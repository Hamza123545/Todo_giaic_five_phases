# Terraform outputs for OKE deployment

output "cluster_id" {
  description = "OKE Cluster ID"
  value       = oci_containerengine_cluster.todo_cluster.id
}

output "cluster_name" {
  description = "OKE Cluster Name"
  value       = oci_containerengine_cluster.todo_cluster.name
}

output "cluster_endpoint" {
  description = "OKE Cluster API Endpoint"
  value       = oci_containerengine_cluster.todo_cluster.endpoints[0].kubernetes_api_endpoint
}

output "cluster_kubernetes_version" {
  description = "Kubernetes Version"
  value       = oci_containerengine_cluster.todo_cluster.kubernetes_version
}

output "node_pool_id" {
  description = "OKE Node Pool ID"
  value       = oci_containerengine_node_pool.todo_node_pool.id
}

output "node_pool_size" {
  description = "Number of Nodes in Node Pool"
  value       = oci_containerengine_node_pool.todo_node_pool.node_config_details[0].size
}

output "vcn_id" {
  description = "VCN ID"
  value       = oci_core_vcn.todo_vcn.id
}

output "node_subnet_id" {
  description = "Node Subnet ID"
  value       = oci_core_subnet.todo_node_subnet.id
}

output "lb_subnet_id" {
  description = "Load Balancer Subnet ID"
  value       = oci_core_subnet.todo_lb_subnet.id
}

output "kubeconfig_path" {
  description = "Path to Kubeconfig File"
  value       = local_file.kubeconfig.filename
}

output "region" {
  description = "OCI Region"
  value       = var.region
}
