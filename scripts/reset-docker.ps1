Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "Stopping all containers..."
docker compose -f monitoring/docker-compose.yml down --remove-orphans 2>$null
docker compose down --remove-orphans 2>$null

Write-Host "Building main stack images..."
docker compose build

Write-Host "Starting main stack (api, web, db)..."
docker compose up -d

Write-Host "Starting monitoring stack (prometheus, grafana)..."
docker compose -f monitoring/docker-compose.yml up -d

Write-Host ""
Write-Host "All containers running."
Write-Host "  App:        http://localhost:3000"
Write-Host "  API:        http://localhost:4000/graphql"
Write-Host "  Grafana:    http://localhost:3001  (admin / admin)"
Write-Host "  Prometheus: http://localhost:9091"
