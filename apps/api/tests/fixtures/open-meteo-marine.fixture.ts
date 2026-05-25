import { OpenMeteoMarineResponse } from "../../src/modules/weather/open-meteo.types";

export const goodSurfMarineResponse: OpenMeteoMarineResponse = {
  latitude: -33.9249,
  longitude: 18.4241,
  timezone: "Africa/Johannesburg",
  daily_units: {
    time: "iso8601",
    wave_height_max: "m",
    wave_period_max: "s",
    swell_wave_height_max: "m",
    wind_wave_height_max: "m",
  },
  daily: {
    time: ["2026-05-23","2026-05-24","2026-05-25","2026-05-26","2026-05-27","2026-05-28","2026-05-29"],
    wave_height_max: [1.2, 1.6, 2.0, 2.5, 1.8, 1.4, 1.1],
    wave_period_max: [9, 11, 12, 13, 10, 8, 7],
    swell_wave_height_max: [1.0, 1.4, 1.8, 2.2, 1.5, 1.1, 0.9],
    wind_wave_height_max: [0.4, 0.5, 0.7, 0.9, 0.6, 0.4, 0.3],
  },
};

export const poorSurfMarineResponse: OpenMeteoMarineResponse = {
  latitude: -33.9249,
  longitude: 18.4241,
  timezone: "Africa/Johannesburg",
  daily: {
    time: ["2026-05-23","2026-05-24","2026-05-25","2026-05-26","2026-05-27","2026-05-28","2026-05-29"],
    wave_height_max: [0.1, 0.2, 0.1, 0.3, 0.2, 0.1, 0.1],
    wave_period_max: [3, 4, 3, 5, 4, 3, 3],
    swell_wave_height_max: [0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.1],
    wind_wave_height_max: [0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.1],
  },
};
