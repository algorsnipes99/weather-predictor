# Metrics & Monitoring Plan

## Goal

Add non-blocking Prometheus metrics to the API and expose them via a Grafana dashboard. The monitoring stack (Prometheus + Grafana) is a **separate, independent concern** from the application — it lives in its own directory and is started independently via its own `docker-compose.yml`.

---

## Architecture Overview

```
┌─────────────────────────────────────┐     ┌──────────────────────────────────┐
│         docker-compose.yml          │     │   monitoring/docker-compose.yml  │
│                                     │     │                                  │
│  api (port 4000)                    │     │  prometheus                      │
│    └─ metrics server (port 9090) ◄──┼─────┼── scrapes api:9090 every 15s    │
│                                     │     │        │                         │
│  web (port 3000)                    │     │  grafana (port 3001)             │
│  db  (postgres)                     │     │    └─ reads from prometheus      │
└─────────────────────────────────────┘     └──────────────────────────────────┘
```

The application has no knowledge of Prometheus or Grafana. Its only responsibility is exposing a `/metrics` endpoint. The monitoring stack is opt-in — developers run it separately when they need it.

---

## Why a Separate Monitoring Stack

Bundling Prometheus and Grafana into the application's `docker-compose.yml` is a common shortcut but not how teams operate in practice:

- In production, Prometheus and Grafana are **centralized and shared** across many services — not one instance per app.
- The application should have no dependency on its observability tooling. The app starts and runs correctly whether or not the monitoring stack is running.
- A separate `monitoring/docker-compose.yml` makes it clear that monitoring is infrastructure, not application code.
- In a real environment this would typically be a managed service (Grafana Cloud, Datadog, etc.) or a platform-team-owned deployment. The pattern here mirrors that: the app exposes metrics, something else consumes them.

---

## Repository Structure

```
apps/
  api/                          existing
  web/                          existing
monitoring/                     new — config only, no code, no npm
  docker-compose.yml
  prometheus/
    prometheus.yml
  grafana/
    provisioning/
      datasources/
        prometheus.yml
      dashboards/
        dashboards.yml
    dashboards/
      weather-api.json
```

`docker-compose.yml` (root) stays unchanged — api, web, db only.

---

## Why Option B (separate metrics server port)

The metrics endpoint runs on its own port (`9090`) inside the API process, separate from the GraphQL API (`4000`):

- Prometheus scrape traffic never competes with real GraphQL requests.
- Port `9090` is not exposed to the host — only reachable within the Docker network that both compose files share.
- Easy to disable in production by simply not starting the metrics server.

The metrics server is a plain `node:http` server — no Express, no middleware stack, minimal overhead.

---

## How the Two Compose Files Share a Network

The monitoring stack needs to reach `api:9090`. This is achieved by having both compose files join the same external Docker network:

```yaml
# docker-compose.yml (root) — declares the network as external: false (owned here)
networks:
  weather-net:
    driver: bridge

# monitoring/docker-compose.yml — joins the same network as external
networks:
  weather-net:
    external: true
```

Prometheus config then targets `api:9090` by service name, which Docker DNS resolves within the shared network.

---

## New Files to Create

### Metrics module — `apps/api/src/metrics/`

| File | Purpose |
|---|---|
| `registry.ts` | Singleton `Registry` + every metric definition exported from one place. All other files import metrics from here — nothing creates metrics ad-hoc elsewhere. |
| `metrics.server.ts` | Plain `http.createServer` on `METRICS_PORT` (default `9090`). Serves Prometheus text format at `GET /metrics`. Started in `index.ts` alongside the main server. |
| `http.middleware.ts` | Express middleware that records HTTP request duration and total count. Uses `process.hrtime.bigint()` for nanosecond precision with zero I/O. Hooks `res.on('finish')` which fires synchronously in Node's HTTP pipeline. |
| `apollo.plugin.ts` | Apollo plugin that hooks `requestDidStart` → `willSendResponse` to record GraphQL operation duration and error count. Labelled by operation name. |

### Monitoring stack — `monitoring/`

| File | Purpose |
|---|---|
| `docker-compose.yml` | Starts Prometheus and Grafana. Joins the existing `weather-net` Docker network as external. |
| `prometheus/prometheus.yml` | Scrape config — targets `api:9090`, 15s scrape interval. |
| `grafana/provisioning/datasources/prometheus.yml` | Auto-wires Prometheus as a Grafana datasource on first boot — no manual setup required. |
| `grafana/provisioning/dashboards/dashboards.yml` | Tells Grafana where to find dashboard JSON files on disk. |
| `grafana/dashboards/weather-api.json` | Pre-built dashboard JSON with all panels defined below. |

---

## Files to Modify

