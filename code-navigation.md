# Code Navigation Guide

A map of where to find the important parts of this codebase. Start here if you're reviewing the project.

---

## The Big Picture

```
weather-predictor/
  apps/
    api/        ← Node.js backend (GraphQL, scoring logic, weather fetching)
    web/        ← React frontend (search UI, results display)
  monitoring/   ← Prometheus + Grafana config (no application code)
```

---

## Where a Request Starts

| What you're looking for | File |
|---|---|
| Express app setup, server startup, everything wired together | [apps/api/src/index.ts](apps/api/src/index.ts) |
| GraphQL schema — all types, inputs, enums defined in SDL | [apps/api/src/graphql/schema.ts](apps/api/src/graphql/schema.ts) |
| GraphQL resolver — where an incoming query actually lands | [apps/api/src/graphql/resolvers.ts](apps/api/src/graphql/resolvers.ts) |

The resolver is intentionally thin — it calls two services and returns the result. All real logic is one level down.

---

## The Scoring Logic

This is the heart of the app. Each activity has its own dedicated scorer.

| What you're looking for | File |
|---|---|
| The scorer contract (the interface every scorer implements) | [apps/api/src/modules/activities/scoring/activity-scorer.interface.ts](apps/api/src/modules/activities/scoring/activity-scorer.interface.ts) |
| Shared base class (common helpers used by all scorers) | [apps/api/src/modules/activities/scoring/base-activity-scorer.ts](apps/api/src/modules/activities/scoring/base-activity-scorer.ts) |
| Skiing scorer — snowfall, temperature, wind, rain | [apps/api/src/modules/activities/scoring/skiing.scorer.ts](apps/api/src/modules/activities/scoring/skiing.scorer.ts) |
| Surfing scorer — wave height, wave period, wind, marine availability | [apps/api/src/modules/activities/scoring/surfing.scorer.ts](apps/api/src/modules/activities/scoring/surfing.scorer.ts) |
| Outdoor sightseeing scorer — temperature comfort, dryness, wind, cloud | [apps/api/src/modules/activities/scoring/outdoor-sightseeing.scorer.ts](apps/api/src/modules/activities/scoring/outdoor-sightseeing.scorer.ts) |
| Indoor sightseeing scorer — inverse of outdoor conditions | [apps/api/src/modules/activities/scoring/indoor-sightseeing.scorer.ts](apps/api/src/modules/activities/scoring/indoor-sightseeing.scorer.ts) |
| Ranking service — collects all scorer results and sorts by score | [apps/api/src/modules/activities/activity-ranking.service.ts](apps/api/src/modules/activities/activity-ranking.service.ts) |
| All activity-related TypeScript types | [apps/api/src/modules/activities/activity.types.ts](apps/api/src/modules/activities/activity.types.ts) |

**To add a new activity:** create a new scorer implementing the interface above, then register it in `index.ts`. Nothing else needs changing.

---

## The Weather Data Pipeline

Raw Open-Meteo API data flows through a mapper layer before it ever reaches the scoring logic.

| What you're looking for | File |
|---|---|
| Weather service — orchestrates forecast + marine fetch, handles marine failure gracefully | [apps/api/src/modules/weather/weather.service.ts](apps/api/src/modules/weather/weather.service.ts) |
| Open-Meteo HTTP client — the actual API calls to open-meteo.com | [apps/api/src/modules/weather/open-meteo.client.ts](apps/api/src/modules/weather/open-meteo.client.ts) |
| Forecast mapper — translates raw Open-Meteo response into internal `DailyWeather[]` | [apps/api/src/modules/weather/open-meteo.mapper.ts](apps/api/src/modules/weather/open-meteo.mapper.ts) |
| Marine mapper — translates raw marine response into internal `DailyMarineWeather[]` | [apps/api/src/modules/weather/open-meteo-marine.mapper.ts](apps/api/src/modules/weather/open-meteo-marine.mapper.ts) |
| Raw Open-Meteo response types (what the API actually returns) | [apps/api/src/modules/weather/open-meteo.types.ts](apps/api/src/modules/weather/open-meteo.types.ts) |
| Internal normalised weather types (what the scorers work with) | [apps/api/src/modules/weather/weather.types.ts](apps/api/src/modules/weather/weather.types.ts) |

The mapper layer is the reason no scorer ever imports anything from `open-meteo.types.ts`. External API shapes are kept completely isolated from business logic.

---

## Caching

| What you're looking for | File |
|---|---|
| Cache read/write logic — Postgres-backed, 6-hour TTL, keyed by lat/lon | [apps/api/src/modules/rankings/ranking-cache.repository.ts](apps/api/src/modules/rankings/ranking-cache.repository.ts) |

---

## Authentication

| What you're looking for | File |
|---|---|
| JWT sign and verify helpers | [apps/api/src/auth/jwt.ts](apps/api/src/auth/jwt.ts) |
| Express middleware — extracts Bearer token from header, verifies it, blocks unauthenticated requests | [apps/api/src/auth/auth.middleware.ts](apps/api/src/auth/auth.middleware.ts) |
| Login endpoint — `POST /auth/token`, returns a signed JWT | [apps/api/src/auth/auth.router.ts](apps/api/src/auth/auth.router.ts) |

