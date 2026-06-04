import {
  Activity,
  ActivityRanking,
  ActivityRankingResult,
  ActivityScoringInput,
} from "./activity.types";
import { ActivityScorer } from "./scoring/activity-scorer.interface";
import { ActivityScoringException } from "../../shared/errors";

/**
 * Orchestrates all registered activity scorers and returns their results
 * sorted by overall score descending.
 *
 * Scorers declaring `dependsOn` are run after all independent scorers complete.
 * Their completed results are passed into dependent scorers via a `Map` so
 * dependent scorers can reuse or invert existing results rather than
 * recalculating shared signals.
 */
export class ActivityRankingService {
  constructor(private readonly scorers: ActivityScorer[]) {}

  rank(input: ActivityScoringInput): ActivityRankingResult {
    const completed = new Map<Activity, ActivityRanking>();
    let remaining = [...this.scorers];

    while (remaining.length > 0) {
      const runnable = remaining.filter(
        (s) => !s.dependsOn || completed.has(s.dependsOn),
      );

      if (runnable.length === 0) {
        // Nothing can run — unresolvable dependency chain or cycle
        const stuck = remaining.map((s) => s.activity).join(", ");
        console.error(`[ActivityRankingService] Dependency deadlock — skipping: ${stuck}`);
        break;
      }

      for (const scorer of runnable) {
        this.runScorer(scorer, input, completed);
      }

      remaining = remaining.filter((s) => !completed.has(s.activity));
    }

    const activities = [...completed.values()].sort((a, b) => b.score - a.score);

    return {
      location: input.location,
      generatedAt: new Date().toISOString(),
      activities,
    };
  }

  private runScorer(
    scorer: ActivityScorer,
    input: ActivityScoringInput,
    completed: Map<Activity, ActivityRanking>,
  ): void {
    try {
      completed.set(scorer.activity, scorer.score(input, completed));
    } catch (err) {
      const wrapped =
        err instanceof ActivityScoringException
          ? err
          : new ActivityScoringException(
              scorer.activity,
              err instanceof Error ? err.message : undefined,
            );
      console.error(`[ActivityRankingService] Scorer failed — skipping ${scorer.activity}:`, wrapped);
    }
  }
}
