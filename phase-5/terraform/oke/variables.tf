# Terraform variables for OKE deployment

# OCI Authentication
variable "tenancy_ocid" {
  description = "OCI Tenancy OCID"
  type        = string
}

variable "user_ocid" {
  description = "OCI User OCID"
  type        = string
}

variable "fingerprint" {
  description = "OCI API Key Fingerprint"
  type        = string
}

variable "private_key_path" {
  description = "Path to OCI API Key Private Key"
  type        = string
}

variable "compartment_ocid" {
  description = "OCI Compartment OCID"
  type        = string
}

variable "region" {
  description = "OCI Region"
  type        = string
  default     = "us-ashburn-1"
}

# Cluster Configuration
variable "cluster_name" {
  description = "OKE Cluster Name"
  type        = string
  default     = "todo-oke-cluster"
}

variable "kubernetes_version" {
  description = "Kubernetes Version"
  type        = string
  default     = "v1.28.2"
}

# Node Pool Configuration (Always-Free Tier)
variable "node_shape" {
  description = "Node Shape (Always-Free: VM.Standard.A1.Flex for Arm Ampere)"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "node_count" {
  description = "Number of Worker Nodes (Always-Free: max 2)"
  type        = number
  default     = 2
}

variable "node_ocpus" {
  description = "OCPUs per Node (Always-Free: 2 OCPUs per node, 4 total)"
  type        = number
  default     = 2
}

variable "node_memory_gb" {
  description = "Memory in GB per Node (Always-Free: 12GB per node, 24GB total)"
  type        = number
  default     = 12
}

variable "boot_volume_size_gb" {
  description = "Boot Volume Size in GB per Node (Always-Free: max 200GB total)"
  type        = number
  default     = 50
}

# SSH Key for Node Access
variable "ssh_public_key" {
  description = "SSH Public Key for Node Access"
  type        = string
  default     = ""
}
