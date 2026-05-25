import { describe, it, expect } from "vitest";
import { IndoorSightseeingScorer } from "../../../../src/modules/activities/scoring/indoor-sightseeing.scorer";
import { mapOpenMeteoForecastToDailyWeather } from "../../../../src/modules/weather/open-meteo.mapper";
import {
  extremeBadWeatherResponse,
  mixedForecastResponse,
} from "../../../fixtures/open-meteo-forecast.fixture";
import {
  londonLocation,
  capeTownLocation,
} from "../../../fixtures/locations.fixture";
import { DailyWeather } from "../../../../src/modules/weather/weather.types";

describe("IndoorSightseeingScorer", () => {
  const scorer = new IndoorSightseeingScorer();

  it("activity is INDOOR_SIGHTSEEING", () => {
    expect(scorer.activity).toBe("INDOOR_SIGHTSEEING");
  });

  describe("extreme bad weather (London) — high indoor score", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(extremeBadWeatherResponse);
    const result = scorer.score({ location: londonLocation, dailyWeather });

    it("gives a high overall score (>= 55) for heavy rain and wind", () => {
      expect(result.score).toBeGreaterThanOrEqual(55);
    });

    it("days array has 7 entries", () => {
      expect(result.days).toHaveLength(7);
    });

    it("days with heavy rain include an indoor-appropriate reason", () => {
      // Day 0: 22mm precipitation
      expect(result.days[0].reasons.some((r) => r.includes("heavy rain") || r.includes("Too windy") || r.includes("Severe weather outside"))).toBe(true);
    });

    it("days with severe weather codes include outdoor severity reason", () => {
      // Day 0: code 65 severe
      expect(result.days[0].reasons).toContain("Severe weather outside");
    });

    it("label is GOOD or EXCELLENT", () => {
      expect(["GOOD", "EXCELLENT"]).toContain(result.label);
    });
  });

  describe("pleasant mixed forecast (Cape Town) — lower indoor score", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    const result = scorer.score({ location: capeTownLocation, dailyWeather });

    it("gives a lower overall score than extreme bad weather scenario", () => {
      const badWeatherDailyWeather = mapOpenMeteoForecastToDailyWeather(extremeBadWeatherResponse);
      const badResult = scorer.score({ location: londonLocation, dailyWeather: badWeatherDailyWeather });
      expect(result.score).toBeLessThan(badResult.score);
    });

    it("nice days (low rain, low wind) score lower for indoor", () => {
      // Day 0: 0mm rain, 14km/h wind, code 1 — not a great indoor day
      expect(result.days[0].score).toBeLessThanOrEqual(30);
    });
  });

  describe("extreme temperatures increase indoor score", () => {
    const freezingDay: DailyWeather = {
      date: "2026-06-01",
      minTemperatureC: -15,
      maxTemperatureC: -5,
      precipitationMm: 2,
      snowfallCm: 5,
      maxWindKph: 20,
      weatherCode: 71,
      cloudCoverPercent: 80,
    };
    const result = scorer.score({ location: capeTownLocation, dailyWeather: [freezingDay] });

    it("very cold day gives high indoor score", () => {
      expect(result.days[0].score).toBeGreaterThanOrEqual(40);
    });

    it("very cold outside reason is included", () => {
      expect(result.days[0].reasons.some((r) => r.includes("Too cold outside"))).toBe(true);
    });
  });

  describe("very hot temperatures increase indoor score", () => {
    const scorchingDay: DailyWeather = {
      date: "2026-06-01",
      minTemperatureC: 30,
      maxTemperatureC: 42,
      precipitationMm: 0,
      snowfallCm: 0,
      maxWindKph: 15,
      weatherCode: 0,
      cloudCoverPercent: 10,
    };
    const result = scorer.score({ location: capeTownLocation, dailyWeather: [scorchingDay] });

    it("very hot day gives higher indoor score", () => {
      expect(result.days[0].score).toBeGreaterThanOrEqual(30);
    });

    it("very hot outside reason is included", () => {
      expect(result.days[0].reasons.some((r) => r.includes("Too hot outside"))).toBe(true);
    });
  });

  describe("windy days", () => {
    const windyDay: DailyWeather = {
      date: "2026-06-01",
      minTemperatureC: 10,
      maxTemperatureC: 15,
      precipitationMm: 0,
      snowfallCm: 0,
      maxWindKph: 70,
      weatherCode: 3,
      cloudCoverPercent: 60,
    };
    const result = scorer.score({ location: capeTownLocation, dailyWeather: [windyDay] });

    it("very windy day includes wind reason", () => {
      expect(result.days[0].reasons.some((r) => r.includes("Too windy to be outside"))).toBe(true);
    });

    it("very windy day scores higher indoors than calm day", () => {
      const calmDay: DailyWeather = {
        ...windyDay,
        maxWindKph: 5,
      };
      const calmResult = scorer.score({ location: capeTownLocation, dailyWeather: [calmDay] });
      expect(result.days[0].score).toBeGreaterThan(calmResult.days[0].score);
    });
  });
});
