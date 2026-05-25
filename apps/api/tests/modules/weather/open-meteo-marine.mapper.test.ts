import { describe, it, expect } from "vitest";
import { mapOpenMeteoMarineToDailyWeather } from "../../../src/modules/weather/open-meteo-marine.mapper";
import {
  goodSurfMarineResponse,
  poorSurfMarineResponse,
} from "../../fixtures/open-meteo-marine.fixture";
import { OpenMeteoMarineResponse } from "../../../src/modules/weather/open-meteo.types";

describe("mapOpenMeteoMarineToDailyWeather", () => {
  it("returns 7 items from goodSurfMarineResponse", () => {
    const result = mapOpenMeteoMarineToDailyWeather(goodSurfMarineResponse);
    expect(result).toHaveLength(7);
  });

  it("returns 7 items from poorSurfMarineResponse", () => {
    const result = mapOpenMeteoMarineToDailyWeather(poorSurfMarineResponse);
    expect(result).toHaveLength(7);
  });

  it("first day date is 2026-05-23", () => {
    const result = mapOpenMeteoMarineToDailyWeather(goodSurfMarineResponse);
    expect(result[0].date).toBe("2026-05-23");
  });

  it("last day date is 2026-05-29", () => {
    const result = mapOpenMeteoMarineToDailyWeather(goodSurfMarineResponse);
    expect(result[6].date).toBe("2026-05-29");
  });

  it("first day waveHeightM matches wave_height_max[0]", () => {
    const result = mapOpenMeteoMarineToDailyWeather(goodSurfMarineResponse);
    expect(result[0].waveHeightM).toBe(1.2);
  });

  it("maps wave_period_max to wavePeriodSeconds", () => {
    const result = mapOpenMeteoMarineToDailyWeather(goodSurfMarineResponse);
    expect(result[0].wavePeriodSeconds).toBe(9);
    expect(result[3].wavePeriodSeconds).toBe(13);
  });

  it("maps swell_wave_height_max to swellWaveHeightM", () => {
    const result = mapOpenMeteoMarineToDailyWeather(goodSurfMarineResponse);
    expect(result[0].swellWaveHeightM).toBe(1.0);
  });

  it("maps wind_wave_height_max to windWaveHeightM", () => {
    const result = mapOpenMeteoMarineToDailyWeather(goodSurfMarineResponse);
    expect(result[0].windWaveHeightM).toBe(0.4);
  });

  it("handles absent optional fields gracefully — all fields undefined", () => {
    const noOptionalFields: OpenMeteoMarineResponse = {
      latitude: -33.9249,
      longitude: 18.4241,
      daily: {
        time: ["2026-05-23","2026-05-24","2026-05-25","2026-05-26","2026-05-27","2026-05-28","2026-05-29"],
      },
    };
    const result = mapOpenMeteoMarineToDailyWeather(noOptionalFields);
    expect(result).toHaveLength(7);
    expect(result[0].waveHeightM).toBeUndefined();
    expect(result[0].wavePeriodSeconds).toBeUndefined();
    expect(result[0].swellWaveHeightM).toBeUndefined();
    expect(result[0].windWaveHeightM).toBeUndefined();
  });

  it("all 7 days map wave heights correctly for poor surf", () => {
    const result = mapOpenMeteoMarineToDailyWeather(poorSurfMarineResponse);
    const heights = poorSurfMarineResponse.daily.wave_height_max!;
    result.forEach((day, i) => {
      expect(day.waveHeightM).toBe(heights[i]);
    });
  });
});
