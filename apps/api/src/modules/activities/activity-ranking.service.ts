import {
  ActivityRankingResult,
  ActivityScoringInput,
} from "./activity.types";
import { ActivityScorer } from "./scoring/activity-scorer.interface";

export class ActivityRankingService {
  constructor(private readonly scorers: ActivityScorer[]) {}

  rank(input: ActivityScoringInput): ActivityRankingResult {
    const activities = this.scorers
      .map((scorer) => scorer.score(input))
      .sort((a, b) => b.score - a.score);

    return {
      location: input.location,
      generatedAt: new Date().toISOString(),
      activities,
    };
  }
}
