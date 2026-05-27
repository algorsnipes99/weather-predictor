# Weather Activity Ranker

Ranks four activities (Skiing, Surfing, Outdoor Sightseeing, Indoor Sightseeing) for any location over the next 7 days, based on live weather data from Open-Meteo.

---

## Setup

**1. Copy the env file and fill in your values:**

```bash
cp .env.example .env
```

Open `.env` and set:

| Variable | Required | Description |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key (enables location search) |
| `POSTGRES_PASSWORD` | Yes | Postgres password — change from the default |
| `JWT_SECRET` | Recommended | Secret used to sign auth tokens — set a long random string in production |
| `POSTGRES_DB` | No | Database name (default: `weather_predictor`) |
| `POSTGRES_USER` | No | Database user (default: `weather`) |

**2. Run the reset script — builds everything and starts all containers:**

```powershell
# Windows
.\scripts\reset-docker.ps1
```

```bash
# Mac / Linux
./scripts/reset-docker.sh
```

That's it. All services will be running.

---

## URLs

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| GraphQL API | http://localhost:4000/graphql |
| Grafana dashboard | http://localhost:3001 &nbsp;(`admin` / `admin`) |
| Prometheus | http://localhost:9091 |

---

## Auth

All GraphQL requests require a bearer token. Get one with:

```bash
curl -s -X POST http://localhost:4000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo"}' | jq .token
```

Then pass it as `Authorization: Bearer <token>` on every GraphQL request.

---

## Day-to-day commands

```bash
./deploy.sh logs      # follow logs for all services
./deploy.sh down      # stop and remove all containers
./deploy.sh up        # build and start (main stack only)
./deploy.sh rebuild   # rebuild from scratch (no cache) and start
```

The `reset-docker` script is the recommended way to do a full reset — it tears down and restarts both the main stack and the monitoring stack (Prometheus + Grafana) in one step. `deploy.sh` only manages the main stack.

---

## Running tests

```bash
npm install
npm run test --workspace=apps/api
```

---

## Architecture

```
Browser
  └─ React + Apollo Client (Vite, Tailwind, Google Places)
       └─ POST /graphql  →  Apollo Server (Node.js, Express)
            ├─ requireAuth  →  JWT verification
            ├─ WeatherService  →  Open-Meteo forecast + marine API
            │    └─ Mapper layer  →  normalised DailyWeather[]
            └─ ActivityRankingService
                 ├─ SkiingScorer
                 ├─ SurfingScorer
                 ├─ OutdoorSightseeingScorer
                 └─ IndoorSightseeingScorer  →  sorted ActivityRanking[]
```

Results are cached in Postgres (6-hour TTL, keyed by lat/lon rounded to 2 decimal places).

A separate metrics server runs on port 9090 inside the container, scraped by Prometheus every 15 seconds. Grafana provides a pre-built dashboard with HTTP latency, GraphQL operation timing, weather fetch durations, and cache hit ratio.

---

## Further reading

| Document | What it covers |
|---|---|
| [backend-overview.md](backend-overview.md) | How the backend works — scoring, weather pipeline, caching, and key limitations, written for a non-technical audience |
| [frontend-overview.md](frontend-overview.md) | How the frontend works — the search flow, Google Places, and how it talks to the backend |
| [metrics-overview.md](metrics-overview.md) | What Prometheus and Grafana are doing, what each dashboard panel means, and why monitoring is a separate stack |
| [code-navigation.md](code-navigation.md) | A map of every important file in the codebase — start here when reviewing the code |
| [ai-assisted-usage.md](ai-assisted-usage.md) | How AI was used across this project: what it built, what the developer directed, and where mistakes were made |

---

## Omissions & trade-offs

| Area | Status | Notes |
|---|---|---|
| Ski resort proximity | Not checked | Scorer assumes the location is near a resort |
| Coastline proximity | Not checked | Surfing scores any location that has marine data |
| Refresh tokens | Not implemented | JWT expires after 1 hour; user must re-authenticate |
| Real user store | Faked | Login accepts hardcoded `demo`/`demo` credentials |
| Timezone resolution | Skipped | Would require a second API call after place selection |
| Mobile layout | Functional only | Not optimised for small screens |
| Alerting | Not configured | Prometheus Alertmanager can be added to the monitoring stack |
