# Terraform configuration for Google Kubernetes Engine (GKE)
# Secondary deployment target (OKE is primary)

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

# Google Cloud Provider Configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

# VPC Network
resource "google_compute_network" "todo_vpc" {
  name                    = "todo-vpc"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "todo_subnet" {
  name          = "todo-subnet"
  ip_cidr_range = "10.0.0.0/16"
  region        = var.region
  network       = google_compute_network.todo_vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.244.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.96.0.0/16"
  }
}

# GKE Cluster
resource "google_container_cluster" "todo_cluster" {
  name     = var.cluster_name
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.todo_vpc.name
  subnetwork = google_compute_subnetwork.todo_subnet.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

# GKE Node Pool
resource "google_container_node_pool" "todo_node_pool" {
  name       = "${var.cluster_name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.todo_cluster.name
  node_count = var.node_count

  node_config {
    machine_type = var.machine_type
    disk_size_gb = var.disk_size_gb

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    tags = ["todo-worker"]
  }
}

# Kubernetes Provider
data "google_client_config" "default" {}

data "google_container_cluster" "todo_cluster" {
  name     = google_container_cluster.todo_cluster.name
  location = var.region
}

provider "kubernetes" {
  host                   = "https://${data.google_container_cluster.todo_cluster.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(data.google_container_cluster.todo_cluster.master_auth[0].cluster_ca_certificate)
}

# Install Dapr to GKE cluster
resource "null_resource" "install_dapr" {
  depends_on = [google_container_node_pool.todo_node_pool]

  provisioner "local-exec" {
    command = <<-EOT
      gcloud container clusters get-credentials ${google_container_cluster.todo_cluster.name} --region ${var.region} --project ${var.project_id}
      dapr init -k --runtime-version 1.12 --enable-ha=true --enable-mtls=true --wait
    EOT
  }
}
