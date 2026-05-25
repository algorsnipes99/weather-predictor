# Backend Phase 1 Implementation Instructions

## Goal

Implement the first backend phase of the Weather Activity Ranker.

This phase should focus on backend services and tests only.

Do not implement the React frontend yet.

Do not integrate Google Maps yet.

Do not rely on live Open-Meteo API calls in tests.

---

## Technology Requirements

Use:

- Node.js
- TypeScript
- GraphQL
- Apollo Server or equivalent GraphQL server
- Vitest for tests

Suggested packages:

```bash
npm install @apollo/server graphql zod
npm install -D typescript tsx vitest
```

---

## Implementation Order

Follow this order:

1. Create shared types
2. Create utility helpers
3. Create Open-Meteo raw response types
4. Create Open-Meteo mock fixtures
5. Create weather mappers
6. Create normalized weather fixtures
7. Create activity scorer interface
8. Implement individual activity scorers
9. Implement activity ranking service
10. Add GraphQL schema and resolver wiring
11. Add tests

Do not start with HTTP clients or frontend work.

---

## Step 1: Create Shared Helpers

Create:

```txt
apps/api/src/shared/math.ts
apps/api/src/shared/labels.ts
```

### `math.ts`

Implement:

```ts
export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function roundScore(value: number): number {
  return Math.round(value);
}
```

### `labels.ts`

Implement:

```ts
export type ScoreLabel = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export function labelForScore(score: number): ScoreLabel {
  if (score >= 85) return "EXCELLENT";
  if (score >= 65) return "GOOD";
  if (score >= 40) return "FAIR";
  return "POOR";
}
```

---

## Step 2: Create Location Types

Create:

```txt
apps/api/src/modules/location/location.types.ts
```

```ts
export interface ResolvedLocation {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}
```

---

## Step 3: Create Weather Types

Create:

```txt
apps/api/src/modules/weather/weather.types.ts
```

```ts
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

export interface SevenDayWeather {
  daily: DailyWeather[];
  marineDaily?: DailyMarineWeather[];
}
```

---

## Step 4: Create Open-Meteo Raw Types

Create:

```txt
apps/api/src/modules/weather/open-meteo.types.ts
```

```ts
export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  daily: {
    time: string[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    precipitation_sum: number[];
    snowfall_sum: number[];
    wind_speed_10m_max: number[];
    weather_code: number[];
    cloud_cover_mean?: number[];
  };
  daily_units?: Record<string, string>;
}

export interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  daily: {
    time: string[];
    wave_height_max?: number[];
    wave_period_max?: number[];
    swell_wave_height_max?: number[];
    wind_wave_height_max?: number[];
  };
  daily_units?: Record<string, string>;
}
```

Note: keep these types close to the Open-Meteo response shape. The forecast API commonly returns weather variables grouped into structures such as `daily`, and the marine API is used for wave forecast variables.

---

## Step 5: Create Open-Meteo-Style Fixtures

Create:

```txt
apps/api/src/test/fixtures/open-meteo-forecast.fixture.ts
apps/api/src/test/fixtures/open-meteo-marine.fixture.ts
apps/api/src/test/fixtures/locations.fixture.ts
```

### `locations.fixture.ts`

```ts
import { ResolvedLocation } from "../../modules/location/location.types";

export const capeTownLocation: ResolvedLocation = {
  name: "Cape Town",
  country: "South Africa",
  latitude: -33.9249,
  longitude: 18.4241,
  timezone: "Africa/Johannesburg",
};

export const zermattLocation: ResolvedLocation = {
  name: "Zermatt",
  country: "Switzerland",
  latitude: 46.0207,
  longitude: 7.7491,
  timezone: "Europe/Zurich",
};

export const londonLocation: ResolvedLocation = {
  name: "London",
  country: "United Kingdom",
  latitude: 51.5072,
  longitude: -0.1276,
  timezone: "Europe/London",
};
```

### `open-meteo-forecast.fixture.ts`

