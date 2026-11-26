#!/bin/bash

docker compose exec backend pnpm exec tsx packages/backend/src/migrate.js

