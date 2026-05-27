import { describe, it, expect } from "vitest";
import { BaseActivityScorer } from "../../../../src/modules/activities/scoring/base-activity-scorer";
import { Activity, DailyActivityScore, ActivityScoringInput } from "../../../../src/modules/activities/activity.types";
import { DailyWeather, DailyMarineWeather } from "../../../../src/modules/weather/weather.types";
import { ActivityScoringException } from "../../../../src/shared/errors";
import { mapOpenMeteoForecastToDailyWeather } from "../../../../src/modules/weather/open-meteo.mapper";
import { mixedForecastResponse } from "../../../fixtures/open-meteo-forecast.fixture";
import { capeTownLocation } from "../../../fixtures/locations.fixture";

class NaNScorer extends BaseActivityScorer {
  readonly activity: Activity = "SKIING";
  protected scoreDay(_day: DailyWeather, _marine?: DailyMarineWeather): DailyActivityScore {
    return { date: _day.date, score: NaN, label: "POOR", reasons: ["test"] };
  }
}

class ValidScorer extends BaseActivityScorer {
  readonly activity: Activity = "OUTDOOR_SIGHTSEEING";
  protected scoreDay(day: DailyWeather): DailyActivityScore {
    return { date: day.date, score: 75, label: "GOOD", reasons: [] };
  }
}

const input: ActivityScoringInput = {
  location: capeTownLocation,
  dailyWeather: mapOpenMeteoForecastToDailyWeather(mixedForecastResponse),
};

describe("BaseActivityScorer — NaN guard", () => {
  it("throws ActivityScoringException when scoreDay returns NaN", () => {
    const scorer = new NaNScorer();
    expect(() => scorer.score(input)).toThrow(ActivityScoringException);
  });

  it("exception message includes the activity name", () => {
    const scorer = new NaNScorer();
    expect(() => scorer.score(input)).toThrow(/SKIING/);
  });

  it("exception message includes the date of the bad day", () => {
    const scorer = new NaNScorer();
    try {
      scorer.score(input);
    } catch (err) {
      expect(err).toBeInstanceOf(ActivityScoringException);
      expect((err as ActivityScoringException).message).toContain(input.dailyWeather[0].date);
    }
  });

  it("exception isOperational is false", () => {
    const scorer = new NaNScorer();
    try {
      scorer.score(input);
    } catch (err) {
      expect((err as ActivityScoringException).isOperational).toBe(false);
    }
  });

  it("does not throw when all scores are valid numbers", () => {
    const scorer = new ValidScorer();
    expect(() => scorer.score(input)).not.toThrow();
  });

  it("returns correct overall score when all days are valid", () => {
    const scorer = new ValidScorer();
    const result = scorer.score(input);
    expect(result.score).toBe(75);
    expect(result.days).toHaveLength(7);
  });
});
