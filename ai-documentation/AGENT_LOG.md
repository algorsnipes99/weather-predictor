# Agent Log — Weather Predictor Backend Phase 1

**Date:** 2026-05-23
**Agent:** Claude Sonnet 4.6

---

## Summary

Built the complete Phase 1 backend for the weather-based activity ranking application as specified in INSTRUCTIONS.md and PLAN.md. All source files, fixtures, and test files have been created under `apps/api/`. No npm install was run — packages are declared in package.json only.

---

## Files Created

### Config / Project Setup
- `apps/api/package.json` — ESM Node.js package with Apollo Server, graphql, zod, TypeScript, tsx, vitest
- `apps/api/tsconfig.json` — ES2022 target, ESNext module, bundler moduleResolution
- `apps/api/vitest.config.ts` — globals: true

### Shared Utilities
- `apps/api/src/shared/math.ts` — `clamp`, `average`, `roundScore`
- `apps/api/src/shared/labels.ts` — `ScoreLabel` type and `labelForScore` (EXCELLENT/GOOD/FAIR/POOR)
- `apps/api/src/shared/errors.ts` — `WeatherFetchError`, `InvalidLocationError`

### Location Module
- `apps/api/src/modules/location/location.types.ts` — `ResolvedLocation` interface

### Weather Module
- `apps/api/src/modules/weather/weather.types.ts` — `DailyWeather`, `DailyMarineWeather`, `SevenDayWeather`
- `apps/api/src/modules/weather/open-meteo.types.ts` — Raw API response shapes: `OpenMeteoForecastResponse`, `OpenMeteoMarineResponse`
- `apps/api/src/modules/weather/open-meteo.mapper.ts` — Maps raw forecast response to `DailyWeather[]`
- `apps/api/src/modules/weather/open-meteo-marine.mapper.ts` — Maps raw marine response to `DailyMarineWeather[]`
- `apps/api/src/modules/weather/open-meteo.client.ts` — `OpenMeteoClient` interface + `HttpOpenMeteoClient` class (uses native fetch)
- `apps/api/src/modules/weather/weather.service.ts` — `WeatherService.getSevenDayWeather()` — fetches forecast + marine (marine failure degrades gracefully)

### Activities Module
- `apps/api/src/modules/activities/activity.types.ts` — `Activity`, `DailyActivityScore`, `ActivityRanking`, `ActivityScoringInput`, `ActivityRankingResult`
- `apps/api/src/modules/activities/scoring/activity-scorer.interface.ts` — `ActivityScorer` interface
- `apps/api/src/modules/activities/scoring/skiing.scorer.ts` — `SkiingScorer` (weights: snowfall 40%, temp 30%, precip 20%, wind 10%)
- `apps/api/src/modules/activities/scoring/surfing.scorer.ts` — `SurfingScorer` (weights: wave height 45%, wave period 25%, wind 20%, weather comfort 10%; returns score=5 with specific reason when marine data absent)
- `apps/api/src/modules/activities/scoring/outdoor-sightseeing.scorer.ts` — `OutdoorSightseeingScorer` (weights: temp comfort 40%, dryness 30%, wind 15%, weather code 10%, cloud 5%)
- `apps/api/src/modules/activities/scoring/indoor-sightseeing.scorer.ts` — `IndoorSightseeingScorer` (inverse outdoor — weights: rain 35%, uncomfortable temp 25%, wind 15%, bad weather code 25%)
- `apps/api/src/modules/activities/activity-ranking.service.ts` — `ActivityRankingService.rank()` — calls all scorers, sorts descending by score

### GraphQL Layer
- `apps/api/src/graphql/schema.ts` — SDL typeDefs with `activityRankings` query, all types and enums
- `apps/api/src/graphql/resolvers.ts` — Thin resolver delegating to `WeatherService` + `ActivityRankingService` via context
- `apps/api/src/index.ts` — Apollo Server startup, wires together all dependencies, listens on port 4000

### Test Fixtures
- `apps/api/src/test/fixtures/locations.fixture.ts` — `capeTownLocation`, `zermattLocation`, `londonLocation`
- `apps/api/src/test/fixtures/open-meteo-forecast.fixture.ts` — `mixedForecastResponse` (Cape Town mixed), `snowyForecastResponse` (Zermatt), `extremeBadWeatherResponse` (London)
- `apps/api/src/test/fixtures/open-meteo-marine.fixture.ts` — `goodSurfMarineResponse` (1-2.5m waves, 7-13s periods), `poorSurfMarineResponse` (0.1-0.3m waves, 3-5s periods)
- `apps/api/src/test/fixtures/normalized-weather.fixture.ts` — `mixedDailyWeather`, `snowyDailyWeather`, `badWeatherDailyWeather`, `goodSurfMarineWeather`, `poorSurfMarineWeather`

