import { ResolvedLocation } from "../location/location.types";
import {
  OpenMeteoForecastResponse,
  OpenMeteoMarineResponse,
} from "./open-meteo.types";
import {
  weatherFetchDuration,
  weatherFetchErrorsTotal,
} from "../../metrics/registry.js";
import { ExternalApiException } from "../../shared/errors.js";

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

  private buildParams(location: ResolvedLocation, daily: string[]): URLSearchParams {
    return new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      daily: daily.join(","),
      forecast_days: "7",
      ...(location.timezone ? { timezone: location.timezone } : {}),
    });
  }

  /** Fetches the 7-day general forecast. Throws on network error, non-OK response, or malformed body. */
  async getForecast(location: ResolvedLocation): Promise<OpenMeteoForecastResponse> {
    const params = this.buildParams(location, [
      "temperature_2m_min",
      "temperature_2m_max",
      "precipitation_sum",
      "snowfall_sum",
      "wind_speed_10m_max",
      "weather_code",
      "cloud_cover_mean",
    ]);

    const start = process.hrtime.bigint();
    const res = await fetch(`${this.forecastBaseUrl}?${params}`).catch((err: unknown) => {
      weatherFetchErrorsTotal.inc({ type: "forecast" });
      throw new ExternalApiException("forecast", undefined, (err instanceof Error ? err.message : undefined));
    });

    if (!res.ok) {
      weatherFetchErrorsTotal.inc({ type: "forecast" });
      throw new ExternalApiException("forecast", res.status);
    }

    try {
      const data = await res.json();
      weatherFetchDuration.observe({ type: "forecast" }, Number(process.hrtime.bigint() - start) / 1e9);
      return data as OpenMeteoForecastResponse;
    } catch {
      weatherFetchErrorsTotal.inc({ type: "forecast" });
      throw new ExternalApiException("forecast", res.status, "Weather service returned an unreadable response.");
    }
  }

  /** Fetches the 7-day marine forecast. Returns `undefined` rather than throwing — not all locations have marine data. */
  async getMarineForecast(
    location: ResolvedLocation
  ): Promise<OpenMeteoMarineResponse | undefined> {
    const params = this.buildParams(location, [
      "wave_height_max",
      "wave_period_max",
      "swell_wave_height_max",
      "wind_wave_height_max",
    ]);

    const start = process.hrtime.bigint();
    const res = await fetch(`${this.marineBaseUrl}?${params}`).catch(() => undefined);
    if (!res || !res.ok) {
      weatherFetchErrorsTotal.inc({ type: "marine" });
      return undefined;
    }

    try {
      const data = await res.json();
      weatherFetchDuration.observe({ type: "marine" }, Number(process.hrtime.bigint() - start) / 1e9);
      return data as OpenMeteoMarineResponse;
    } catch {
      weatherFetchErrorsTotal.inc({ type: "marine" });
      return undefined;
    }
  }
}