| File | Change |
|---|---|
| `apps/api/src/index.ts` | Import and start `metrics.server.ts`; register HTTP middleware on the Express app; pass Apollo plugin to `ApolloServer`. |
| `apps/api/src/modules/weather/open-meteo.client.ts` | Wrap `getForecast` and `getMarineForecast` with `hrtime` start/end to record fetch duration and errors. |
| `apps/api/src/modules/rankings/ranking-cache.repository.ts` | Increment hit/miss counters in `get()` based on result. Add write duration histogram around `set()`. |
| `apps/api/package.json` | Add `prom-client` — the only new dependency. |
| `docker-compose.yml` | Add `METRICS_PORT: 9090` env var to the `api` service only. No Prometheus or Grafana added here. |

---

## Metrics Catalogue

| Metric | Type | Labels | Captured in |
|---|---|---|---|
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` | HTTP middleware |
| `http_requests_total` | Counter | `method`, `route`, `status_code` | HTTP middleware |
| `graphql_operation_duration_seconds` | Histogram | `operation_name` | Apollo plugin |
| `graphql_errors_total` | Counter | `operation_name` | Apollo plugin |
| `weather_fetch_duration_seconds` | Histogram | `type` (`forecast` / `marine`) | Open-Meteo client |
| `weather_fetch_errors_total` | Counter | `type` | Open-Meteo client |
| `ranking_cache_hits_total` | Counter | — | Cache repository |
| `ranking_cache_misses_total` | Counter | — | Cache repository |
| `ranking_cache_write_duration_seconds` | Histogram | — | Cache repository |
| Node.js process metrics (heap, CPU, event loop lag, GC) | Auto | — | `prom-client` `collectDefaultMetrics` |

---

## Grafana Dashboard Panels

| Panel | Query |
|---|---|
| Request rate by route | `rate(http_requests_total[1m])` grouped by `route` |
| p95 HTTP response time | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` |
| GraphQL operation duration (p50 / p95) | `histogram_quantile` on `graphql_operation_duration_seconds_bucket` by `operation_name` |
| GraphQL error rate | `rate(graphql_errors_total[1m])` by `operation_name` |
| Weather fetch duration (forecast vs marine) | `histogram_quantile(0.95, ...)` on `weather_fetch_duration_seconds_bucket` by `type` |
| Weather fetch error rate | `rate(weather_fetch_errors_total[1m])` by `type` |
| Cache hit ratio | `ranking_cache_hits_total / (ranking_cache_hits_total + ranking_cache_misses_total)` as a stat panel |
| Node.js heap used | `nodejs_heap_size_used_bytes` |
| Event loop lag | `nodejs_eventloop_lag_seconds` |

---

## How to Run

**Start the application (as normal):**
```bash
docker compose up
```

**Start the monitoring stack separately (when needed):**
```bash
docker compose -f monitoring/docker-compose.yml up
```

Grafana is available at `http://localhost:3001` (default credentials: `admin` / `admin`).
The dashboard loads automatically — no manual configuration required.

---

## Prometheus Scrape Config

```yaml
# monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: weather-api
    static_configs:
      - targets:
          - api:9090
```

---

## Implementation Order

1. Add `prom-client` to `apps/api/package.json`
2. Create `apps/api/src/metrics/registry.ts` — define all metrics in one place
3. Create `apps/api/src/metrics/metrics.server.ts` — separate HTTP server on port 9090
4. Create `apps/api/src/metrics/http.middleware.ts` — Express request instrumentation
5. Create `apps/api/src/metrics/apollo.plugin.ts` — GraphQL operation instrumentation
6. Modify `apps/api/src/modules/weather/open-meteo.client.ts` — weather fetch instrumentation
7. Modify `apps/api/src/modules/rankings/ranking-cache.repository.ts` — cache hit/miss instrumentation
8. Modify `apps/api/src/index.ts` — wire everything together, add `METRICS_PORT` env var to root `docker-compose.yml`
9. Create `monitoring/prometheus/prometheus.yml`
10. Create `monitoring/grafana/provisioning/` config files
11. Create `monitoring/grafana/dashboards/weather-api.json`
12. Create `monitoring/docker-compose.yml`

---

## What This Does NOT Cover

- Alerting rules (Prometheus Alertmanager) — can be added later as another service in `monitoring/docker-compose.yml`
- Distributed tracing (OpenTelemetry) — separate concern, heavier setup
- Log aggregation (Loki/Elasticsearch) — out of scope for this phase
- Authentication on the Grafana instance — default `admin/admin`, suitable for local/dev only
- Persisting Prometheus data beyond container restarts — add a named volume to `monitoring/docker-compose.yml` if retention is needed
