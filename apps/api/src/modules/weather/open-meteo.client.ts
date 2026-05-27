import { ResolvedLocation } from "../location/location.types";
import {
  OpenMeteoForecastResponse,
  OpenMeteoMarineResponse,
} from "./open-meteo.types";
import {
  weatherFetchDuration,
  weatherFetchErrorsTotal,
} from "../../metrics/registry.js";

export interface OpenMeteoClient {
  getForecast(location: ResolvedLocation): Promise<OpenMeteoForecastResponse>;
  getMarineForecast(
    location: ResolvedLocation
  ): Promise<OpenMeteoMarineResponse | undefined>;
}

/**
 * Live HTTP implementation of `OpenMeteoClient`.
 * Records fetch duration and error metrics for both forecast and marine calls.
 * Throws on forecast failure; returns `undefined` on marine failure (marine is optional).
 */
export class HttpOpenMeteoClient implements OpenMeteoClient {
  private readonly forecastBaseUrl =
    "https://api.open-meteo.com/v1/forecast";
  private readonly marineBaseUrl =
    "https://marine-api.open-meteo.com/v1/marine";

  /** Fetches the 7-day general forecast. Throws on network error or non-OK response. */
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

    const start = process.hrtime.bigint();
    const res = await fetch(`${this.forecastBaseUrl}?${params}`).catch((err) => {
      weatherFetchErrorsTotal.inc({ type: "forecast" });
      throw err;
    });
    if (!res.ok) {
      weatherFetchErrorsTotal.inc({ type: "forecast" });
      throw new Error(`Open-Meteo forecast failed: ${res.status}`);
    }
    weatherFetchDuration.observe({ type: "forecast" }, Number(process.hrtime.bigint() - start) / 1e9);
    return (await res.json()) as OpenMeteoForecastResponse;
  }

  /** Fetches the 7-day marine forecast. Returns `undefined` rather than throwing — not all locations have marine data. */
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

    const start = process.hrtime.bigint();
    const res = await fetch(`${this.marineBaseUrl}?${params}`).catch(() => undefined);
    if (!res || !res.ok) {
      if (!res) weatherFetchErrorsTotal.inc({ type: "marine" });
      return undefined;
    }
    weatherFetchDuration.observe({ type: "marine" }, Number(process.hrtime.bigint() - start) / 1e9);
    return (await res.json()) as OpenMeteoMarineResponse;
  }
}