```ts
import { OpenMeteoForecastResponse } from "../../modules/weather/open-meteo.types";

export const mixedForecastResponse: OpenMeteoForecastResponse = {
  latitude: -33.9249,
  longitude: 18.4241,
  timezone: "Africa/Johannesburg",
  daily_units: {
    time: "iso8601",
    temperature_2m_min: "°C",
    temperature_2m_max: "°C",
    precipitation_sum: "mm",
    snowfall_sum: "cm",
    wind_speed_10m_max: "km/h",
    weather_code: "wmo code",
    cloud_cover_mean: "%",
  },
  daily: {
    time: [
      "2026-05-23",
      "2026-05-24",
      "2026-05-25",
      "2026-05-26",
      "2026-05-27",
      "2026-05-28",
      "2026-05-29",
    ],
    temperature_2m_min: [15, 14, 11, 8, 6, 13, 16],
    temperature_2m_max: [24, 22, 18, 12, 9, 19, 26],
    precipitation_sum: [0, 1, 8, 18, 4, 0, 0],
    snowfall_sum: [0, 0, 0, 0, 0, 0, 0],
    wind_speed_10m_max: [14, 18, 32, 45, 28, 12, 10],
    weather_code: [1, 2, 61, 63, 80, 1, 0],
    cloud_cover_mean: [20, 45, 80, 95, 70, 25, 10],
  },
};

export const snowyForecastResponse: OpenMeteoForecastResponse = {
  latitude: 46.0207,
  longitude: 7.7491,
  timezone: "Europe/Zurich",
  daily: {
    time: [
      "2026-05-23",
      "2026-05-24",
      "2026-05-25",
      "2026-05-26",
      "2026-05-27",
      "2026-05-28",
      "2026-05-29",
    ],
    temperature_2m_min: [-8, -7, -5, -6, -4, -3, -2],
    temperature_2m_max: [-1, 0, 1, -2, 2, 3, 4],
    precipitation_sum: [3, 4, 1, 8, 6, 2, 0],
    snowfall_sum: [8, 12, 4, 15, 10, 3, 0],
    wind_speed_10m_max: [18, 22, 14, 30, 25, 20, 12],
    weather_code: [71, 73, 71, 75, 73, 71, 3],
    cloud_cover_mean: [90, 95, 75, 98, 90, 70, 50],
  },
};

export const extremeBadWeatherResponse: OpenMeteoForecastResponse = {
  latitude: 51.5072,
  longitude: -0.1276,
  timezone: "Europe/London",
  daily: {
    time: [
      "2026-05-23",
      "2026-05-24",
      "2026-05-25",
      "2026-05-26",
      "2026-05-27",
      "2026-05-28",
      "2026-05-29",
    ],
    temperature_2m_min: [4, 5, 6, 6, 5, 7, 8],
    temperature_2m_max: [9, 10, 11, 12, 10, 13, 14],
    precipitation_sum: [22, 30, 18, 12, 25, 8, 5],
    snowfall_sum: [0, 0, 0, 0, 0, 0, 0],
    wind_speed_10m_max: [55, 62, 48, 44, 58, 35, 30],
    weather_code: [65, 82, 63, 61, 65, 80, 3],
    cloud_cover_mean: [100, 98, 95, 90, 100, 85, 70],
  },
};
```

### `open-meteo-marine.fixture.ts`

```ts
import { OpenMeteoMarineResponse } from "../../modules/weather/open-meteo.types";

export const goodSurfMarineResponse: OpenMeteoMarineResponse = {
  latitude: -33.9249,
  longitude: 18.4241,
  timezone: "Africa/Johannesburg",
  daily_units: {
    time: "iso8601",
    wave_height_max: "m",
    wave_period_max: "s",
    swell_wave_height_max: "m",
    wind_wave_height_max: "m",
  },
  daily: {
    time: [
      "2026-05-23",
      "2026-05-24",
      "2026-05-25",
      "2026-05-26",
      "2026-05-27",
      "2026-05-28",
      "2026-05-29",
    ],
    wave_height_max: [1.2, 1.6, 2.0, 2.5, 1.8, 1.4, 1.1],
    wave_period_max: [9, 11, 12, 13, 10, 8, 7],
    swell_wave_height_max: [1.0, 1.4, 1.8, 2.2, 1.5, 1.1, 0.9],
    wind_wave_height_max: [0.4, 0.5, 0.7, 0.9, 0.6, 0.4, 0.3],
  },
};

export const poorSurfMarineResponse: OpenMeteoMarineResponse = {
  latitude: -33.9249,
  longitude: 18.4241,
  timezone: "Africa/Johannesburg",
  daily: {
    time: [
      "2026-05-23",
      "2026-05-24",
      "2026-05-25",
      "2026-05-26",
      "2026-05-27",
      "2026-05-28",
      "2026-05-29",
    ],
    wave_height_max: [0.1, 0.2, 0.1, 0.3, 0.2, 0.1, 0.1],
    wave_period_max: [3, 4, 3, 5, 4, 3, 3],
    swell_wave_height_max: [0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.1],
    wind_wave_height_max: [0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.1],
  },
};
```

---

## Step 6: Implement Weather Mappers

Create:

```txt
apps/api/src/modules/weather/open-meteo.mapper.ts
apps/api/src/modules/weather/open-meteo-marine.mapper.ts
```

### Forecast mapper

