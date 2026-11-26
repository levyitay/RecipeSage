#!/bin/bash

set -e

docker compose exec backend pnpm exec nx run cli:build
docker compose exec backend node ./dist/apps/cli/main.cjs decryptDebugStore "$@"

