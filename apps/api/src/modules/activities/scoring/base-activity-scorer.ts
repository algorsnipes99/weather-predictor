import { average, roundScore } from "../../../shared/math";
import { labelForScore } from "../../../shared/labels";
import { ActivityScorer } from "./activity-scorer.interface";
import { Activity, ActivityRanking, ActivityScoringInput, DailyActivityScore } from "../activity.types";
import { DailyWeather, DailyMarineWeather } from "../../weather/weather.types";

/**
 * Shared scoring skeleton for all activity scorers.
 * Subclasses implement `scoreDay` for their activity-specific logic;
 * this class handles aggregation, averaging, and summary generation.
 */
export abstract class BaseActivityScorer implements ActivityScorer {
  abstract readonly activity: Activity;

  protected static readonly SEVERE_WEATHER_CODES = new Set([65, 75, 82, 95, 96, 99]);

  /** Scores a single day — implemented per activity in each subclass. */
  protected abstract scoreDay(day: DailyWeather, marine?: DailyMarineWeather): DailyActivityScore;

  /**
   * Maps `scoreDay` over every day in the input, averages the results,
   * and returns the full `ActivityRanking` with label and summary.
   */
  score(input: ActivityScoringInput): ActivityRanking {
    const days = input.dailyWeather.map((day, i) =>
      this.scoreDay(day, input.marineWeather?.[i])
    );
    const overall = roundScore(average(days.map((d) => d.score)));
    const raw = this.activity.replace(/_/g, " ").toLowerCase();
    const activityName = raw.charAt(0).toUpperCase() + raw.slice(1);
    return {
      activity: this.activity,
      score: overall,
      label: labelForScore(overall),
      summary: `${activityName} conditions over 7 days averaged ${overall}/100.`,
      days,
    };
  }
}
