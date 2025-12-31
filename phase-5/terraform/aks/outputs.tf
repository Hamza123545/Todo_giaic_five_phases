# Terraform outputs for AKS deployment

output "cluster_id" {
  description = "AKS Cluster ID"
  value       = azurerm_kubernetes_cluster.todo_cluster.id
}

output "cluster_name" {
  description = "AKS Cluster Name"
  value       = azurerm_kubernetes_cluster.todo_cluster.name
}

output "cluster_endpoint" {
  description = "AKS Cluster API Endpoint"
  value       = azurerm_kubernetes_cluster.todo_cluster.kube_config[0].host
}

output "resource_group_name" {
  description = "Azure Resource Group Name"
  value       = azurerm_resource_group.todo_rg.name
}

output "location" {
  description = "Azure Region"
  value       = azurerm_resource_group.todo_rg.location
}
