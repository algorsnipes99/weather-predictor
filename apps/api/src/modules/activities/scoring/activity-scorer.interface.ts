import {
  Activity,
  ActivityRanking,
  ActivityScoringInput,
} from "../activity.types";

export interface ActivityScorer {
  activity: Activity;
  score(input: ActivityScoringInput): ActivityRanking;
}
