#!/bin/bash

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Invalid command. Usage: ./scripts/build/webapp-selfhost.sh v1.0.0"
  exit 1
fi

VERSION="$1"
REGISTRY_REPO="${REGISTRY_REPO:-levyitay/recipesage-selfhost}"
PLATFORMS="${PLATFORMS:-linux/amd64}"

cd "$(dirname "$0")/../.."

rm -rf www packages/frontend/www
ENVIRONMENT=production APP_VERSION="$VERSION" NODE_OPTIONS=--max-old-space-size=4096 \
  pnpm exec nx build:selfhost frontend --skip-nx-cache
mv packages/frontend/www ./www

node -e '
const fs = require("fs");
const html = fs.readFileSync("www/index.html", "utf8");
fs.writeFileSync(
  "www/index.html",
  html.replace(/window\.version\s*=\s*"development";/, `window.version = "${process.argv[1]}";`)
);
' "$VERSION"

docker buildx build . \
  --push \
  --platform "$PLATFORMS" \
  -f packages/frontend/selfhost.Dockerfile \
  --build-arg VERSION="$VERSION" \
  -t "$REGISTRY_REPO:static-latest" \
  -t "$REGISTRY_REPO:static-$VERSION"
