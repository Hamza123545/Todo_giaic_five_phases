#!/bin/bash

# Sync secrets to OCI Vault
# Uploads application secrets from environment variables to OCI Vault

set -e

echo "🔐 Syncing secrets to OCI Vault..."

# Configuration
OCI_VAULT_OCID="${OCI_VAULT_OCID}"
COMPARTMENT_OCID="${COMPARTMENT_OCID}"
OCI_REGION="${OCI_REGION:-us-ashburn-1}"

# Secrets to sync (key:value pairs from environment)
SECRETS=(
  "database-url:${DATABASE_URL}"
  "kafka-brokers:${KAFKA_BROKERS}"
  "kafka-username:${KAFKA_USERNAME}"
  "kafka-password:${KAFKA_PASSWORD}"
  "smtp-host:${SMTP_HOST}"
  "smtp-password:${SMTP_PASSWORD}"
  "better-auth-secret:${BETTER_AUTH_SECRET}"
  "grafana-admin-password:${GRAFANA_ADMIN_PASSWORD}"
)

# Function to create/update secret in OCI Vault
sync_secret() {
  local secret_name=$1
  local secret_value=$2

  echo "📝 Syncing secret: $secret_name"

  # Check if secret exists
  secret_id=$(oci vault secret list \
    --compartment-id "$COMPARTMENT_OCID" \
    --vault-id "$OCI_VAULT_OCID" \
    --name "$secret_name" \
    --query "data[0].id" \
    --raw-output 2>/dev/null || echo "")

  if [ -z "$secret_id" ]; then
    # Create new secret
    echo "  ➕ Creating new secret..."
    oci vault secret create \
      --compartment-id "$COMPARTMENT_OCID" \
      --vault-id "$OCI_VAULT_OCID" \
      --secret-name "$secret_name" \
      --secret-content-content "$(echo -n "$secret_value" | base64)" \
      --secret-content-content-type "BASE64" \
      --secret-content-stage "CURRENT"
  else
    # Update existing secret
    echo "  🔄 Updating existing secret..."
    oci vault secret update-base64 \
      --secret-id "$secret_id" \
      --secret-content-content "$(echo -n "$secret_value" | base64)"
  fi

  echo "  ✅ Secret $secret_name synced successfully"
}

# Sync all secrets
for secret_config in "${SECRETS[@]}"; do
  IFS=':' read -r secret_name secret_value <<< "$secret_config"

  if [ -z "$secret_value" ]; then
    echo "⚠️  Warning: Secret $secret_name has no value, skipping..."
    continue
  fi

  sync_secret "$secret_name" "$secret_value"
done

echo "🎉 All secrets synced to OCI Vault successfully!"

# List all secrets
echo "📋 Listing all secrets in vault..."
oci vault secret list \
  --compartment-id "$COMPARTMENT_OCID" \
  --vault-id "$OCI_VAULT_OCID" \
  --query "data[*].{name: \"secret-name\", id: id, state: \"lifecycle-state\"}" \
  --output table

echo "✅ Secret sync complete!"
