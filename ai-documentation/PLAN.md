# Backend Phase 1 Plan

## Objective

Build the backend service layer and tests for a weather-based activity ranking application.

The backend should accept a resolved location and return ranked recommendations for the following activities over the next 7 days:

- Skiing
- Surfing
- Outdoor sightseeing
- Indoor sightseeing

This phase intentionally focuses on backend architecture, domain logic, service separation, and unit tests. Frontend integration and production-grade location search are out of scope for this phase.

---

## Scope for Phase 1

### In scope

- TypeScript backend services
- GraphQL schema and resolver shape
- Weather client interfaces
- Open-Meteo-style mock fixtures
- Weather response mappers
- Activity scoring services
- Ranking aggregation service
- Unit tests for:
  - weather mappers
  - individual activity scorers
  - ranking service
  - resolver orchestration, if time allows

### Out of scope

- React frontend
- Google Maps / Places integration
- Authentication
- Persistence/database
- Caching
- Deployment
- Advanced location disambiguation
- Real resort proximity checks
- Real coastline proximity checks

---

## Location Strategy

For this phase, the backend accepts a resolved location object rather than a free-text city string.

Example:

```ts
{
  name: "Cape Town",
  country: "South Africa",
  latitude: -33.9249,
  longitude: 18.4241,
  timezone: "Africa/Johannesburg"
}
```

This keeps the backend focused on the core evaluation problem:

```txt
resolved location -> weather data -> activity scoring -> ranked result
```

In a later frontend phase, the browser could use Google Places Autocomplete to resolve a town/city to latitude and longitude, then pass those coordinates to the backend.

Alternative future option: the backend could accept a search string and use Open-Meteo Geocoding API.

---

## Data Source Strategy

The backend should be designed around Open-Meteo-style data.

Primary forecast data:

- daily time
- min/max temperature
- precipitation sum
- snowfall sum
- max wind speed
- weather code
- cloud cover, if available

Marine forecast data for surfing:

- wave height
- wave period
- wave direction, optional
- wind wave height, optional
- swell wave height, optional

Open-Meteo-style responses commonly return weather variables in grouped structures with parallel arrays. The app should not let those raw API shapes leak into the domain scoring logic.

Therefore, the app needs a mapper layer:

```txt
Open-Meteo raw response -> normalized internal DailyWeather[]
Open-Meteo marine response -> normalized internal DailyMarineWeather[]
```

---

## Architecture Goals

### 1. Thin GraphQL layer

GraphQL resolvers should not contain weather scoring logic.

Resolvers should only:

1. validate input
2. call services
3. return results

### 2. Isolated external API layer

Open-Meteo API details should live in dedicated client and mapper files.

No activity scorer should know about Open-Meteo response shapes.

### 3. Pure scoring logic

Each activity scorer should be a deterministic pure service.

Given normalized weather input, it should return:

- daily score
- daily label
- reasons
- overall score
- overall summary

### 4. Extensible scoring system

Each activity should implement a shared interface.

Adding a new activity should require creating a new scorer and registering it with the ranking service.

### 5. Testable by design

Most tests should not call live APIs.

Tests should use:

- mock Open-Meteo-style forecast fixtures
- mock Open-Meteo-style marine fixtures
- normalized weather fixtures
- scorer-specific fixtures

---

## Proposed Folder Structure

```txt
apps/api/src/
  graphql/
    schema.ts
    resolvers.ts

  modules/
    activities/
      activity-ranking.service.ts
      activity.types.ts
      scoring/
        activity-scorer.interface.ts
        skiing.scorer.ts
        surfing.scorer.ts
        outdoor-sightseeing.scorer.ts
        indoor-sightseeing.scorer.ts

    weather/
      weather.service.ts
      weather.types.ts
      open-meteo.client.ts
      open-meteo.types.ts
      open-meteo.mapper.ts
      open-meteo-marine.mapper.ts

    location/
      location.types.ts

  shared/
    math.ts
    labels.ts
    errors.ts

  test/
    fixtures/
      locations.fixture.ts
      open-meteo-forecast.fixture.ts
      open-meteo-marine.fixture.ts
      normalized-weather.fixture.ts
```

---

## Core Backend Flow

```txt
GraphQL Query
  -> ActivityRankingResolver
    -> WeatherService
      -> OpenMeteoClient
      -> OpenMeteoMapper
    -> ActivityRankingService
      -> SkiingScorer
      -> SurfingScorer
      -> OutdoorSightseeingScorer
      -> IndoorSightseeingScorer
    -> Ranked activity result
```

