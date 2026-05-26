#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="$(dirname "$0")/docker-compose.yml"
PROJECT_NAME="weather-predictor"

usage() {
  cat <<EOF
Usage: ./deploy.sh [command]

Commands:
  up        Build images and start all services detached (default)
  rebuild   Rebuild all images from scratch (--no-cache) and start detached
  down      Stop and remove all containers
  restart   Bring down, rebuild, and start back up
  logs      Follow logs for all running services

EOF
}

cmd_up() {
  echo "==> Building images..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build

  echo "==> Starting services..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d

  echo "==> Done. Services running:"
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
}

cmd_rebuild() {
  echo "==> Rebuilding images (no cache)..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build --no-cache

  echo "==> Starting services..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d

  echo "==> Done. Services running:"
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
}

cmd_down() {
  echo "==> Stopping services..."
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
  echo "==> Done."
}

cmd_restart() {
  cmd_down
  cmd_rebuild
}

cmd_logs() {
  docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f
}

COMMAND="${1:-up}"

case "$COMMAND" in
  up)       cmd_up ;;
  rebuild)  cmd_rebuild ;;
  down)     cmd_down ;;
  restart)  cmd_restart ;;
  logs)     cmd_logs ;;
  help|--help|-h) usage ;;
  *)
    echo "Unknown command: $COMMAND"
    usage
    exit 1
    ;;
esac
