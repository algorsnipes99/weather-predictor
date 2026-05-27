Set-Location (Join-Path $PSScriptRoot "..")

# Load .env so port variables are available for the summary output below
if (Test-Path .env) {
  Get-Content .env | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
    $parts = $_ -split '=', 2
    $key = $parts[0].Trim()
    $val = $parts[1].Trim()
    if (-not [System.Environment]::GetEnvironmentVariable($key)) {
      [System.Environment]::SetEnvironmentVariable($key, $val)
    }
  }
}

$portWeb        = if ($env:PORT_WEB)        { $env:PORT_WEB }        else { "3000" }
$portApi        = if ($env:PORT_API)        { $env:PORT_API }        else { "4000" }
$portGrafana    = if ($env:PORT_GRAFANA)    { $env:PORT_GRAFANA }    else { "3001" }
$portPrometheus = if ($env:PORT_PROMETHEUS) { $env:PORT_PROMETHEUS } else { "9091" }

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
Write-Host "  App:        http://localhost:$portWeb"
Write-Host "  API:        http://localhost:$portApi/graphql"
Write-Host "  Grafana:    http://localhost:$portGrafana  (admin / admin)"
Write-Host "  Prometheus: http://localhost:$portPrometheus"
