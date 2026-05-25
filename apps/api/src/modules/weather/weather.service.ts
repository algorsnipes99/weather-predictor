import { ResolvedLocation } from "../location/location.types";
import { SevenDayWeather } from "./weather.types";
import { OpenMeteoClient } from "./open-meteo.client";
import { mapOpenMeteoForecastToDailyWeather } from "./open-meteo.mapper";
import { mapOpenMeteoMarineToDailyWeather } from "./open-meteo-marine.mapper";

export class WeatherService {
  constructor(private readonly client: OpenMeteoClient) {}

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
