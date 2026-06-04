import { clamp, roundScore } from "../../../shared/math";
import { labelForScore } from "../../../shared/labels";
import { BaseActivityScorer } from "./base-activity-scorer";
import { Activity, DailyActivityScore } from "../activity.types";
import { DailyWeather } from "../../weather/weather.types";

/**
 * Scores outdoor sightseeing based on temperature comfort, dryness, wind,
 * weather code severity, and cloud cover.
 */
export class OutdoorSightseeingScorer extends BaseActivityScorer {
  readonly activity: Activity = "OUTDOOR_SIGHTSEEING";

  /**
   * Weights: temperature comfort 40%, dryness 30%, wind 15%, weather code 10%, cloud cover 5%.
   * Severe weather codes hard-cap the weather code sub-score at 10.
   */
  protected scoreDay(day: DailyWeather): DailyActivityScore {
    const reasons: string[] = [];
    const avgTemp = (day.minTemperatureC + day.maxTemperatureC) / 2;

    const tempComfort =
      avgTemp >= 15 && avgTemp <= 25
        ? 100
        : avgTemp < 0 || avgTemp > 35
        ? 20
        : avgTemp < 15
        ? clamp(20 + ((avgTemp - 0) / 15) * 80) // scale up from cold 0-14
        : clamp(100 - ((avgTemp - 25) / 10) * 80); // scale down from hot 26-35
    if (avgTemp < 5) reasons.push(`Very cold: avg ${avgTemp.toFixed(0)}°C`);
    else if (avgTemp > 32) reasons.push(`Very hot: avg ${avgTemp.toFixed(0)}°C`);

    const dryScore = clamp(100 - (day.precipitationMm / 20) * 100);
    if (day.precipitationMm > 10) reasons.push(`Heavy rain: ${day.precipitationMm}mm`);

    const windScore = clamp(100 - (day.maxWindKph / 50) * 100);
    if (day.maxWindKph > 35) reasons.push(`Strong wind: ${day.maxWindKph}km/h`);

    const isSevere = BaseActivityScorer.SEVERE_WEATHER_CODES.has(day.weatherCode);
    const weatherCodeScore = isSevere ? 10 : 100;
    if (isSevere) reasons.push("Severe weather code");

    const cloud = day.cloudCoverPercent ?? 50;
    const cloudScore = clamp(100 - (cloud / 100) * 60);

    const daily =
      tempComfort * 0.4 +
      dryScore * 0.3 +
      windScore * 0.15 +
      weatherCodeScore * 0.1 +
      cloudScore * 0.05;

    const score = roundScore(clamp(daily));
    return { date: day.date, score, label: labelForScore(score), reasons };
  }
}
