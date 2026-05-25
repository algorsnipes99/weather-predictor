import { DailyMarineWeather } from "./weather.types";
import { OpenMeteoMarineResponse } from "./open-meteo.types";

export function mapOpenMeteoMarineToDailyWeather(
  response: OpenMeteoMarineResponse
): DailyMarineWeather[] {
  return response.daily.time.map((date, index) => ({
    date,
    waveHeightM: response.daily.wave_height_max?.[index],
    wavePeriodSeconds: response.daily.wave_period_max?.[index],
    swellWaveHeightM: response.daily.swell_wave_height_max?.[index],
    windWaveHeightM: response.daily.wind_wave_height_max?.[index],
  }));
}
