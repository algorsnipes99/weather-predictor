import { clamp, roundScore, average } from "../../../shared/math";
import { labelForScore } from "../../../shared/labels";
import { BaseActivityScorer } from "./base-activity-scorer";
import { Activity, ActivityRanking, ActivityScoringInput, DailyActivityScore } from "../activity.types";
import { DailyWeather } from "../../weather/weather.types";

/**
 * Scores indoor sightseeing as the inverse of outdoor suitability.
 * When the outdoor sightseeing result is available via the dependency map,
 * daily scores are inverted directly (100 - outdoorScore) rather than
 * recalculating shared weather signals from scratch.
 * Falls back to independent calculation if the dependency is unavailable.
 */
export class IndoorSightseeingScorer extends BaseActivityScorer {
  readonly activity: Activity = "INDOOR_SIGHTSEEING";
  readonly dependsOn: Activity = "OUTDOOR_SIGHTSEEING";

  score(input: ActivityScoringInput, dependencies?: Map<Activity, ActivityRanking>): ActivityRanking {
    const outdoor = dependencies?.get("OUTDOOR_SIGHTSEEING");

    if (outdoor) {
      const days = outdoor.days.map((day) => {
        const score = roundScore(clamp(100 - day.score));
        return { date: day.date, score, label: labelForScore(score), reasons: day.reasons };
      });
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

    return super.score(input);
  }

  /**
   * Fallback: used only when outdoor sightseeing result is unavailable.
   * Weights: rain 35%, weather code badness 25%, uncomfortable temperature 25%, wind 15%.
   */
  protected scoreDay(day: DailyWeather): DailyActivityScore {
    const reasons: string[] = [];
    const avgTemp = (day.minTemperatureC + day.maxTemperatureC) / 2;

    const rainScore = clamp((day.precipitationMm / 20) * 100);
    if (day.precipitationMm > 10) reasons.push(`Good indoor day: heavy rain ${day.precipitationMm}mm`);

    const isUncomfortable = avgTemp < 5 || avgTemp > 32;
    const uncomfortableTemperatureScore = isUncomfortable ? 80 : clamp(Math.abs(avgTemp - 18) * 4);
    if (avgTemp < 0) reasons.push(`Too cold outside: ${avgTemp.toFixed(0)}°C`);
    else if (avgTemp > 32) reasons.push(`Too hot outside: ${avgTemp.toFixed(0)}°C`);

    const windScore = clamp((day.maxWindKph / 60) * 100);
    if (day.maxWindKph > 50) reasons.push(`Too windy to be outside: ${day.maxWindKph}km/h`);

    const isSevere = BaseActivityScorer.SEVERE_WEATHER_CODES.has(day.weatherCode);
    const weatherCodeBadnessScore = isSevere ? 100 : day.precipitationMm > 5 ? 60 : 20;
    if (isSevere) reasons.push("Severe weather outside");

    const daily =
      rainScore * 0.35 +
      uncomfortableTemperatureScore * 0.25 +
      windScore * 0.15 +
      weatherCodeBadnessScore * 0.25;

    const score = roundScore(clamp(daily));
    return { date: day.date, score, label: labelForScore(score), reasons };
  }
}