### Test Files
- `apps/api/src/modules/weather/open-meteo.mapper.test.ts` — 10 tests: array length, date alignment, field mapping, optional cloudCoverPercent
- `apps/api/src/modules/weather/open-meteo-marine.mapper.test.ts` — 10 tests: array length, wave fields, absent optional fields
- `apps/api/src/modules/activities/scoring/skiing.scorer.test.ts` — Tests high score for snowy/cold, low score for warm/no-snow, reasons content
- `apps/api/src/modules/activities/scoring/surfing.scorer.test.ts` — Tests good wave conditions, poor waves, missing marine data (score=5 + specific reason), partial marine data
- `apps/api/src/modules/activities/scoring/outdoor-sightseeing.scorer.test.ts` — Tests pleasant days, extreme bad weather, perfect day, severe weather code impact
- `apps/api/src/modules/activities/scoring/indoor-sightseeing.scorer.test.ts` — Tests heavy rain/wind gives high score, pleasant weather gives low score, extreme cold/hot increases score, windy conditions
- `apps/api/src/modules/activities/activity-ranking.service.test.ts` — Tests sort order, all 4 activities present, generatedAt ISO format, location passthrough, daily breakdowns, edge cases (0 scorers, 1 scorer)

---

## What Is Complete (Phase 1)

- All TypeScript source files implemented with exact code from INSTRUCTIONS.md
- All normalized domain types defined
- Open-Meteo raw response types and mapper layer (forecast + marine)
- All 4 activity scorers implemented with weighted scoring formulas
- Activity ranking service that aggregates and sorts
- GraphQL schema (SDL) and thin resolver
- Apollo Server entry point (`src/index.ts`)
- Full test suite: 7 test files covering mappers, all 4 scorers, and ranking service
- Raw API fixtures (3 forecast scenarios + 2 marine scenarios)
- Normalized weather fixtures derived from raw fixtures
- Marine failure degrades surfing gracefully (no crash, score=5 with clear reason)

---

## What Is NOT Done Yet (Phase 2+)

- **React frontend** — Not started. Will need a browser app with location search UI
- **Google Maps / Google Places Autocomplete** — Location resolution from free-text city name is out of scope for Phase 1
- **npm install** — Dependencies declared but not installed; run `npm install` inside `apps/api/` before running tests or building
- **README.md** — Project-level readme with architecture overview, setup instructions, trade-offs (ski resort proximity not checked, coastline proximity not checked)
- **Real Open-Meteo API integration testing** — Tests use fixtures only; no end-to-end HTTP tests
- **Authentication** — No auth layer
- **Persistence / Database** — No caching or storage
- **Deployment** — No Docker, CI/CD, or hosting config
- **Geocoding API** — Backend could accept free-text location and resolve via Open-Meteo Geocoding API (alternative to Google Maps)
- **Location validation** — No Zod schema validation on GraphQL inputs yet
- **Resolver integration tests** — `activity-ranking.resolver.test.ts` and `weather.service.test.ts` are optional and not yet written
- **Monorepo workspace config** — Only `apps/api` exists; no root `package.json` workspace setup

---

## Key Architectural Decisions

1. **Mapper isolation** — Raw Open-Meteo response shapes never leak into scoring logic. All scorers receive normalized `DailyWeather[]` / `DailyMarineWeather[]`.

2. **Scorer interface pattern** — Each activity implements `ActivityScorer` with a `score(input)` method. Adding a new activity only requires a new scorer class + registration in `index.ts`.

3. **Marine data graceful degradation** — `WeatherService` catches marine fetch errors (`.catch(() => undefined)`). `SurfingScorer` returns score=5 with `"Marine forecast unavailable for this location/date."` reason when marine data is missing — no thrown errors.

4. **Context-based dependency injection** — Apollo Server context provides `weatherService` and `activityRankingService` to the resolver, making both mockable for future integration tests.

5. **ESM modules** — `"type": "module"` in package.json. All imports use TypeScript paths without explicit `.js` extensions (handled by bundler moduleResolution in tsconfig).

6. **Scoring formulas** — Weighted linear combinations clamped to [0, 100] with `roundScore` for integer outputs. Labels derived from fixed thresholds (85/65/40).

---

## Instructions for the Next Agent

1. **Install dependencies first:**
   ```bash
   cd c:\dev\weather-predictor\apps\api
   npm install
   ```

2. **Run tests to confirm all pass:**
   ```bash
   npm test
   ```

3. **To start the dev server:**
   ```bash
   npm run dev
   ```
   Server starts at `http://localhost:4000/graphql`

4. **Phase 2 starting point:** Create `apps/web/` with a React + Vite frontend. Use Google Places Autocomplete to let users type a city name, resolve to `ResolvedLocation`, then call the GraphQL endpoint. Display ranked activities with scores and daily breakdowns.

5. **Known test considerations:**
   - The surfing scorer test for "decent score >= 50" with mixed weather + good marine may need tuning if scoring formula produces a score just under 50 on certain edge cases. The fixture days include high-wind days (45km/h on day 4) that reduce surfing scores.
   - All score threshold assertions in tests are based on manual calculation from the fixture data and scoring formulas. If you change scoring weights, update the test thresholds accordingly.

