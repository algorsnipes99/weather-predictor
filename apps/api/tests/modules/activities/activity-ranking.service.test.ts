import { describe, it, expect } from "vitest";
import { ActivityRankingService } from "../../../src/modules/activities/activity-ranking.service";
import { SkiingScorer } from "../../../src/modules/activities/scoring/skiing.scorer";
import { SurfingScorer } from "../../../src/modules/activities/scoring/surfing.scorer";
import { OutdoorSightseeingScorer } from "../../../src/modules/activities/scoring/outdoor-sightseeing.scorer";
import { IndoorSightseeingScorer } from "../../../src/modules/activities/scoring/indoor-sightseeing.scorer";
import { mapOpenMeteoForecastToDailyWeather } from "../../../src/modules/weather/open-meteo.mapper";
import { mapOpenMeteoMarineToDailyWeather } from "../../../src/modules/weather/open-meteo-marine.mapper";
import {
  mixedForecastResponse,
  extremeBadWeatherResponse,
} from "../../fixtures/open-meteo-forecast.fixture";
import { goodSurfMarineResponse } from "../../fixtures/open-meteo-marine.fixture";
import { capeTownLocation, londonLocation } from "../../fixtures/locations.fixture";

const allScorers = [
  new SkiingScorer(),
  new SurfingScorer(),
  new OutdoorSightseeingScorer(),
  new IndoorSightseeingScorer(),
];

describe("ActivityRankingService", () => {
  const service = new ActivityRankingService(allScorers);

  describe("with mixed weather and marine data (Cape Town)", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    const marineWeather = mapOpenMeteoMarineToDailyWeather(goodSurfMarineResponse);
    const result = service.rank({ location: capeTownLocation, dailyWeather, marineWeather });

    it("returns all 4 activities", () => {
      expect(result.activities).toHaveLength(4);
    });

    it("activities are sorted descending by score", () => {
      for (let i = 0; i < result.activities.length - 1; i++) {
        expect(result.activities[i].score).toBeGreaterThanOrEqual(result.activities[i + 1].score);
      }
    });

    it("contains all four activity types", () => {
      const activityNames = result.activities.map((a) => a.activity);
      expect(activityNames).toContain("SKIING");
      expect(activityNames).toContain("SURFING");
      expect(activityNames).toContain("OUTDOOR_SIGHTSEEING");
      expect(activityNames).toContain("INDOOR_SIGHTSEEING");
    });

    it("generatedAt is an ISO 8601 string", () => {
      expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it("generatedAt parses as a valid Date", () => {
      const parsed = new Date(result.generatedAt);
      expect(parsed.toString()).not.toBe("Invalid Date");
    });

    it("location is returned unchanged", () => {
      expect(result.location).toEqual(capeTownLocation);
    });

    it("each activity has 7 daily scores", () => {
      result.activities.forEach((activity) => {
        expect(activity.days).toHaveLength(7);
      });
    });

    it("each activity has a non-empty summary", () => {
      result.activities.forEach((activity) => {
        expect(activity.summary.length).toBeGreaterThan(0);
      });
    });

    it("each day has a valid label", () => {
      const validLabels = ["EXCELLENT", "GOOD", "FAIR", "POOR"];
      result.activities.forEach((activity) => {
        activity.days.forEach((day) => {
          expect(validLabels).toContain(day.label);
        });
      });
    });

    it("each day score is between 0 and 100", () => {
      result.activities.forEach((activity) => {
        activity.days.forEach((day) => {
          expect(day.score).toBeGreaterThanOrEqual(0);
          expect(day.score).toBeLessThanOrEqual(100);
        });
      });
    });
  });

  describe("with extreme bad weather (London)", () => {
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(extremeBadWeatherResponse);
    const result = service.rank({ location: londonLocation, dailyWeather });

    it("indoor sightseeing ranks higher than outdoor sightseeing", () => {
      const indoor = result.activities.find((a) => a.activity === "INDOOR_SIGHTSEEING")!;
      const outdoor = result.activities.find((a) => a.activity === "OUTDOOR_SIGHTSEEING")!;
      expect(indoor.score).toBeGreaterThan(outdoor.score);
    });

    it("activities are still sorted descending", () => {
      for (let i = 0; i < result.activities.length - 1; i++) {
        expect(result.activities[i].score).toBeGreaterThanOrEqual(result.activities[i + 1].score);
      }
    });

    it("location is returned as London", () => {
      expect(result.location.name).toBe("London");
    });
  });

  describe("with no scorers", () => {
    const emptyService = new ActivityRankingService([]);
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    const result = emptyService.rank({ location: capeTownLocation, dailyWeather });

    it("returns empty activities array", () => {
      expect(result.activities).toHaveLength(0);
    });

    it("still returns location and generatedAt", () => {
      expect(result.location).toEqual(capeTownLocation);
      expect(result.generatedAt).toBeTruthy();
    });
  });

  describe("with single scorer", () => {
    const singleService = new ActivityRankingService([new OutdoorSightseeingScorer()]);
    const dailyWeather = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    const result = singleService.rank({ location: capeTownLocation, dailyWeather });

    it("returns 1 activity", () => {
      expect(result.activities).toHaveLength(1);
    });

    it("the single activity has daily breakdowns preserved", () => {
      expect(result.activities[0].days).toHaveLength(7);
      result.activities[0].days.forEach((day) => {
        expect(day.date).toBeTruthy();
        expect(typeof day.score).toBe("number");
        expect(Array.isArray(day.reasons)).toBe(true);
      });
    });
  });
});
