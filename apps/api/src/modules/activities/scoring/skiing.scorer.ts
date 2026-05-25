import { clamp, roundScore } from "../../../shared/math";
import { labelForScore } from "../../../shared/labels";
import { BaseActivityScorer } from "./base-activity-scorer";
import { Activity, DailyActivityScore } from "../activity.types";
import { DailyWeather } from "../../weather/weather.types";

/**
 * Scores skiing conditions based on snowfall, temperature, precipitation, and wind.
 * Note: does not verify whether a ski resort is actually nearby — callers should
 * communicate this limitation to end users.
 */
export class SkiingScorer extends BaseActivityScorer {
  readonly activity: Activity = "SKIING";

  /**
   * Weights: snow 40%, temperature 30%, precipitation 20%, wind 10%.
   * Rain without snow and warm temperatures are heavily penalised.
   */
  protected scoreDay(day: DailyWeather): DailyActivityScore {
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
}
