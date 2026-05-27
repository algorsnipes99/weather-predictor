# Metrics & Monitoring — Implementation Progress

**Date:** 2026-05-27
**Agent:** Claude Sonnet 4.6

---

## What Was Built

### Application code — `apps/api/src/metrics/`

| File | Purpose |
|---|---|
| `registry.ts` | Singleton `Registry` + all metric definitions. Single source of truth — nothing creates metrics ad-hoc elsewhere. |
| `metrics.server.ts` | Plain `node:http` server on `METRICS_PORT` (default 9090). Serves Prometheus text format at `GET /metrics`. Started alongside the main Express server in `index.ts`. |
| `http.middleware.ts` | Express middleware using `process.hrtime.bigint()` + `res.on('finish')` to record HTTP request duration and total count per route. |
| `apollo.plugin.ts` | Apollo Server plugin hooking `willSendResponse` and `didEncounterErrors` to record GraphQL operation duration and error count by operation name. |

### Instrumented existing files

| File | What was added |
|---|---|
| `apps/api/src/modules/weather/open-meteo.client.ts` | `hrtime` timing around both `getForecast` and `getMarineForecast`. Increments `weather_fetch_errors_total` on fetch failure or non-OK response. Records `weather_fetch_duration_seconds` on success. |
| `apps/api/src/modules/rankings/ranking-cache.repository.ts` | Increments `ranking_cache_hits_total` or `ranking_cache_misses_total` in `get()`. Records `ranking_cache_write_duration_seconds` histogram in `set()`. |
| `apps/api/src/index.ts` | Registers `httpMetricsMiddleware` on the Express app, passes `metricsPlugin` to `ApolloServer`, calls `startMetricsServer(METRICS_PORT)` after the main server starts. |
| `docker-compose.yml` | Added `METRICS_PORT: 9090` env var to the `api` service. Port 9090 is intentionally NOT exposed to the host — only reachable within the Docker network by Prometheus. |

### Metrics catalogue

| Metric | Type | Labels |
|---|---|---|
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` |
| `http_requests_total` | Counter | `method`, `route`, `status_code` |
| `graphql_operation_duration_seconds` | Histogram | `operation_name` |
| `graphql_errors_total` | Counter | `operation_name` |
| `weather_fetch_duration_seconds` | Histogram | `type` (`forecast` / `marine`) |
| `weather_fetch_errors_total` | Counter | `type` |
| `ranking_cache_hits_total` | Counter | — |
| `ranking_cache_misses_total` | Counter | — |
| `ranking_cache_write_duration_seconds` | Histogram | — |
| Node.js default metrics (heap, CPU, event loop, GC) | Auto | — |

### Monitoring stack — `monitoring/`

| File | Purpose |
|---|---|
| `docker-compose.yml` | Starts Prometheus (host port 9091) and Grafana (host port 3001). Joins `weather-predictor_weather-net` as an external network. |
| `prometheus/prometheus.yml` | Scrapes `api:9090` every 15s. |
| `grafana/provisioning/datasources/prometheus.yml` | Auto-provisions Prometheus as the default datasource on first boot. |
| `grafana/provisioning/dashboards/dashboards.yml` | Points Grafana at `/var/lib/grafana/dashboards` for auto-loaded dashboard JSON files. |
| `grafana/dashboards/weather-api.json` | Pre-built dashboard with 9 panels (see below). |

### Grafana dashboard panels

1. HTTP Request Rate by Route
2. HTTP p95 / p50 Response Time
3. GraphQL Operation Duration (p50 / p95)
4. GraphQL Error Rate
5. Weather Fetch Duration p95 (forecast vs marine)
6. Weather Fetch Error Rate
7. Cache Hit Ratio (stat panel)
8. Node.js Heap Used
9. Event Loop Lag

---

## Current State (2026-05-27)

All 5 containers running:

| Container | Port |
|---|---|
| `weather-predictor-api-1` | 4000 |
| `weather-predictor-web-1` | 3000 |
| `weather-predictor-db-1` | 5432 |
| `monitoring-prometheus-1` | 9091 (host) → 9090 (internal) |
| `monitoring-grafana-1` | 3001 (host) → 3000 (internal) |

**Grafana login:** `admin` / `admin`

---

## Known Issues / What Needs Verification

### 1. Prometheus scrape status — NOT YET CONFIRMED
Go to **Prometheus → Status → Targets** (`localhost:9091/targets`) and confirm `weather-api` shows as **UP**.

If it shows **DOWN**, the likely cause is that Prometheus can't resolve `api:9090` within the shared network. Debug steps:
```bash
docker exec monitoring-prometheus-1 wget -qO- http://api:9090/metrics | head -5
```
If that fails, the API container's metrics port is not reachable and needs investigation.

### 2. Grafana dashboard datasource UID — POSSIBLY BROKEN
The pre-built dashboard JSON (`weather-api.json`) references `"uid": "prometheus"` as the datasource UID. The provisioned datasource in `grafana/provisioning/datasources/prometheus.yml` does **not** set an explicit UID, so Grafana auto-generates one.

**Fix:** Add `uid: prometheus` to the datasource provisioning file:
```yaml
# monitoring/grafana/provisioning/datasources/prometheus.yml
datasources:
  - name: Prometheus
    type: prometheus
    uid: prometheus        # ← add this line
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```
Then restart the monitoring stack:
```powershell
docker compose -f monitoring/docker-compose.yml restart grafana
```

### 3. Docker network name is project-prefixed
The monitoring compose file references `weather-predictor_weather-net` (not `weather-net`) because Docker Compose prefixes the project name. This is already correctly set in `monitoring/docker-compose.yml`. If the main stack is ever started with a different project name, this reference will break.

---

## How to Run

```powershell
# Full reset — rebuilds everything and starts all containers including monitoring
.\scripts\reset-docker.ps1
```

```powershell
# Monitoring stack only (if already running main stack)
docker compose -f monitoring/docker-compose.yml up -d
```

---

## Next Steps for the Next Agent

1. **Verify Prometheus targets are UP** — check `localhost:9091/targets`
2. **Fix datasource UID** — add `uid: prometheus` to `monitoring/grafana/provisioning/datasources/prometheus.yml` if the Grafana dashboard panels show "datasource not found"
3. **Restart Grafana** after the datasource fix: `docker compose -f monitoring/docker-compose.yml restart grafana`
4. **Verify the Weather API dashboard** loads with data in Grafana after making a search in the app
5. **Consider enhancing the dashboard** with app-specific panels — ranking request latency, cache hit ratio over time, weather fetch times per location type, etc.
