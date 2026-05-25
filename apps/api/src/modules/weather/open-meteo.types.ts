export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  daily: {
    time: string[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    precipitation_sum: number[];
    snowfall_sum: number[];
    wind_speed_10m_max: number[];
    weather_code: number[];
    cloud_cover_mean?: number[];
  };
  daily_units?: Record<string, string>;
}

export interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  timezone?: string;
  daily: {
    time: string[];
    wave_height_max?: number[];
    wave_period_max?: number[];
    swell_wave_height_max?: number[];
    wind_wave_height_max?: number[];
  };
  daily_units?: Record<string, string>;
}
