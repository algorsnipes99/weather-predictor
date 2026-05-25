import { clamp, average, roundScore } from "../../../shared/math";
import { labelForScore } from "../../../shared/labels";
import { ActivityScorer } from "./activity-scorer.interface";
import {
  Activity,
  ActivityRanking,
  ActivityScoringInput,
  DailyActivityScore,
} from "../activity.types";
import { DailyWeather } from "../../weather/weather.types";

function scoreDay(day: DailyWeather): DailyActivityScore {
  const reasons: string[] = [];

  const snowScore = clamp((day.snowfallCm / 15) * 100);
  if (day.snowfallCm > 5) reasons.push(`Good snowfall: ${day.snowfallCm}cm`);
  else if (day.snowfallCm === 0) reasons.push("No snowfall");

  const isCold = day.maxTemperatureC <= 2 && day.minTemperatureC <= 0;
  const temperatureScore = isCold ? 100 : clamp(((2 - day.maxTemperatureC) / 10) * 100 + 50);
  if (!isCold) reasons.push(`Temperature too warm for skiing (max ${day.maxTemperatureC}°C)`);

  const rainWithoutSnow = day.precipitationMm > 0 && day.snowfallCm === 0;
  const precipitationScore = rainWithoutSnow
    ? clamp(100 - (day.precipitationMm / 20) * 100)
    : 100;
  if (rainWithoutSnow && day.precipitationMm > 5)
    reasons.push(`Rain without snow: ${day.precipitationMm}mm`);

  const windScore = clamp(100 - (day.maxWindKph / 60) * 100);
  if (day.maxWindKph > 50) reasons.push(`High wind: ${day.maxWindKph}km/h`);

  const daily =
    snowScore * 0.4 +
    temperatureScore * 0.3 +
    precipitationScore * 0.2 +
    windScore * 0.1;

  const score = roundScore(clamp(daily));
  return { date: day.date, score, label: labelForScore(score), reasons };
}

export class SkiingScorer implements ActivityScorer {
  readonly activity: Activity = "SKIING";

  score(input: ActivityScoringInput): ActivityRanking {
    const days = input.dailyWeather.map(scoreDay);
    const overall = roundScore(average(days.map((d) => d.score)));
    return {
      activity: this.activity,
      score: overall,
      label: labelForScore(overall),
      summary: `Skiing conditions over 7 days averaged ${overall}/100.`,
      days,
    };
  }
}