```ts
import { DailyWeather } from "./weather.types";
import { OpenMeteoForecastResponse } from "./open-meteo.types";

export function mapOpenMeteoForecastToDailyWeather(
  response: OpenMeteoForecastResponse
): DailyWeather[] {
  return response.daily.time.map((date, index) => ({
    date,
    minTemperatureC: response.daily.temperature_2m_min[index],
    maxTemperatureC: response.daily.temperature_2m_max[index],
    precipitationMm: response.daily.precipitation_sum[index],
    snowfallCm: response.daily.snowfall_sum[index],
    maxWindKph: response.daily.wind_speed_10m_max[index],
    weatherCode: response.daily.weather_code[index],
    cloudCoverPercent: response.daily.cloud_cover_mean?.[index],
  }));
}
```

### Marine mapper

```ts
import { DailyMarineWeather } from "./weather.types";
import { OpenMeteoMarineResponse } from "./open-meteo.types";

export function mapOpenMeteoMarineToDailyWeather(
  response: OpenMeteoMarineResponse
): DailyMarineWeather[] {
  return response.daily.time.map((date, index) => ({
    date,
    waveHeightM: response.daily.wave_height_max?.[index],
    wavePeriodSeconds: response.daily.wave_period_max?.[index],
    swellWaveHeightM: response.daily.swell_wave_height_max?.[index],
    windWaveHeightM: response.daily.wind_wave_height_max?.[index],
  }));
}
```

Add tests to verify:

- 7 items are returned
- dates align correctly
- each parallel array maps to the correct day
- optional fields do not crash the mapper

---

## Step 7: Implement Activity Types

Create:

```txt
apps/api/src/modules/activities/activity.types.ts
```

```ts
import { ResolvedLocation } from "../location/location.types";
import { DailyMarineWeather, DailyWeather } from "../weather/weather.types";
import { ScoreLabel } from "../../shared/labels";

export type Activity =
  | "SKIING"
  | "SURFING"
  | "OUTDOOR_SIGHTSEEING"
  | "INDOOR_SIGHTSEEING";

export interface DailyActivityScore {
  date: string;
  score: number;
  label: ScoreLabel;
  reasons: string[];
}

export interface ActivityRanking {
  activity: Activity;
  score: number;
  label: ScoreLabel;
  summary: string;
  days: DailyActivityScore[];
}

export interface ActivityScoringInput {
  location: ResolvedLocation;
  dailyWeather: DailyWeather[];
  marineWeather?: DailyMarineWeather[];
}

export interface ActivityRankingResult {
  location: ResolvedLocation;
  generatedAt: string;
  activities: ActivityRanking[];
}
```

Create:

```txt
apps/api/src/modules/activities/scoring/activity-scorer.interface.ts
```

```ts
import {
  Activity,
  ActivityRanking,
  ActivityScoringInput,
} from "../activity.types";

export interface ActivityScorer {
  activity: Activity;
  score(input: ActivityScoringInput): ActivityRanking;
}
```

---

## Step 8: Implement Activity Scorers

Each scorer should:

- implement `ActivityScorer`
- calculate a daily score for each day
- generate reasons for each day
- average daily scores into an overall activity score
- return a label using `labelForScore`
- avoid throwing for incomplete optional data unless the required forecast data is missing

### Required scorers

```txt
apps/api/src/modules/activities/scoring/skiing.scorer.ts
apps/api/src/modules/activities/scoring/surfing.scorer.ts
apps/api/src/modules/activities/scoring/outdoor-sightseeing.scorer.ts
apps/api/src/modules/activities/scoring/indoor-sightseeing.scorer.ts
```

### Scoring guidance

#### Skiing

Use:

- snowfall
- max/min temperature
- wind
- precipitation

Suggested formula:

```txt
snow score: up to 100 based on snowfall
temperature score: high if max temp <= 2°C and min temp <= 0°C
rain/precipitation score: lower if precipitation exists without snow
wind score: lower when wind is high

daily score =
  snowScore * 0.4 +
  temperatureScore * 0.3 +
  precipitationScore * 0.2 +
  windScore * 0.1
```

#### Surfing

Use:

- marine wave height
- marine wave period
- wind
- precipitation / general weather

If marine data is missing for a date, return low score with reason:

```txt
Marine forecast unavailable for this location/date.
```

Suggested formula:

```txt
daily score =
  waveHeightScore * 0.45 +
  wavePeriodScore * 0.25 +
  windScore * 0.2 +
  weatherComfortScore * 0.1
```

#### Outdoor sightseeing

Use:

- comfortable temperatures
- low precipitation
- manageable wind
- weather code severity
- cloud cover

Suggested formula:

```txt
daily score =
  temperatureComfortScore * 0.4 +
  dryScore * 0.3 +
  windScore * 0.15 +
  weatherCodeScore * 0.1 +
  cloudScore * 0.05
```

#### Indoor sightseeing

Use inverse outdoor suitability.

Indoor should score higher when:

- precipitation is high
- wind is high
- temperatures are uncomfortable
- weather code is severe

Suggested formula:

