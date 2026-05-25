import { describe, it, expect } from "vitest";
import { mapOpenMeteoForecastToDailyWeather } from "../../../src/modules/weather/open-meteo.mapper";
import {
  mixedForecastResponse,
  snowyForecastResponse,
} from "../../fixtures/open-meteo-forecast.fixture";
import { OpenMeteoForecastResponse } from "../../../src/modules/weather/open-meteo.types";

describe("mapOpenMeteoForecastToDailyWeather", () => {
  it("returns 7 items from mixedForecastResponse", () => {
    const result = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    expect(result).toHaveLength(7);
  });

  it("first day date is 2026-05-23", () => {
    const result = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    expect(result[0].date).toBe("2026-05-23");
  });

  it("last day date is 2026-05-29", () => {
    const result = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    expect(result[6].date).toBe("2026-05-29");
  });

  it("maps temperature_2m_min[0] to minTemperatureC", () => {
    const result = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    expect(result[0].minTemperatureC).toBe(15);
  });

  it("maps temperature_2m_max[0] to maxTemperatureC", () => {
    const result = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    expect(result[0].maxTemperatureC).toBe(24);
  });

  it("maps precipitation_sum[0] to precipitationMm", () => {
    const result = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    expect(result[0].precipitationMm).toBe(0);
  });

  it("maps snowfall_sum to snowfallCm", () => {
    const result = mapOpenMeteoForecastToDailyWeather(snowyForecastResponse);
    expect(result[0].snowfallCm).toBe(8);
    expect(result[1].snowfallCm).toBe(12);
    expect(result[3].snowfallCm).toBe(15);
  });

  it("maps wind_speed_10m_max to maxWindKph", () => {
    const result = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    expect(result[0].maxWindKph).toBe(14);
    expect(result[3].maxWindKph).toBe(45);
  });

  it("maps weather_code to weatherCode", () => {
    const result = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    expect(result[0].weatherCode).toBe(1);
    expect(result[2].weatherCode).toBe(61);
  });

  it("maps cloudCoverPercent when cloud_cover_mean is present", () => {
    const result = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    expect(result[0].cloudCoverPercent).toBe(20);
    expect(result[3].cloudCoverPercent).toBe(95);
  });

  it("cloudCoverPercent is undefined when cloud_cover_mean is absent", () => {
    const responseWithoutCloud: OpenMeteoForecastResponse = {
      ...snowyForecastResponse,
      daily: {
        ...snowyForecastResponse.daily,
        cloud_cover_mean: undefined,
      },
    };
    const result = mapOpenMeteoForecastToDailyWeather(responseWithoutCloud);
    expect(result[0].cloudCoverPercent).toBeUndefined();
  });

  it("all 7 days have correct parallel array mapping", () => {
    const result = mapOpenMeteoForecastToDailyWeather(mixedForecastResponse);
    const times = mixedForecastResponse.daily.time;
    const minTemps = mixedForecastResponse.daily.temperature_2m_min;
    const maxTemps = mixedForecastResponse.daily.temperature_2m_max;

    result.forEach((day, i) => {
      expect(day.date).toBe(times[i]);
      expect(day.minTemperatureC).toBe(minTemps[i]);
      expect(day.maxTemperatureC).toBe(maxTemps[i]);
    });
  });
});
