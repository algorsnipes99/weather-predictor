export type ScoreLabel = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export type Activity =
  | "SKIING"
  | "SURFING"
  | "OUTDOOR_SIGHTSEEING"
  | "INDOOR_SIGHTSEEING";

export interface ResolvedLocation {
  name: string;
  country?: string | null;
  latitude: number;
  longitude: number;
}

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

export interface ActivityRankingResult {
  location: ResolvedLocation;
  generatedAt: string;
  activities: ActivityRanking[];
}

export interface ActivityRankingsQueryData {
  activityRankings: ActivityRankingResult;
}

export interface ResolvedLocationInput {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface ActivityRankingInput {
  location: ResolvedLocationInput;
}
