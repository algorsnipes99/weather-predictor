import { OpenMeteoForecastResponse } from "../../modules/weather/open-meteo.types";

export const mixedForecastResponse: OpenMeteoForecastResponse = {
  latitude: -33.9249,
  longitude: 18.4241,
  timezone: "Africa/Johannesburg",
  daily_units: {
    time: "iso8601",
    temperature_2m_min: "°C",
    temperature_2m_max: "°C",
    precipitation_sum: "mm",
    snowfall_sum: "cm",
    wind_speed_10m_max: "km/h",
    weather_code: "wmo code",
    cloud_cover_mean: "%",
  },
  daily: {
    time: ["2026-05-23","2026-05-24","2026-05-25","2026-05-26","2026-05-27","2026-05-28","2026-05-29"],
    temperature_2m_min: [15, 14, 11, 8, 6, 13, 16],
    temperature_2m_max: [24, 22, 18, 12, 9, 19, 26],
    precipitation_sum: [0, 1, 8, 18, 4, 0, 0],
    snowfall_sum: [0, 0, 0, 0, 0, 0, 0],
    wind_speed_10m_max: [14, 18, 32, 45, 28, 12, 10],
    weather_code: [1, 2, 61, 63, 80, 1, 0],
    cloud_cover_mean: [20, 45, 80, 95, 70, 25, 10],
  },
};

export const snowyForecastResponse: OpenMeteoForecastResponse = {
  latitude: 46.0207,
  longitude: 7.7491,
  timezone: "Europe/Zurich",
  daily: {
    time: ["2026-05-23","2026-05-24","2026-05-25","2026-05-26","2026-05-27","2026-05-28","2026-05-29"],
    temperature_2m_min: [-8, -7, -5, -6, -4, -3, -2],
    temperature_2m_max: [-1, 0, 1, -2, 2, 3, 4],
    precipitation_sum: [3, 4, 1, 8, 6, 2, 0],
    snowfall_sum: [8, 12, 4, 15, 10, 3, 0],
    wind_speed_10m_max: [18, 22, 14, 30, 25, 20, 12],
    weather_code: [71, 73, 71, 75, 73, 71, 3],
    cloud_cover_mean: [90, 95, 75, 98, 90, 70, 50],
  },
};

export const extremeBadWeatherResponse: OpenMeteoForecastResponse = {
  latitude: 51.5072,
  longitude: -0.1276,
  timezone: "Europe/London",
  daily: {
    time: ["2026-05-23","2026-05-24","2026-05-25","2026-05-26","2026-05-27","2026-05-28","2026-05-29"],
    temperature_2m_min: [4, 5, 6, 6, 5, 7, 8],
    temperature_2m_max: [9, 10, 11, 12, 10, 13, 14],
    precipitation_sum: [22, 30, 18, 12, 25, 8, 5],
    snowfall_sum: [0, 0, 0, 0, 0, 0, 0],
    wind_speed_10m_max: [55, 62, 48, 44, 58, 35, 30],
    weather_code: [65, 82, 63, 61, 65, 80, 3],
    cloud_cover_mean: [100, 98, 95, 90, 100, 85, 70],
  },
};
