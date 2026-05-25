import { ResolvedLocation } from "../location/location.types";
import {
  OpenMeteoForecastResponse,
  OpenMeteoMarineResponse,
} from "./open-meteo.types";

export interface OpenMeteoClient {
  getForecast(location: ResolvedLocation): Promise<OpenMeteoForecastResponse>;
  getMarineForecast(
    location: ResolvedLocation
  ): Promise<OpenMeteoMarineResponse | undefined>;
}

export class HttpOpenMeteoClient implements OpenMeteoClient {
  private readonly forecastBaseUrl =
    "https://api.open-meteo.com/v1/forecast";
  private readonly marineBaseUrl =
    "https://marine-api.open-meteo.com/v1/marine";

  async getForecast(location: ResolvedLocation): Promise<OpenMeteoForecastResponse> {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      daily: [
        "temperature_2m_min",
        "temperature_2m_max",
        "precipitation_sum",
        "snowfall_sum",
        "wind_speed_10m_max",
        "weather_code",
        "cloud_cover_mean",
      ].join(","),
      forecast_days: "7",
      ...(location.timezone ? { timezone: location.timezone } : {}),
    });

    const res = await fetch(`${this.forecastBaseUrl}?${params}`);
    if (!res.ok) {
      throw new Error(`Open-Meteo forecast failed: ${res.status}`);
    }
    return res.json() as Promise<OpenMeteoForecastResponse>;
  }

  async getMarineForecast(
    location: ResolvedLocation
  ): Promise<OpenMeteoMarineResponse | undefined> {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      daily: [
        "wave_height_max",
        "wave_period_max",
        "swell_wave_height_max",
        "wind_wave_height_max",
      ].join(","),
      forecast_days: "7",
      ...(location.timezone ? { timezone: location.timezone } : {}),
    });

    const res = await fetch(`${this.marineBaseUrl}?${params}`);
    if (!res.ok) return undefined;
    return res.json() as Promise<OpenMeteoMarineResponse>;
  }
}
