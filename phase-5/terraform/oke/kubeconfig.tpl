apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: ${base64encode(cluster_ca_certificate)}
    server: ${cluster_endpoint}
  name: ${cluster_id}
contexts:
- context:
    cluster: ${cluster_id}
    user: ${cluster_id}
  name: ${cluster_id}
current-context: ${cluster_id}
users:
- name: ${cluster_id}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: oci
      args:
        - ce
        - cluster
        - generate-token
        - --cluster-id
        - ${cluster_id}
        - --region
        - ${region}
