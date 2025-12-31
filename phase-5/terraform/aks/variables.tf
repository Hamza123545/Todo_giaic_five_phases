# Terraform variables for AKS deployment

variable "resource_group_name" {
  description = "Azure Resource Group Name"
  type        = string
  default     = "todo-resource-group"
}

variable "location" {
  description = "Azure Region"
  type        = string
  default     = "eastus"
}

variable "cluster_name" {
  description = "AKS Cluster Name"
  type        = string
  default     = "todo-aks-cluster"
}

variable "kubernetes_version" {
  description = "Kubernetes Version"
  type        = string
  default     = "1.28.0"
}

variable "node_count" {
  description = "Number of Worker Nodes"
  type        = number
  default     = 2
}

variable "vm_size" {
  description = "VM Size (Standard_B2s: 2 vCPUs, 4GB RAM)"
  type        = string
  default     = "Standard_B2s"
}

variable "os_disk_size_gb" {
  description = "OS Disk Size in GB"
  type        = number
  default     = 50
}
