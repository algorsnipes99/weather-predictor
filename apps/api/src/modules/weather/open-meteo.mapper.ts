import { DailyWeather } from "./weather.types";
import { OpenMeteoForecastResponse } from "./open-meteo.types";

export function mapOpenMeteoForecastToDailyWeather(
  response: OpenMeteoForecastResponse
): DailyWeather[] {
  return response.daily.time.map((date, index) => ({
    date,
    minTemperatureC: response.daily.temperature_2m_min[index],
    maxTemperatureC: response.daily.temperature_2m_max[index],
    precipitationMm: response.daily.precipitation_sum[index],
    snowfallCm: response.daily.snowfall_sum[index],
    maxWindKph: response.daily.wind_speed_10m_max[index],
    weatherCode: response.daily.weather_code[index],
    cloudCoverPercent: response.daily.cloud_cover_mean?.[index],
  }));
}
