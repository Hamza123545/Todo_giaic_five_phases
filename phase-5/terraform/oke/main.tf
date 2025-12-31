# Terraform configuration for Oracle Kubernetes Engine (OKE)
# Always-Free Tier: 2 AMD VMs (1 OCPU, 1GB RAM each) OR 4 Arm Ampere A1 cores (24GB RAM total)

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
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

# OCI Provider Configuration
provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Data source for availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# Data source for OKE node images
data "oci_core_images" "node_images" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = "8"
  shape                    = var.node_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# VCN (Virtual Cloud Network)
resource "oci_core_vcn" "todo_vcn" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "todo-vcn"
  dns_label      = "todovcn"
}

# Internet Gateway
resource "oci_core_internet_gateway" "todo_ig" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.todo_vcn.id
  display_name   = "todo-internet-gateway"
  enabled        = true
}

# Route Table for Public Subnet
resource "oci_core_route_table" "todo_public_route_table" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.todo_vcn.id
  display_name   = "todo-public-route-table"

  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.todo_ig.id
  }
}

# Security List for Node Subnet
resource "oci_core_security_list" "todo_node_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.todo_vcn.id
  display_name   = "todo-node-security-list"

  # Allow inbound SSH (port 22)
  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }

  # Allow inbound Kubernetes API (port 6443)
  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 6443
      max = 6443
    }
  }

  # Allow inbound HTTP (port 80)
  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  # Allow inbound HTTPS (port 443)
  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  # Allow all traffic within VCN
  ingress_security_rules {
    protocol = "all"
    source   = "10.0.0.0/16"
  }

  # Allow all outbound traffic
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

# Security List for Load Balancer Subnet
resource "oci_core_security_list" "todo_lb_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.todo_vcn.id
  display_name   = "todo-lb-security-list"

  # Allow inbound HTTP (port 80)
  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  # Allow inbound HTTPS (port 443)
  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  # Allow all outbound traffic
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

# Node Subnet (for worker nodes)
resource "oci_core_subnet" "todo_node_subnet" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_vcn.todo_vcn.id
  cidr_block          = "10.0.1.0/24"
  display_name        = "todo-node-subnet"
  dns_label           = "nodesubnet"
  route_table_id      = oci_core_route_table.todo_public_route_table.id
  security_list_ids   = [oci_core_security_list.todo_node_security_list.id]
  prohibit_public_ip_on_vnic = false
}

# Load Balancer Subnet (for services)
resource "oci_core_subnet" "todo_lb_subnet" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_vcn.todo_vcn.id
  cidr_block          = "10.0.2.0/24"
  display_name        = "todo-lb-subnet"
  dns_label           = "lbsubnet"
  route_table_id      = oci_core_route_table.todo_public_route_table.id
  security_list_ids   = [oci_core_security_list.todo_lb_security_list.id]
  prohibit_public_ip_on_vnic = false
}

# OKE Cluster
resource "oci_containerengine_cluster" "todo_cluster" {
  compartment_id     = var.compartment_ocid
  kubernetes_version = var.kubernetes_version
  name               = var.cluster_name
  vcn_id             = oci_core_vcn.todo_vcn.id

  endpoint_config {
    is_public_ip_enabled = true
    subnet_id            = oci_core_subnet.todo_lb_subnet.id
  }

  options {
    service_lb_subnet_ids = [oci_core_subnet.todo_lb_subnet.id]

    add_ons {
      is_kubernetes_dashboard_enabled = false
      is_tiller_enabled               = false
    }

    kubernetes_network_config {
      pods_cidr     = "10.244.0.0/16"
      services_cidr = "10.96.0.0/16"
    }
  }
}

# OKE Node Pool (Always-Free Tier: VM.Standard.A1.Flex - Arm Ampere)
resource "oci_containerengine_node_pool" "todo_node_pool" {
  cluster_id         = oci_containerengine_cluster.todo_cluster.id
  compartment_id     = var.compartment_ocid
  kubernetes_version = var.kubernetes_version
  name               = "${var.cluster_name}-node-pool"
  node_shape         = var.node_shape

  # Always-Free Tier: 2 nodes with 2 OCPUs and 12GB RAM each
  node_config_details {
    size = var.node_count

    placement_configs {
      availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
      subnet_id           = oci_core_subnet.todo_node_subnet.id
    }

    node_pool_pod_network_option_details {
      cni_type = "OCI_VCN_IP_NATIVE"
    }
  }

  # Flexible shape configuration (Arm Ampere A1)
  node_shape_config {
    memory_in_gbs = var.node_memory_gb
    ocpus         = var.node_ocpus
  }

  # Node source (Oracle Linux 8 image)
  node_source_details {
    image_id    = data.oci_core_images.node_images.images[0].id
    source_type = "IMAGE"
    boot_volume_size_in_gbs = var.boot_volume_size_gb
  }

  # SSH public key for node access
  ssh_public_key = var.ssh_public_key

  # Initial node labels
  initial_node_labels {
    key   = "name"
    value = "todo-worker"
  }
}

# Wait for cluster to be active
resource "null_resource" "wait_for_cluster" {
  depends_on = [oci_containerengine_cluster.todo_cluster]

  provisioner "local-exec" {
    command = "sleep 60"
  }
}

# Generate kubeconfig file
resource "local_file" "kubeconfig" {
  depends_on = [null_resource.wait_for_cluster]

  content = templatefile("${path.module}/kubeconfig.tpl", {
    cluster_id        = oci_containerengine_cluster.todo_cluster.id
    region            = var.region
    cluster_endpoint  = oci_containerengine_cluster.todo_cluster.endpoints[0].kubernetes_api_endpoint
  })

  filename = "${path.module}/kubeconfig"
}

# Install Dapr to OKE cluster
resource "null_resource" "install_dapr" {
  depends_on = [
    oci_containerengine_node_pool.todo_node_pool,
    local_file.kubeconfig
  ]

  provisioner "local-exec" {
    command = <<-EOT
      export KUBECONFIG=${path.module}/kubeconfig
      kubectl config use-context ${var.cluster_name}
      dapr init -k --runtime-version 1.12 --enable-ha=true --enable-mtls=true --wait
    EOT
  }
}
