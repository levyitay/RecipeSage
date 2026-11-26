#!/bin/bash

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Invalid command. Usage: ./scripts/build/api-selfhost.sh v1.0.0"
  exit 1
fi

VERSION="$1"
REGISTRY_REPO="${REGISTRY_REPO:-levyitay/recipesage-selfhost}"

cd "$(dirname "$0")/../.."

docker buildx build . \
  --push \
  --platform linux/arm64/v8,linux/amd64 \
  -f production.Dockerfile \
  --build-arg VERSION="$VERSION" \
  -t "$REGISTRY_REPO:api-latest" \
  -t "$REGISTRY_REPO:api-$VERSION"
