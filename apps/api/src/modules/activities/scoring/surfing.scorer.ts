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
import { DailyMarineWeather } from "../../weather/weather.types";

const SEVERE_WEATHER_CODES = new Set([65, 75, 82, 95, 96, 99]);

function scoreDay(
  day: DailyWeather,
  marine: DailyMarineWeather | undefined
): DailyActivityScore {
  const reasons: string[] = [];

  if (!marine || marine.waveHeightM == null) {
    return {
      date: day.date,
      score: 5,
      label: "POOR",
      reasons: ["Marine forecast unavailable for this location/date."],
    };
  }

  const waveH = marine.waveHeightM;
  const waveHeightScore =
    waveH < 0.5
      ? clamp(waveH * 40)
      : waveH <= 3.5
      ? clamp(40 + ((waveH - 0.5) / 3) * 60)
      : clamp(100 - ((waveH - 3.5) / 2) * 80);
  if (waveH < 0.5) reasons.push(`Waves too small: ${waveH}m`);
  else if (waveH > 4) reasons.push(`Waves dangerously large: ${waveH}m`);

  const period = marine.wavePeriodSeconds ?? 6;
  const wavePeriodScore = period < 6 ? clamp((period / 6) * 50) : clamp(50 + ((period - 6) / 10) * 50);
  if (period < 6) reasons.push(`Short wave period: ${period}s`);

  const windScore = clamp(100 - (day.maxWindKph / 50) * 100);
  if (day.maxWindKph > 40) reasons.push(`Strong wind: ${day.maxWindKph}km/h`);

  const isSevere = SEVERE_WEATHER_CODES.has(day.weatherCode);
  const weatherComfortScore = isSevere ? 20 : day.precipitationMm > 15 ? 50 : 90;
  if (isSevere) reasons.push("Severe weather warning");

  const daily =
    waveHeightScore * 0.45 +
    wavePeriodScore * 0.25 +
    windScore * 0.2 +
    weatherComfortScore * 0.1;

  const score = roundScore(clamp(daily));
  return { date: day.date, score, label: labelForScore(score), reasons };
}

export class SurfingScorer implements ActivityScorer {
  readonly activity: Activity = "SURFING";

  score(input: ActivityScoringInput): ActivityRanking {
    const days = input.dailyWeather.map((day, i) => {
      const marine = input.marineWeather?.[i];
      return scoreDay(day, marine);
    });
    const overall = roundScore(average(days.map((d) => d.score)));
    return {
      activity: this.activity,
      score: overall,
      label: labelForScore(overall),
      summary: `Surfing conditions over 7 days averaged ${overall}/100.`,
      days,
    };
  }
}
