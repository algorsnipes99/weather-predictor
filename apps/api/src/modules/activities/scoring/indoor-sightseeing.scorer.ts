
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

const SEVERE_WEATHER_CODES = new Set([65, 75, 82, 95, 96, 99]);

function scoreDay(day: DailyWeather): DailyActivityScore {
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

  const isSevere = SEVERE_WEATHER_CODES.has(day.weatherCode);
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

export class IndoorSightseeingScorer implements ActivityScorer {
  readonly activity: Activity = "INDOOR_SIGHTSEEING";

  score(input: ActivityScoringInput): ActivityRanking {
    const days = input.dailyWeather.map(scoreDay);
    const overall = roundScore(average(days.map((d) => d.score)));
    return {
      activity: this.activity,
      score: overall,
      label: labelForScore(overall),
      summary: `Indoor sightseeing over 7 days averaged ${overall}/100.`,
      days,
    };
  }
}
