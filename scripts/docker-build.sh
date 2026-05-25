#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building Weather Predictor Docker images..."
docker compose build "$@"

echo ""
echo "Build complete."
echo "  Start:    docker compose up"
echo "  Start bg: docker compose up -d"
echo "  Stop:     docker compose down"
