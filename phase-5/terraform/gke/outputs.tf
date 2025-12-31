# Terraform outputs for GKE deployment

output "cluster_id" {
  description = "GKE Cluster ID"
  value       = google_container_cluster.todo_cluster.id
}

output "cluster_name" {
  description = "GKE Cluster Name"
  value       = google_container_cluster.todo_cluster.name
}

output "cluster_endpoint" {
  description = "GKE Cluster API Endpoint"
  value       = google_container_cluster.todo_cluster.endpoint
}

output "region" {
  description = "Google Cloud Region"
  value       = var.region
}

output "project_id" {
  description = "Google Cloud Project ID"
  value       = var.project_id
}
