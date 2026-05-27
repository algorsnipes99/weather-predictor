import { ResolvedLocation } from "../location/location.types";
import { SevenDayWeather } from "./weather.types";
import { OpenMeteoClient } from "./open-meteo.client";
import { mapOpenMeteoForecastToDailyWeather } from "./open-meteo.mapper";
import { mapOpenMeteoMarineToDailyWeather } from "./open-meteo-marine.mapper";

/**
 * Fetches and normalises a 7-day weather forecast for a given location.
 * Composes the Open-Meteo forecast and marine APIs and maps raw responses
 * into the internal domain types used by the activity scorers.
 */
export class WeatherService {
  constructor(private readonly client: OpenMeteoClient) {}

  /**
   * Fetches the general forecast and, if available, the marine forecast.
   * Marine failures are swallowed — a missing marine result degrades surfing
   * scores gracefully rather than failing the entire request.
   */
  async getSevenDayWeather(location: ResolvedLocation): Promise<SevenDayWeather> {
    const forecast = await this.client.getForecast(location);

    const marineForecast = await this.client
      .getMarineForecast(location)
      .catch(() => undefined);

    return {
      daily: mapOpenMeteoForecastToDailyWeather(forecast),
      marineDaily: marineForecast
        ? mapOpenMeteoMarineToDailyWeather(marineForecast)
        : undefined,
    };
  }
}
