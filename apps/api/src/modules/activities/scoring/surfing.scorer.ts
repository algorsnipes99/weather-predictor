import { clamp, roundScore } from "../../../shared/math";
import { labelForScore } from "../../../shared/labels";
import { BaseActivityScorer } from "./base-activity-scorer";
import { Activity, DailyActivityScore } from "../activity.types";
import { DailyWeather, DailyMarineWeather } from "../../weather/weather.types";

const SEVERE_WEATHER_CODES = new Set([65, 75, 82, 95, 96, 99]);

/**
 * Scores surfing conditions using marine wave data combined with general weather.
 * Degrades gracefully to a score of 5 (POOR) when marine data is unavailable,
 * rather than throwing. Coastline proximity is not verified.
 */
export class SurfingScorer extends BaseActivityScorer {
  readonly activity: Activity = "SURFING";

  /**
   * Weights: wave height 45%, wave period 25%, wind 20%, weather comfort 10%.
   * Returns POOR immediately if marine forecast data is missing.
   */
  protected scoreDay(day: DailyWeather, marine?: DailyMarineWeather): DailyActivityScore {
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
}
