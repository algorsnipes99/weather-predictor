$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "Building Weather Predictor Docker images..."
docker compose build @args

Write-Host ""
Write-Host "Build complete."
Write-Host "  Start:    docker compose up"
Write-Host "  Start bg: docker compose up -d"
Write-Host "  Stop:     docker compose down"
