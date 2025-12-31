# Terraform variables for GKE deployment

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud Region"
  type        = string
  default     = "us-central1"
}

variable "cluster_name" {
  description = "GKE Cluster Name"
  type        = string
  default     = "todo-gke-cluster"
}

variable "node_count" {
  description = "Number of Worker Nodes"
  type        = number
  default     = 2
}

variable "machine_type" {
  description = "Machine Type (e2-medium: 2 vCPUs, 4GB RAM)"
  type        = string
  default     = "e2-medium"
}

variable "disk_size_gb" {
  description = "Disk Size in GB"
  type        = number
  default     = 50
}
