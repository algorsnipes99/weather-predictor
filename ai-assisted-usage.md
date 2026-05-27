# How AI Assisted This Project

This project was built with Claude (Anthropic's AI assistant) as a collaborative coding partner. This document is honest about what AI did, what the developer directed, and where human judgment was essential.

---

## The Honest Summary

AI wrote the majority of the code. The developer's role was to define the architecture upfront, make the key technical decisions, review the output, direct each phase, and catch issues the AI didn't anticipate.

The result is code that reflects the developer's design decisions — AI was the hands, not the mind.

---

## How the Work Was Divided

### What the developer decided

- The overall architecture: monorepo, GraphQL API, React frontend, Open-Meteo as the data source
- How activity scoring should work: weighted formulas, one scorer per activity, a shared interface
- That the mapper layer should exist to keep raw API shapes out of the scoring logic
- Which features to skip and why (no ski resort proximity, no refresh tokens, etc.)
- That auth should be JWT-based with bearer tokens rather than cookies, and why
- That monitoring should be a separate, independent stack — not bundled into the app
- The folder structure and naming conventions
- When output was wrong or needed redirection

### What AI did

- Implemented each phase once the design was agreed
- Wrote all TypeScript source files, test files, and fixture data
- Set up the GraphQL schema, Apollo Server, and resolver wiring
- Built the React components, hooks, and Apollo Client integration
- Implemented the JWT auth middleware and token endpoint
- Set up Docker, Prometheus, Grafana, and the metrics instrumentation
- Wrote the README and documentation files

---

## Phase by Phase

### Phase 1 — Backend

The developer provided a detailed specification in `ai-documentation/INSTRUCTIONS.md` and `PLAN.md`. AI implemented the full backend from that spec: weather types, mappers, four activity scorers, the ranking service, GraphQL schema, and the test suite (94 tests).

The spec was precise enough that AI could implement it directly. The developer reviewed the output and confirmed it matched the architectural intent.

### Phase 2 — React Frontend

With the backend complete, the developer directed AI to build the frontend: a React + Vite app using Google Places Autocomplete for location search, Apollo Client for GraphQL, and Tailwind for styling. AI scaffolded the component tree, wired the data flow, and handled the Vite proxy setup to avoid CORS issues in development.

### Phase 3 — Auth

The developer decided to add JWT bearer token authentication and wrote the plan in `ai-documentation/auth_plan.md`. AI implemented it: the `jwt.ts` helpers, Express middleware, the `/auth/token` endpoint, and the changes needed to switch from Apollo's standalone server to Express middleware.

The developer also asked for a plain-English explanation document (`auth_explanations.md`) so the auth decisions were understandable to anyone reading the codebase — AI wrote that too.

### Phase 4 — Metrics & Monitoring

The developer defined the monitoring architecture in `ai-documentation/metrics-plan.md`: separate stack, `prom-client` in the API, Prometheus scraping a metrics-only port, Grafana with a pre-built dashboard. AI implemented all of it — the metrics module, the monitoring Docker Compose setup, Prometheus config, and the Grafana dashboard JSON.

---

## Where AI Made Mistakes

- The Grafana dashboard JSON referenced a hardcoded datasource UID (`"uid": "prometheus"`) but the provisioning file didn't set that UID explicitly. This caused all dashboard panels to show "No data" on first boot. The developer caught it from the progress notes AI left and fixed it.
- AI's Glob tool missed a file (`metrics-progress.md`) when listing the documentation directory. The developer asked it to check again, and a direct shell listing found it.

---

## Judgment Calls AI Made (That Were Accepted)

- Marine fetch failures degrade surfing scores gracefully rather than failing the whole request — AI proposed this and the developer accepted it.
- The metrics server runs on its own port inside the container (not on the main API port) so Prometheus scrape traffic never competes with real GraphQL traffic — AI proposed this from the plan.
- The monitoring stack joins the main stack's Docker network as an external network rather than being bundled in — AI implemented the pattern the developer specified.

---

## Tools Used

| Tool | Purpose |
|---|---|
| Claude (Anthropic) | Primary AI coding assistant across all phases |
| Claude Code (CLI) | Interface used to run Claude directly in the terminal alongside the codebase |

---

## What This Demonstrates

Using AI well on a project like this requires the same skills as working with a capable but junior engineer: clear specifications, architectural decisions made upfront, careful review of output, and knowing when to redirect. The AI accelerated implementation significantly — but the architecture, the trade-offs, and the quality bar were all set by the developer.