---

## GraphQL Contract

Phase 1 should expose this query shape:

```graphql
type Query {
  activityRankings(input: ActivityRankingInput!): ActivityRankingResult!
}

input ActivityRankingInput {
  location: ResolvedLocationInput!
}

input ResolvedLocationInput {
  name: String!
  country: String
  latitude: Float!
  longitude: Float!
  timezone: String
}

type ActivityRankingResult {
  location: ResolvedLocation!
  generatedAt: String!
  activities: [ActivityRanking!]!
}

type ResolvedLocation {
  name: String!
  country: String
  latitude: Float!
  longitude: Float!
  timezone: String
}

type ActivityRanking {
  activity: Activity!
  score: Float!
  label: ScoreLabel!
  summary: String!
  days: [DailyActivityScore!]!
}

type DailyActivityScore {
  date: String!
  score: Float!
  label: ScoreLabel!
  reasons: [String!]!
}

enum Activity {
  SKIING
  SURFING
  OUTDOOR_SIGHTSEEING
  INDOOR_SIGHTSEEING
}

enum ScoreLabel {
  EXCELLENT
  GOOD
  FAIR
  POOR
}
```

---

## Normalized Domain Types

```ts
export interface ResolvedLocation {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface DailyWeather {
  date: string;
  minTemperatureC: number;
  maxTemperatureC: number;
  precipitationMm: number;
  snowfallCm: number;
  maxWindKph: number;
  weatherCode: number;
  cloudCoverPercent?: number;
}

export interface DailyMarineWeather {
  date: string;
  waveHeightM?: number;
  wavePeriodSeconds?: number;
  swellWaveHeightM?: number;
  windWaveHeightM?: number;
}
```

---

## Activity Scoring Rules

All scores should be between `0` and `100`.

Labels:

```txt
85 - 100: EXCELLENT
65 - 84: GOOD
40 - 64: FAIR
0 - 39: POOR
```

### Skiing

Skiing should score well when:

- there is snowfall or existing snow signal
- temperatures are cold enough
- precipitation is not mostly rain
- wind is not extreme

Important limitation:

The app does not know whether a location has a nearby ski resort. This should be stated in the README/trade-offs later.

### Surfing

Surfing should score well when:

- marine data exists
- wave height is usable
- wave period is reasonable
- wind is not extreme
- general weather is not dangerous

If marine data is unavailable, surfing should return a low score with a clear reason.

Important limitation:

The app does not yet perform coastline proximity detection.

### Outdoor Sightseeing

Outdoor sightseeing should score well when:

- temperature is comfortable
- precipitation is low
- wind is low to moderate
- weather code is not severe
- cloud cover is acceptable

### Indoor Sightseeing

Indoor sightseeing should score well when outdoor conditions are poor.

It should increase when:

- rain is high
- wind is high
- temperature is very hot or very cold
- weather code indicates poor conditions

This creates a useful inverse relationship with outdoor sightseeing.

---

## Test Strategy

### Unit tests: required

Prioritize unit tests for pure logic.

Required test files:

```txt
open-meteo.mapper.test.ts
open-meteo-marine.mapper.test.ts
skiing.scorer.test.ts
surfing.scorer.test.ts
outdoor-sightseeing.scorer.test.ts
indoor-sightseeing.scorer.test.ts
activity-ranking.service.test.ts
```

### Integration-style tests: optional

If time allows:

```txt
activity-ranking.resolver.test.ts
weather.service.test.ts
```

These can use mocked dependencies rather than live HTTP.

---

## Mock Fixture Strategy

Create mock fixtures that resemble Open-Meteo response structures.

Do not only create already-normalized weather data.

Use both:

1. raw Open-Meteo-style fixtures for mapper tests
2. normalized fixtures for scorer tests

This demonstrates the separation between external API contracts and internal domain logic.

---

## Phase 1 Acceptance Criteria

Phase 1 is complete when:

- backend TypeScript compiles
- activity ranking query contract exists
- Open-Meteo forecast mapper is implemented and tested
- Open-Meteo marine mapper is implemented and tested
- all four activity scorers are implemented and tested
- ranking service returns activities sorted by score descending
- tests run without live API calls
- mock fixtures cover good, bad, and edge-case weather scenarios
