#!/bin/bash
# Build script for Docker that ensures uv.lock exists

set -e

echo "🔍 Checking for uv.lock file..."

# Check if uv.lock exists, if not generate it
if [ ! -f "uv.lock" ]; then
    echo "⚠️  uv.lock not found. Generating lock file..."
    if command -v uv &> /dev/null; then
        uv lock --no-dev
        echo "✅ Generated uv.lock"
    else
        echo "❌ Error: uv.lock is required but not found, and UV is not installed."
        echo "   Please run: uv lock --no-dev"
        exit 1
    fi
else
    echo "✅ uv.lock found"
fi

# Verify uv.lock is not empty
if [ ! -s "uv.lock" ]; then
    echo "❌ Error: uv.lock exists but is empty"
    exit 1
fi

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t todo-backend:latest .

