import { describe, it, expect } from "vitest";
import { SkiingScorer } from "./skiing.scorer";
import { mapOpenMeteoForecastToDailyWeather } from "../../weather/open-meteo.mapper";
import {
  snowyForecastResponse,
  mixedForecastResponse,
} from "../../../test/fixtures/open-meteo-forecast.fixture";
import { zermattLocation, capeTownLocation } from "../../../test/fixtures/locations.fixture";

describe("SkiingScorer", () => {
  const scorer = new SkiingScorer();

  it("activity is SKIING", () => {
    expect(scorer.activity).toBe("SKIING");
  });

  describe("snowy cold forecast (Zermatt)", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(snowyForecastResponse);
    const result = scorer.score({ location: zermattLocation, dailyWeather });

    it("gives a high overall score (>= 65) for snowy cold conditions", () => {
      expect(result.score).toBeGreaterThanOrEqual(65);
    });

    it("days array has 7 entries", () => {
      expect(result.days).toHaveLength(7);
    });

    it("days with good snowfall have high scores", () => {
      // Day 3 (index 3): 15cm snowfall, -6 to -2°C — should be best day
      expect(result.days[3].score).toBeGreaterThanOrEqual(65);
    });

    it("label is GOOD or EXCELLENT", () => {
      expect(["GOOD", "EXCELLENT"]).toContain(result.label);
    });

    it("summary mentions skiing and overall score", () => {
      expect(result.summary).toContain("Skiing");
      expect(result.summary).toContain(`${result.score}/100`);
    });
  });

  describe("warm no-snow forecast (Cape Town)", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    const result = scorer.score({ location: capeTownLocation, dailyWeather });

    it("gives a low overall score (<= 40) for warm/no-snow conditions", () => {
      expect(result.score).toBeLessThanOrEqual(40);
    });

    it("days array has 7 entries", () => {
      expect(result.days).toHaveLength(7);
    });

    it("reasons contain no-snowfall and temperature warnings", () => {
      const allReasons = result.days.flatMap((d) => d.reasons);
      expect(allReasons.some((r) => r.includes("No snowfall") || r.includes("Temperature too warm"))).toBe(true);
    });

    it("label is POOR or FAIR", () => {
      expect(["POOR", "FAIR"]).toContain(result.label);
    });

    it("each bad day has non-empty reasons", () => {
      // All days have no snow so each should have at least 'No snowfall' reason
      result.days.forEach((day) => {
        expect(day.reasons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("last day of snowy forecast (no snowfall)", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(snowyForecastResponse);
    const result = scorer.score({ location: zermattLocation, dailyWeather });

    it("last day (no snowfall) has 'No snowfall' in reasons", () => {
      // Day index 6: snowfall 0cm
      expect(result.days[6].reasons).toContain("No snowfall");
    });
  });
});
