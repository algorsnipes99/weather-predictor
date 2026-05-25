import {
  Activity,
  ActivityRanking,
  ActivityScoringInput,
} from "../activity.types";

/**
 * Contract that every activity scorer must implement.
 * Each scorer is responsible for a single activity type and produces
 * a per-day breakdown plus an overall score and label.
 */
export interface ActivityScorer {
  activity: Activity;
  /** Scores all days in the input and returns the aggregated ranking. */
  score(input: ActivityScoringInput): ActivityRanking;
}