6. **File locations summary:**
   - Source: `c:\dev\weather-predictor\apps\api\src\`
   - Tests: co-located with source (`.test.ts` files next to their subjects)
   - Fixtures: `c:\dev\weather-predictor\apps\api\src\test\fixtures\`

---

## Phase 2 — React Frontend (2026-05-24)

### Summary

Built the full React frontend under `apps/web/`. The app uses Vite + React + TypeScript + Tailwind CSS + Apollo Client + Google Places Autocomplete. A user types a city, selects from the Places dropdown, and the resolved coordinates are sent to the GraphQL backend. Results are rendered as ranked activity cards with an expandable 7-day daily breakdown.

### Files Created (Phase 2)

**Config / Scaffold**
- `package.json` (root) — npm workspaces: `apps/api`, `apps/web`; `dev:api` and `dev:web` scripts
- `apps/web/package.json` — React, Apollo Client, @react-google-maps/api, Vite, Tailwind
- `apps/web/tsconfig.json` — ES2022, react-jsx, bundler moduleResolution
- `apps/web/vite.config.ts` — Vite proxy: `/graphql → http://localhost:4000` (avoids CORS for dev)
- `apps/web/index.html`
- `apps/web/tailwind.config.ts`
- `apps/web/postcss.config.js`
- `apps/web/.env` — `VITE_GOOGLE_MAPS_API_KEY` (user to rotate tonight)

**GraphQL Layer**
- `apps/web/src/graphql/client.ts` — ApolloClient pointed at `/graphql`
- `apps/web/src/graphql/queries.ts` — `ACTIVITY_RANKINGS_QUERY` gql document
- `apps/web/src/graphql/types.ts` — Manual TS types mirroring the GQL schema

**Components**
- `apps/web/src/components/ScoreBadge.tsx` — Colored label chip (EXCELLENT/GOOD/FAIR/POOR)
- `apps/web/src/components/DailyBreakdown.tsx` — 7-row table: date, score badge, top 2 reasons
- `apps/web/src/components/ActivityCard.tsx` — Icon, rank, score badge, summary, expand toggle
- `apps/web/src/components/SearchBar.tsx` — Google Places Autocomplete input with loading spinner
- `apps/web/src/components/ResultsSection.tsx` — Loading/error/results states + location header

**Hook**
- `apps/web/src/hooks/useActivityRankings.ts` — Apollo `useLazyQuery` wrapper; fires on location selection

**Entry Points**
- `apps/web/src/App.tsx` — `useLoadScript` for Google Maps, wires SearchBar → hook → ResultsSection
- `apps/web/src/main.tsx` — `ApolloProvider` root + React strict mode
- `apps/web/src/index.css` — Tailwind directives

### What Is Complete (Phase 2)

- Full React frontend implemented in TypeScript
- Google Places Autocomplete resolves city → `{ name, country, latitude, longitude }`
- Apollo Client fires `activityRankings` query with resolved location
- 4 activity cards rendered sorted by score (backend handles ordering)
- Per-card 7-day daily breakdown, collapsed by default, expandable
- Score labels color-coded: green (EXCELLENT), sky (GOOD), amber (FAIR), red (POOR)
- Loading spinner during fetch; error message on failure
- Vite proxy routes `/graphql` to `:4000` — no CORS changes needed on backend
- Timezone field intentionally omitted (optional in schema; not worth a second API call)

### What Is NOT Done Yet (Phase 3)

- **README.md** — Required deliverable: architecture overview, AI usage, trade-offs
- **npm install** — Run `npm install` in both `apps/api` and `apps/web` before starting
- **Backend tests** — `npm test` in `apps/api` should still pass (no backend changes in Phase 2)
- **Production build** — No Docker, CI/CD, or deployment config
- **API key rotation** — User to replace `VITE_GOOGLE_MAPS_API_KEY` in `apps/web/.env` tonight
- **Timezone support** — Could add Google Time Zone API call after place selection (stretch goal)
- **Mobile polish** — Functional but not mobile-optimized

### Instructions for the Next Agent

1. **Install and run the backend:**
   ```bash
   cd c:\dev\weather-predictor\apps\api
   npm install
   npm run dev
   ```
   Backend starts at `http://localhost:4000/graphql`

2. **Install and run the frontend:**
   ```bash
   cd c:\dev\weather-predictor\apps\web
   npm install
   npm run dev
   ```
   Frontend starts at `http://localhost:5173`

3. **Verify the app works:**
   - Open `http://localhost:5173`
   - Type a city (e.g. "Cape Town") in the search box
   - Select from the Google Places dropdown
   - 4 ranked activity cards should appear
   - Click "▼ 7-day view" on any card to expand

4. **Phase 3 — README.md:**
   Create `README.md` at the repo root with:
   - Architecture overview (monorepo, backend flow, frontend flow)
   - Technical choices and reasoning
   - How AI was used in the process
   - Omissions & trade-offs (no ski resort proximity, no coastline detection, no auth, no caching, no deployment, timezone skipped)
   - Setup / run instructions

5. **Key files for the next agent:**
   - Backend entry: `apps/api/src/index.ts`
   - Frontend entry: `apps/web/src/App.tsx`
   - GraphQL schema: `apps/api/src/graphql/schema.ts`
   - API key: `apps/web/.env` (rotate before any public use)
