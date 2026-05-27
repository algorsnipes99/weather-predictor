#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Load .env so port variables are available for the summary output below
if [ -f .env ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

PORT_WEB=${PORT_WEB:-3000}
PORT_API=${PORT_API:-4000}
PORT_GRAFANA=${PORT_GRAFANA:-3001}
PORT_PROMETHEUS=${PORT_PROMETHEUS:-9091}

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
echo "  App:        http://localhost:$PORT_WEB"
echo "  API:        http://localhost:$PORT_API/graphql"
echo "  Grafana:    http://localhost:$PORT_GRAFANA  (admin / admin)"
echo "  Prometheus: http://localhost:$PORT_PROMETHEUS"