```txt
daily score =
  rainScore * 0.35 +
  uncomfortableTemperatureScore * 0.25 +
  windScore * 0.15 +
  weatherCodeBadnessScore * 0.25
```

---

## Step 9: Implement Ranking Service

Create:

```txt
apps/api/src/modules/activities/activity-ranking.service.ts
```

```ts
import {
  ActivityRankingResult,
  ActivityScoringInput,
} from "./activity.types";
import { ActivityScorer } from "./scoring/activity-scorer.interface";

export class ActivityRankingService {
  constructor(private readonly scorers: ActivityScorer[]) {}

  rank(input: ActivityScoringInput): ActivityRankingResult {
    const activities = this.scorers
      .map((scorer) => scorer.score(input))
      .sort((a, b) => b.score - a.score);

    return {
      location: input.location,
      generatedAt: new Date().toISOString(),
      activities,
    };
  }
}
```

Test that:

- all scorers are called
- activities are sorted by score descending
- result contains location
- result contains generatedAt
- daily breakdowns are preserved

---

## Step 10: GraphQL Wiring

Create minimal schema and resolver files:

```txt
apps/api/src/graphql/schema.ts
apps/api/src/graphql/resolvers.ts
```

The resolver should depend on services rather than importing implementation details everywhere.

Expected resolver flow:

```ts
const resolvers = {
  Query: {
    activityRankings: async (_parent, args, context) => {
      const { location } = args.input;

      const weather = await context.weatherService.getSevenDayWeather(location);

      return context.activityRankingService.rank({
        location,
        dailyWeather: weather.daily,
        marineWeather: weather.marineDaily,
      });
    },
  },
};
```

Keep the resolver thin.

---

## Step 11: Weather Service

Create:

```txt
apps/api/src/modules/weather/weather.service.ts
apps/api/src/modules/weather/open-meteo.client.ts
```

For Phase 1, the client can be an interface or class with methods that are easy to mock:

```ts
import { ResolvedLocation } from "../location/location.types";
import {
  OpenMeteoForecastResponse,
  OpenMeteoMarineResponse,
} from "./open-meteo.types";

export interface OpenMeteoClient {
  getForecast(location: ResolvedLocation): Promise<OpenMeteoForecastResponse>;
  getMarineForecast(
    location: ResolvedLocation
  ): Promise<OpenMeteoMarineResponse | undefined>;
}
```

Weather service:

```ts
import { ResolvedLocation } from "../location/location.types";
import { SevenDayWeather } from "./weather.types";
import { OpenMeteoClient } from "./open-meteo.client";
import { mapOpenMeteoForecastToDailyWeather } from "./open-meteo.mapper";
import { mapOpenMeteoMarineToDailyWeather } from "./open-meteo-marine.mapper";

export class WeatherService {
  constructor(private readonly client: OpenMeteoClient) {}

  async getSevenDayWeather(location: ResolvedLocation): Promise<SevenDayWeather> {
    const forecast = await this.client.getForecast(location);

    const marineForecast = await this.client
      .getMarineForecast(location)
      .catch(() => undefined);

    return {
      daily: mapOpenMeteoForecastToDailyWeather(forecast),
      marineDaily: marineForecast
        ? mapOpenMeteoMarineToDailyWeather(marineForecast)
        : undefined,
    };
  }
}
```

The marine request should not fail the entire ranking. It should degrade surfing gracefully.

---

## Step 12: Test Requirements

Use Vitest.

### Mapper tests

Create:

```txt
apps/api/src/modules/weather/open-meteo.mapper.test.ts
apps/api/src/modules/weather/open-meteo-marine.mapper.test.ts
```

Test:

- returns 7 normalized days
- maps first and last day correctly
- optional marine fields are handled safely

### Scorer tests

Create one test file per scorer.

Each scorer test should include at least:

#### Skiing

- high score for snowy cold forecast
- low score for warm forecast with no snow
- includes reasons

#### Surfing

- high score for usable wave data
- low score for tiny waves
- low score when marine data is missing
- includes reason for missing marine data

#### Outdoor sightseeing

- high score for dry, mild, low-wind weather
- low score for heavy rain and high wind
- poor weather code reduces score

#### Indoor sightseeing

- high score for heavy rain/wind
- lower score for excellent outdoor weather
- extreme temperatures increase indoor score

### Ranking service tests

Create:

```txt
apps/api/src/modules/activities/activity-ranking.service.test.ts
```

Test:

- activities are sorted descending
- all registered scorers are included
- generatedAt exists
- location is returned unchanged

---

## Step 13: Definition of Done

The first backend phase is done when:

```bash
npm test
```

passes and the codebase has:

- normalized weather types
- Open-Meteo-style raw fixtures
- mapper tests
- four isolated activity scorers
- scorer tests
- ranking service
- ranking service tests
- thin GraphQL contract/resolver shape
