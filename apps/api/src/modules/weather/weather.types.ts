export interface DailyWeather {
  date: string;
  minTemperatureC: number;
  maxTemperatureC: number;
  precipitationMm: number;
  snowfallCm: number;
  maxWindKph: number;
  weatherCode: number;
  cloudCoverPercent?: number;
}

export interface DailyMarineWeather {
  date: string;
  waveHeightM?: number;
  wavePeriodSeconds?: number;
  swellWaveHeightM?: number;
  windWaveHeightM?: number;
}

export interface SevenDayWeather {
  daily: DailyWeather[];
  marineDaily?: DailyMarineWeather[];
}
