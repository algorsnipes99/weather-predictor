import { describe, it, expect } from "vitest";
import { OutdoorSightseeingScorer } from "./outdoor-sightseeing.scorer";
import { mapOpenMeteoForecastToDailyWeather } from "../../weather/open-meteo.mapper";
import {
  mixedForecastResponse,
  extremeBadWeatherResponse,
} from "../../../test/fixtures/open-meteo-forecast.fixture";
import {
  capeTownLocation,
  londonLocation,
} from "../../../test/fixtures/locations.fixture";
import { DailyWeather } from "../../weather/weather.types";

describe("OutdoorSightseeingScorer", () => {
  const scorer = new OutdoorSightseeingScorer();

  it("activity is OUTDOOR_SIGHTSEEING", () => {
    expect(scorer.activity).toBe("OUTDOOR_SIGHTSEEING");
  });

  describe("mixed forecast (Cape Town) — some good days", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    const result = scorer.score({ location: capeTownLocation, dailyWeather });

    it("days array has 7 entries", () => {
      expect(result.days).toHaveLength(7);
    });

    it("sunny days (first and last) score well", () => {
      // Day 0: 15-24°C, 0mm rain, 14km/h wind, code 1, 20% cloud — should be good
      expect(result.days[0].score).toBeGreaterThanOrEqual(65);
    });

    it("overall score is at least FAIR (>= 40) given mix of good and bad days", () => {
      expect(result.score).toBeGreaterThanOrEqual(40);
    });

    it("summary contains OUTDOOR_SIGHTSEEING or outdoor sightseeing reference", () => {
      expect(result.summary.toLowerCase()).toContain("outdoor");
    });
  });

  describe("extreme bad weather (London)", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(extremeBadWeatherResponse);
    const result = scorer.score({ location: londonLocation, dailyWeather });

    it("gives a low overall score (<= 35) for extreme bad weather", () => {
      expect(result.score).toBeLessThanOrEqual(35);
    });

    it("days with severe weather codes have low scores", () => {
      // Day 0: code 65 (heavy rain) — severe
      expect(result.days[0].score).toBeLessThanOrEqual(30);
    });

    it("days with severe codes include 'Severe weather code' in reasons", () => {
      expect(result.days[0].reasons).toContain("Severe weather code");
    });

    it("days with high wind include wind reason", () => {
      // Day 0: 55km/h
      expect(result.days[0].reasons.some((r) => r.includes("Strong wind"))).toBe(true);
    });

    it("days with heavy rain include rain reason", () => {
      // Day 0: 22mm
      expect(result.days[0].reasons.some((r) => r.includes("Heavy rain"))).toBe(true);
    });

    it("label is POOR", () => {
      expect(result.label).toBe("POOR");
    });
  });

  describe("perfect outdoor day", () => {
    const perfectDay: DailyWeather = {
      date: "2026-06-01",
      minTemperatureC: 18,
      maxTemperatureC: 22,
      precipitationMm: 0,
      snowfallCm: 0,
      maxWindKph: 10,
      weatherCode: 0,
      cloudCoverPercent: 10,
    };
    const result = scorer.score({ location: capeTownLocation, dailyWeather: [perfectDay] });

    it("perfect day scores EXCELLENT (>= 85)", () => {
      expect(result.days[0].score).toBeGreaterThanOrEqual(85);
    });

    it("perfect day has no reasons", () => {
      expect(result.days[0].reasons).toHaveLength(0);
    });
  });

  describe("severe weather code handling", () => {
    // Code 95 = thunderstorm, code 82 = heavy rain showers — both severe
    const severeDay: DailyWeather = {
      date: "2026-06-01",
      minTemperatureC: 16,
      maxTemperatureC: 20,
      precipitationMm: 5,
      snowfallCm: 0,
      maxWindKph: 20,
      weatherCode: 95,
      cloudCoverPercent: 80,
    };
    const result = scorer.score({ location: capeTownLocation, dailyWeather: [severeDay] });

    it("severe weather code drastically reduces the day score", () => {
      expect(result.days[0].score).toBeLessThanOrEqual(60);
    });

    it("includes severe weather code reason", () => {
      expect(result.days[0].reasons).toContain("Severe weather code");
    });
  });
});
