# Metrics & Monitoring Overview

## What Is Monitoring?

Monitoring is how you know your app is healthy — and how you find out when it isn't.

Without monitoring, if the app slows down or starts throwing errors at 2am, you won't know until a user complains. With monitoring, you can see exactly what's happening in real time: how fast requests are being handled, whether the weather API is responding, whether the cache is doing its job, and whether anything looks unusual.

This project has a full monitoring setup that runs alongside the app and requires no manual configuration.

---

## The Two Tools

### Prometheus — the data collector

Prometheus is a piece of software that regularly visits the app (every 15 seconds) and asks: "what's your current state?" The app responds with a list of numbers — how many requests it handled, how long they took, how many errors occurred, and so on. Prometheus stores all of these numbers over time, building up a historical picture.

Think of Prometheus as a logbook that automatically records readings from the app on a fixed schedule.

### Grafana — the dashboard

Grafana reads from Prometheus and turns the numbers into charts and graphs that are easy to understand at a glance. It's the thing you actually look at.

The app ships with a pre-built dashboard called **Weather API** that loads automatically — no setup required. Open it at `http://localhost:3001` (login: `admin` / `admin`).

---

## What the Dashboard Shows

The Weather API dashboard has nine panels:

| Panel | What It Tells You |
|---|---|
| **HTTP Request Rate by Route** | How many requests per second each API endpoint is receiving. A spike here means the app is busy. |
| **HTTP p95 Response Time** | How long the slowest 5% of requests take to complete. A healthy API should respond in under a second. |
| **GraphQL Operation Duration** | How long the `activityRankings` query takes end-to-end — from receiving the request to sending back the results. |
| **GraphQL Error Rate** | How often queries are returning errors. Ideally this is zero. |
| **Weather Fetch Duration** | How long it takes to get data from Open-Meteo. Shown separately for the general forecast and the marine forecast. If this climbs, Open-Meteo may be slow. |
| **Weather Fetch Error Rate** | How often calls to Open-Meteo are failing. A non-zero number here means weather data may be unavailable. |
| **Cache Hit Ratio** | What percentage of searches are being served from the cache rather than calling Open-Meteo again. Higher is better — it means less waiting for users and fewer calls to the external API. |
| **Node.js Heap Used** | How much memory the app is using. A number that grows without levelling off could indicate a memory leak. |
| **Event Loop Lag** | A measure of how busy the app's internal processing queue is. High lag means the app may be struggling to keep up with requests. |

---

## Why Is the Monitoring Stack Separate?

The app and the monitoring stack start independently:

```
docker compose up                                  ← starts the app
docker compose -f monitoring/docker-compose.yml up ← starts monitoring separately
```

This is intentional, and mirrors how monitoring works in real production environments. In a real company, Prometheus and Grafana are shared infrastructure — one central installation watches dozens or hundreds of services. It wouldn't make sense to bundle a separate copy of Grafana into every individual app.

Keeping them separate also means: if Prometheus or Grafana goes down, the app keeps running. The monitoring is purely observational — it reads from the app, it never writes to it.

---

## How the App Exposes Its Data

The app runs a small, separate server inside the same container on port 9090 (not exposed to your browser — only reachable by Prometheus within the internal Docker network). That server responds to requests from Prometheus with a list of current metric readings in a standard text format.

The app measures:

- Every HTTP request: method, route, status code, duration
- Every GraphQL operation: name, duration, whether it errored
- Every call to Open-Meteo: type (forecast or marine), duration, whether it failed
- Every cache lookup: hit or miss, and how long writes take
- General Node.js health: memory usage, CPU, event loop activity

None of this affects the app's normal behaviour — the measurements happen silently in the background.

---

## What This Does Not Cover

- **Alerting** — Prometheus can send alerts (e.g. page someone if error rate exceeds a threshold), but Alertmanager is not configured here. The dashboard is for observation, not automated response.
- **Log aggregation** — individual log lines from the app are not collected or searchable here. That would require a separate tool (e.g. Loki or Elasticsearch).
- **Production-grade security** — Grafana uses default `admin`/`admin` credentials, which is fine for local development but must be changed before any public deployment.