Demo credentials: `username: demo`, `password: demo`. See [auth_plan.md](ai-documentation/auth_plan.md) for why bearer tokens were chosen over cookies.

---

## Shared Utilities

| What you're looking for | File |
|---|---|
| `clamp`, `average`, `roundScore` — used by all scorers | [apps/api/src/shared/math.ts](apps/api/src/shared/math.ts) |
| `labelForScore` — converts a 0–100 score to EXCELLENT / GOOD / FAIR / POOR | [apps/api/src/shared/labels.ts](apps/api/src/shared/labels.ts) |
| Location type (`ResolvedLocation`) | [apps/api/src/modules/location/location.types.ts](apps/api/src/modules/location/location.types.ts) |

---

## Metrics Instrumentation

| What you're looking for | File |
|---|---|
| All metric definitions in one place (the single source of truth) | [apps/api/src/metrics/registry.ts](apps/api/src/metrics/registry.ts) |
| Standalone metrics HTTP server on port 9090 (scraped by Prometheus) | [apps/api/src/metrics/metrics.server.ts](apps/api/src/metrics/metrics.server.ts) |
| Express middleware that records HTTP request duration and count | [apps/api/src/metrics/http.middleware.ts](apps/api/src/metrics/http.middleware.ts) |
| Apollo plugin that records GraphQL operation duration and errors | [apps/api/src/metrics/apollo.plugin.ts](apps/api/src/metrics/apollo.plugin.ts) |

---

## Tests

Tests live next to the files they test (`.test.ts` files co-located with source). Fixtures are shared.

| What you're looking for | File |
|---|---|
| Shared location fixtures (Cape Town, Zermatt, London) | [apps/api/src/test/fixtures/locations.fixture.ts](apps/api/src/test/fixtures/locations.fixture.ts) |
| Raw Open-Meteo forecast fixtures (mixed, snowy, extreme bad weather) | [apps/api/src/test/fixtures/open-meteo-forecast.fixture.ts](apps/api/src/test/fixtures/open-meteo-forecast.fixture.ts) |
| Raw Open-Meteo marine fixtures (good surf, poor surf) | [apps/api/src/test/fixtures/open-meteo-marine.fixture.ts](apps/api/src/test/fixtures/open-meteo-marine.fixture.ts) |
| Normalised weather fixtures (used directly by scorer tests) | [apps/api/src/test/fixtures/normalized-weather.fixture.ts](apps/api/src/test/fixtures/normalized-weather.fixture.ts) |
| Vitest config | [apps/api/vitest.config.ts](apps/api/vitest.config.ts) |

Run tests with: `npm run test --workspace=apps/api`

---

## Frontend

| What you're looking for | File |
|---|---|
| React app root — Google Maps setup, wires search to results | [apps/web/src/App.tsx](apps/web/src/App.tsx) |
| Apollo Client setup (GraphQL connection) | [apps/web/src/graphql/client.ts](apps/web/src/graphql/client.ts) |
| GraphQL query document (what the frontend asks the backend for) | [apps/web/src/graphql/queries.ts](apps/web/src/graphql/queries.ts) |
| TypeScript types mirroring the GraphQL schema | [apps/web/src/graphql/types.ts](apps/web/src/graphql/types.ts) |
| Hook that fires the query and manages loading/error state | [apps/web/src/hooks/useActivityRankings.ts](apps/web/src/hooks/useActivityRankings.ts) |
| Search bar with Google Places Autocomplete | [apps/web/src/components/SearchBar.tsx](apps/web/src/components/SearchBar.tsx) |
| Activity result card (score, label, summary, expand toggle) | [apps/web/src/components/ActivityCard.tsx](apps/web/src/components/ActivityCard.tsx) |
| 7-day daily breakdown table | [apps/web/src/components/DailyBreakdown.tsx](apps/web/src/components/DailyBreakdown.tsx) |
| Coloured score label chip | [apps/web/src/components/ScoreBadge.tsx](apps/web/src/components/ScoreBadge.tsx) |
| Loading / error / results state manager | [apps/web/src/components/ResultsSection.tsx](apps/web/src/components/ResultsSection.tsx) |

---

## Infrastructure

| What you're looking for | File |
|---|---|
| Main Docker Compose (api, web, db) | [docker-compose.yml](docker-compose.yml) |
| Monitoring Docker Compose (Prometheus, Grafana) | [monitoring/docker-compose.yml](monitoring/docker-compose.yml) |
| Prometheus scrape config | [monitoring/prometheus/prometheus.yml](monitoring/prometheus/prometheus.yml) |
| Grafana datasource provisioning | [monitoring/grafana/provisioning/datasources/prometheus.yml](monitoring/grafana/provisioning/datasources/prometheus.yml) |
| Grafana dashboard JSON | [monitoring/grafana/dashboards/weather-api.json](monitoring/grafana/dashboards/weather-api.json) |
| Full reset script (tears down and restarts everything) | [scripts/reset-docker.ps1](scripts/reset-docker.ps1) |
