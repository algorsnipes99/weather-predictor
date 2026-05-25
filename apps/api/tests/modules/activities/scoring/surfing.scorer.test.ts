import { describe, it, expect } from "vitest";
import { SurfingScorer } from "../../../../src/modules/activities/scoring/surfing.scorer";
import { mapOpenMeteoForecastToDailyWeather } from "../../../../src/modules/weather/open-meteo.mapper";
import { mapOpenMeteoMarineToDailyWeather } from "../../../../src/modules/weather/open-meteo-marine.mapper";
import {
  mixedForecastResponse,
} from "../../../fixtures/open-meteo-forecast.fixture";
import {
  goodSurfMarineResponse,
  poorSurfMarineResponse,
} from "../../../fixtures/open-meteo-marine.fixture";
import { capeTownLocation } from "../../../fixtures/locations.fixture";

describe("SurfingScorer", () => {
  const scorer = new SurfingScorer();

  it("activity is SURFING", () => {
    expect(scorer.activity).toBe("SURFING");
  });

  describe("good marine conditions with mixed weather (Cape Town)", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    const marineWeather = mapOpenMeteoMarineToDailyWeather(goodSurfMarineResponse);
    const result = scorer.score({ location: capeTownLocation, dailyWeather, marineWeather });

    it("gives a decent overall score (>= 50) for usable waves", () => {
      expect(result.score).toBeGreaterThanOrEqual(50);
    });

    it("days array has 7 entries", () => {
      expect(result.days).toHaveLength(7);
    });

    it("best days have higher scores", () => {
      // Days with good waves and low wind should score well
      const maxScore = Math.max(...result.days.map((d) => d.score));
      expect(maxScore).toBeGreaterThanOrEqual(65);
    });

    it("summary contains surfing and score", () => {
      expect(result.summary).toContain("Surfing");
      expect(result.summary).toContain(`${result.score}/100`);
    });
  });

  describe("poor marine conditions (tiny waves)", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    const marineWeather = mapOpenMeteoMarineToDailyWeather(poorSurfMarineResponse);
    const result = scorer.score({ location: capeTownLocation, dailyWeather, marineWeather });

    it("gives a low overall score (<= 30) for tiny waves", () => {
      expect(result.score).toBeLessThanOrEqual(30);
    });

    it("days have 'Waves too small' reasons", () => {
      const allReasons = result.days.flatMap((d) => d.reasons);
      expect(allReasons.some((r) => r.includes("Waves too small"))).toBe(true);
    });

    it("label is POOR", () => {
      expect(result.label).toBe("POOR");
    });
  });

  describe("no marine data provided", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    const result = scorer.score({ location: capeTownLocation, dailyWeather, marineWeather: undefined });

    it("all days score 5 when no marine data", () => {
      result.days.forEach((day) => {
        expect(day.score).toBe(5);
      });
    });

    it("all days have label POOR", () => {
      result.days.forEach((day) => {
        expect(day.label).toBe("POOR");
      });
    });

    it("all days have 'Marine forecast unavailable' reason", () => {
      result.days.forEach((day) => {
        expect(day.reasons).toContain("Marine forecast unavailable for this location/date.");
      });
    });

    it("overall score is very low", () => {
      expect(result.score).toBeLessThanOrEqual(10);
    });
  });

  describe("mixed marine — some days missing wave height", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    // Provide marine but with undefined wave heights for some days
    const sparseMarineWeather = goodSurfMarineResponse.daily.time.map((date, i) => ({
      date,
      waveHeightM: i < 3 ? goodSurfMarineResponse.daily.wave_height_max![i] : undefined,
      wavePeriodSeconds: goodSurfMarineResponse.daily.wave_period_max![i],
    }));

    const result = scorer.score({ location: capeTownLocation, dailyWeather, marineWeather: sparseMarineWeather });

    it("days with missing waveHeightM get score 5 and marine unavailable reason", () => {
      for (let i = 3; i < 7; i++) {
        expect(result.days[i].score).toBe(5);
        expect(result.days[i].reasons).toContain("Marine forecast unavailable for this location/date.");
      }
    });

    it("days with valid marine data score higher than 5", () => {
      for (let i = 0; i < 3; i++) {
        expect(result.days[i].score).toBeGreaterThan(5);
      }
    });
  });
});
