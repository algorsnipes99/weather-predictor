import { ResolvedLocation } from "../location/location.types";
import { DailyMarineWeather, DailyWeather } from "../weather/weather.types";
import { ScoreLabel } from "../../shared/labels";

export type Activity =
  | "SKIING"
  | "SURFING"
  | "OUTDOOR_SIGHTSEEING"
  | "INDOOR_SIGHTSEEING";

export interface DailyActivityScore {
  date: string;
  score: number;
  label: ScoreLabel;
  reasons: string[];
}

export interface ActivityRanking {
  activity: Activity;
  score: number;
  label: ScoreLabel;
  summary: string;
  days: DailyActivityScore[];
}

export interface ActivityScoringInput {
  location: ResolvedLocation;
  dailyWeather: DailyWeather[];
  marineWeather?: DailyMarineWeather[];
}

export interface ActivityRankingResult {
  location: ResolvedLocation;
  generatedAt: string;
  activities: ActivityRanking[];
}
