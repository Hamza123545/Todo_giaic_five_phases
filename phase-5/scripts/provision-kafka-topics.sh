#!/bin/bash

# Provision Kafka topics in Redpanda Cloud via Redpanda Cloud API
# Requires: Redpanda Cloud API key (set REDPANDA_API_KEY environment variable)

set -e

echo "🚀 Provisioning Kafka topics in Redpanda Cloud..."

# Configuration
REDPANDA_CLUSTER_ID="${REDPANDA_CLUSTER_ID}"
REDPANDA_API_KEY="${REDPANDA_API_KEY}"
REDPANDA_API_URL="https://api.redpanda.com/v1alpha1"

# Topics configuration (12 partitions, 30-day retention for cloud)
TOPICS=(
  "task-events:12:2592000000"
  "reminders:12:2592000000"
  "task-updates:12:2592000000"
  "dlq-topic:12:2592000000"
)

# Function to create topic via Redpanda Cloud API
create_topic() {
  local topic_name=$1
  local partitions=$2
  local retention_ms=$3

  echo "📋 Creating topic: $topic_name (partitions: $partitions, retention: $retention_ms ms)"

  curl -X POST "$REDPANDA_API_URL/clusters/$REDPANDA_CLUSTER_ID/topics" \
    -H "Authorization: Bearer $REDPANDA_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$topic_name\",
      \"partition_count\": $partitions,
      \"replication_factor\": 1,
      \"configs\": {
        \"retention.ms\": \"$retention_ms\",
        \"cleanup.policy\": \"delete\",
        \"compression.type\": \"snappy\"
      }
    }"

  echo "✅ Topic $topic_name created successfully"
}

# Create all topics
for topic_config in "${TOPICS[@]}"; do
  IFS=':' read -r topic_name partitions retention_ms <<< "$topic_config"
  create_topic "$topic_name" "$partitions" "$retention_ms"
done

echo "🎉 All Kafka topics provisioned successfully!"

# Verify topics
echo "📊 Listing all topics..."
curl -X GET "$REDPANDA_API_URL/clusters/$REDPANDA_CLUSTER_ID/topics" \
  -H "Authorization: Bearer $REDPANDA_API_KEY" \
  | jq '.topics[] | {name: .name, partitions: .partition_count, retention_ms: .configs["retention.ms"]}'

echo "✅ Kafka provisioning complete!"
