import {
  Activity,
  ActivityRanking,
  ActivityScoringInput,
} from "../activity.types";

/**
 * Contract that every activity scorer must implement.
 * Each scorer is responsible for a single activity type and produces
 * a per-day breakdown plus an overall score and label.
 *
 * Set `dependsOn` to declare a dependency on another activity's result.
 * The ranking service runs independent scorers first and passes their
 * completed results into dependent scorers via the `dependencies` map.
 */
export interface ActivityScorer {
  activity: Activity;
  dependsOn?: Activity;
  score(input: ActivityScoringInput, dependencies?: Map<Activity, ActivityRanking>): ActivityRanking;
}
