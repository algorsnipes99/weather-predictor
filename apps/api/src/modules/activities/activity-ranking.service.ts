import {
  ActivityRankingResult,
  ActivityScoringInput,
} from "./activity.types";
import { ActivityScorer } from "./scoring/activity-scorer.interface";
import { ActivityScoringException } from "../../shared/errors";

/**
 * Orchestrates all registered activity scorers and returns their results
 * sorted by overall score descending.
 */
export class ActivityRankingService {
  constructor(private readonly scorers: ActivityScorer[]) {}

  /**
   * Runs every scorer against the provided weather input and returns a ranked
   * result with location metadata and a UTC timestamp.
   */
  rank(input: ActivityScoringInput): ActivityRankingResult {
    const activities = this.scorers
      .flatMap((scorer) => {
        try {
          return [scorer.score(input)];
        } catch (err) {
          const wrapped =
            err instanceof ActivityScoringException
              ? err
              : new ActivityScoringException(
                  scorer.activity,
                  err instanceof Error ? err.message : undefined,
                );
          console.error(`[ActivityRankingService] Scorer failed — skipping ${scorer.activity}:`, wrapped);
          return [];
        }
      })
      .sort((a, b) => b.score - a.score);

    return {
      location: input.location,
      generatedAt: new Date().toISOString(),
      activities,
    };
  }
}
