import { DailyWeather, DailyMarineWeather } from "../../modules/weather/weather.types";

/**
 * Derived from mixedForecastResponse (Cape Town):
 * Mix of good and bad days, no snow, moderate to heavy rain mid-week.
 */
export const mixedDailyWeather: DailyWeather[] = [
  { date: "2026-05-23", minTemperatureC: 15, maxTemperatureC: 24, precipitationMm: 0,  snowfallCm: 0, maxWindKph: 14, weatherCode: 1,  cloudCoverPercent: 20 },
  { date: "2026-05-24", minTemperatureC: 14, maxTemperatureC: 22, precipitationMm: 1,  snowfallCm: 0, maxWindKph: 18, weatherCode: 2,  cloudCoverPercent: 45 },
  { date: "2026-05-25", minTemperatureC: 11, maxTemperatureC: 18, precipitationMm: 8,  snowfallCm: 0, maxWindKph: 32, weatherCode: 61, cloudCoverPercent: 80 },
  { date: "2026-05-26", minTemperatureC: 8,  maxTemperatureC: 12, precipitationMm: 18, snowfallCm: 0, maxWindKph: 45, weatherCode: 63, cloudCoverPercent: 95 },
  { date: "2026-05-27", minTemperatureC: 6,  maxTemperatureC: 9,  precipitationMm: 4,  snowfallCm: 0, maxWindKph: 28, weatherCode: 80, cloudCoverPercent: 70 },
  { date: "2026-05-28", minTemperatureC: 13, maxTemperatureC: 19, precipitationMm: 0,  snowfallCm: 0, maxWindKph: 12, weatherCode: 1,  cloudCoverPercent: 25 },
  { date: "2026-05-29", minTemperatureC: 16, maxTemperatureC: 26, precipitationMm: 0,  snowfallCm: 0, maxWindKph: 10, weatherCode: 0,  cloudCoverPercent: 10 },
];

/**
 * Derived from snowyForecastResponse (Zermatt):
 * Cold throughout, heavy snowfall most days.
 */
export const snowyDailyWeather: DailyWeather[] = [
  { date: "2026-05-23", minTemperatureC: -8, maxTemperatureC: -1, precipitationMm: 3, snowfallCm: 8,  maxWindKph: 18, weatherCode: 71, cloudCoverPercent: 90 },
  { date: "2026-05-24", minTemperatureC: -7, maxTemperatureC: 0,  precipitationMm: 4, snowfallCm: 12, maxWindKph: 22, weatherCode: 73, cloudCoverPercent: 95 },
  { date: "2026-05-25", minTemperatureC: -5, maxTemperatureC: 1,  precipitationMm: 1, snowfallCm: 4,  maxWindKph: 14, weatherCode: 71, cloudCoverPercent: 75 },
  { date: "2026-05-26", minTemperatureC: -6, maxTemperatureC: -2, precipitationMm: 8, snowfallCm: 15, maxWindKph: 30, weatherCode: 75, cloudCoverPercent: 98 },
  { date: "2026-05-27", minTemperatureC: -4, maxTemperatureC: 2,  precipitationMm: 6, snowfallCm: 10, maxWindKph: 25, weatherCode: 73, cloudCoverPercent: 90 },
  { date: "2026-05-28", minTemperatureC: -3, maxTemperatureC: 3,  precipitationMm: 2, snowfallCm: 3,  maxWindKph: 20, weatherCode: 71, cloudCoverPercent: 70 },
  { date: "2026-05-29", minTemperatureC: -2, maxTemperatureC: 4,  precipitationMm: 0, snowfallCm: 0,  maxWindKph: 12, weatherCode: 3,  cloudCoverPercent: 50 },
];

/**
 * Derived from extremeBadWeatherResponse (London):
 * Heavy rain, very high winds, severe weather codes most days.
 */
