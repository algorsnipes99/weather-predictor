import { average, roundScore } from "../../../shared/math";
import { labelForScore } from "../../../shared/labels";
import { ActivityScorer } from "./activity-scorer.interface";
import { Activity, ActivityRanking, ActivityScoringInput, DailyActivityScore } from "../activity.types";
import { DailyWeather, DailyMarineWeather } from "../../weather/weather.types";

export abstract class BaseActivityScorer implements ActivityScorer {
  abstract readonly activity: Activity;

  protected abstract scoreDay(day: DailyWeather, marine?: DailyMarineWeather): DailyActivityScore;

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
