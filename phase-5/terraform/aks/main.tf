# Terraform configuration for Azure Kubernetes Service (AKS)
# Secondary deployment target (OKE is primary)

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
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

# Azure Provider Configuration
provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "todo_rg" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = "production"
    Project     = "todo-app"
    ManagedBy   = "terraform"
  }
}

# AKS Cluster
resource "azurerm_kubernetes_cluster" "todo_cluster" {
  name                = var.cluster_name
  location            = azurerm_resource_group.todo_rg.location
  resource_group_name = azurerm_resource_group.todo_rg.name
  dns_prefix          = "todo-aks"
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = var.vm_size
    os_disk_size_gb = var.os_disk_size_gb

    tags = {
      Environment = "production"
      NodePool    = "default"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "azure"
    network_policy = "calico"
    service_cidr   = "10.96.0.0/16"
    dns_service_ip = "10.96.0.10"
    docker_bridge_cidr = "172.17.0.1/16"
  }

  tags = {
    Environment = "production"
    Project     = "todo-app"
    ManagedBy   = "terraform"
  }
}

# Kubernetes Provider
provider "kubernetes" {
  host                   = azurerm_kubernetes_cluster.todo_cluster.kube_config[0].host
  client_certificate     = base64decode(azurerm_kubernetes_cluster.todo_cluster.kube_config[0].client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.todo_cluster.kube_config[0].client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.todo_cluster.kube_config[0].cluster_ca_certificate)
}

# Install Dapr to AKS cluster
resource "null_resource" "install_dapr" {
  depends_on = [azurerm_kubernetes_cluster.todo_cluster]

  provisioner "local-exec" {
    command = <<-EOT
      az aks get-credentials --resource-group ${azurerm_resource_group.todo_rg.name} --name ${azurerm_kubernetes_cluster.todo_cluster.name}
      dapr init -k --runtime-version 1.12 --enable-ha=true --enable-mtls=true --wait
    EOT
  }
}