export const badWeatherDailyWeather: DailyWeather[] = [
  { date: "2026-05-23", minTemperatureC: 4,  maxTemperatureC: 9,  precipitationMm: 22, snowfallCm: 0, maxWindKph: 55, weatherCode: 65, cloudCoverPercent: 100 },
  { date: "2026-05-24", minTemperatureC: 5,  maxTemperatureC: 10, precipitationMm: 30, snowfallCm: 0, maxWindKph: 62, weatherCode: 82, cloudCoverPercent: 98  },
  { date: "2026-05-25", minTemperatureC: 6,  maxTemperatureC: 11, precipitationMm: 18, snowfallCm: 0, maxWindKph: 48, weatherCode: 63, cloudCoverPercent: 95  },
  { date: "2026-05-26", minTemperatureC: 6,  maxTemperatureC: 12, precipitationMm: 12, snowfallCm: 0, maxWindKph: 44, weatherCode: 61, cloudCoverPercent: 90  },
  { date: "2026-05-27", minTemperatureC: 5,  maxTemperatureC: 10, precipitationMm: 25, snowfallCm: 0, maxWindKph: 58, weatherCode: 65, cloudCoverPercent: 100 },
  { date: "2026-05-28", minTemperatureC: 7,  maxTemperatureC: 13, precipitationMm: 8,  snowfallCm: 0, maxWindKph: 35, weatherCode: 80, cloudCoverPercent: 85  },
  { date: "2026-05-29", minTemperatureC: 8,  maxTemperatureC: 14, precipitationMm: 5,  snowfallCm: 0, maxWindKph: 30, weatherCode: 3,  cloudCoverPercent: 70  },
];

/**
 * Derived from goodSurfMarineResponse (Cape Town):
 * 1–2.5m wave heights, 7–13s periods — good surfing conditions.
 */
export const goodSurfMarineWeather: DailyMarineWeather[] = [
  { date: "2026-05-23", waveHeightM: 1.2, wavePeriodSeconds: 9,  swellWaveHeightM: 1.0, windWaveHeightM: 0.4 },
  { date: "2026-05-24", waveHeightM: 1.6, wavePeriodSeconds: 11, swellWaveHeightM: 1.4, windWaveHeightM: 0.5 },
  { date: "2026-05-25", waveHeightM: 2.0, wavePeriodSeconds: 12, swellWaveHeightM: 1.8, windWaveHeightM: 0.7 },
  { date: "2026-05-26", waveHeightM: 2.5, wavePeriodSeconds: 13, swellWaveHeightM: 2.2, windWaveHeightM: 0.9 },
  { date: "2026-05-27", waveHeightM: 1.8, wavePeriodSeconds: 10, swellWaveHeightM: 1.5, windWaveHeightM: 0.6 },
  { date: "2026-05-28", waveHeightM: 1.4, wavePeriodSeconds: 8,  swellWaveHeightM: 1.1, windWaveHeightM: 0.4 },
  { date: "2026-05-29", waveHeightM: 1.1, wavePeriodSeconds: 7,  swellWaveHeightM: 0.9, windWaveHeightM: 0.3 },
];

/**
 * Derived from poorSurfMarineResponse (Cape Town):
 * 0.1–0.3m wave heights, 3–5s periods — too small/choppy for surfing.
 */
export const poorSurfMarineWeather: DailyMarineWeather[] = [
  { date: "2026-05-23", waveHeightM: 0.1, wavePeriodSeconds: 3, swellWaveHeightM: 0.1, windWaveHeightM: 0.1 },
  { date: "2026-05-24", waveHeightM: 0.2, wavePeriodSeconds: 4, swellWaveHeightM: 0.1, windWaveHeightM: 0.1 },
  { date: "2026-05-25", waveHeightM: 0.1, wavePeriodSeconds: 3, swellWaveHeightM: 0.1, windWaveHeightM: 0.1 },
  { date: "2026-05-26", waveHeightM: 0.3, wavePeriodSeconds: 5, swellWaveHeightM: 0.2, windWaveHeightM: 0.2 },
  { date: "2026-05-27", waveHeightM: 0.2, wavePeriodSeconds: 4, swellWaveHeightM: 0.1, windWaveHeightM: 0.1 },
  { date: "2026-05-28", waveHeightM: 0.1, wavePeriodSeconds: 3, swellWaveHeightM: 0.1, windWaveHeightM: 0.1 },
  { date: "2026-05-29", waveHeightM: 0.1, wavePeriodSeconds: 3, swellWaveHeightM: 0.1, windWaveHeightM: 0.1 },
];
