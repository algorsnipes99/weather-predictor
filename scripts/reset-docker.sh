#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Stopping all containers..."
docker compose -f monitoring/docker-compose.yml down --remove-orphans 2>/dev/null || true
docker compose down --remove-orphans

echo "Building main stack images..."
docker compose build

echo "Starting main stack (api, web, db)..."
docker compose up -d

echo "Starting monitoring stack (prometheus, grafana)..."
docker compose -f monitoring/docker-compose.yml up -d

echo ""
echo "All containers running."
echo "  App:        http://localhost:3000"
echo "  API:        http://localhost:4000/graphql"
echo "  Grafana:    http://localhost:3001  (admin / admin)"
echo "  Prometheus: http://localhost:9091"
