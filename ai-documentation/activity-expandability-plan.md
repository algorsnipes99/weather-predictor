# Activity Expandability Plan

## Problem

The original `ActivityRankingService` treated all scorers as flat and independent.
As more activities are added, two issues emerge:

1. **Duplicated signal logic** — dependent activities (e.g. `IndoorSightseeing`) recalculate
   the same weather signals (avgTemp, windScore, etc.) that an independent scorer already computed.

2. **No execution ordering** — there is no concept of one activity depending on another's result,
   so dependent scorers cannot reuse or invert an independent scorer's output.

---

## Status: Implemented

All changes below are live and all 137 tests pass.

---

## Solution: Iterative Dependency Resolution (Kahn's Algorithm)

### How it works

`ActivityRankingService.rank()` maintains two structures:

- `completed: Map<Activity, ActivityRanking>` — results that have finished
- `remaining: ActivityScorer[]` — scorers not yet run

Each round it picks every scorer whose dependency is already in `completed`
(or has no dependency), runs them, and removes them from `remaining`.
This repeats until `remaining` is empty.

If a round produces zero runnables but `remaining` is non-empty, a deadlock is
detected (circular dependency or a `dependsOn` pointing to a non-existent activity).
The stuck scorers are logged and skipped rather than looping forever.

This handles chains of any depth — `A → B → C → D` resolves in 4 rounds with
no changes to the calling code.

```ts
while (remaining.length > 0) {
  const runnable = remaining.filter(
    (s) => !s.dependsOn || completed.has(s.dependsOn),
  );

  if (runnable.length === 0) {
    // deadlock — cycle or missing dependency
    console.error(`[ActivityRankingService] Dependency deadlock — skipping: ${stuck}`);
    break;
  }

  for (const scorer of runnable) {
    this.runScorer(scorer, input, completed);
  }

  remaining = remaining.filter((s) => !completed.has(s.activity));
}
```

---

### Scorer interface

```ts
// apps/api/src/modules/activities/scoring/activity-scorer.interface.ts
export interface ActivityScorer {
  activity: Activity;
  dependsOn?: Activity;  // undefined = independent
  score(input: ActivityScoringInput, dependencies?: Map<Activity, ActivityRanking>): ActivityRanking;
}
```

`dependsOn` is optional — independent scorers (Skiing, Surfing, OutdoorSightseeing) need no changes.

---

### IndoorSightseeingScorer

Declares `dependsOn: "OUTDOOR_SIGHTSEEING"` and inverts outdoor daily scores directly
when the dependency result is available, rather than recalculating shared weather signals.
Falls back to independent calculation if the dependency is unavailable.

```ts
readonly dependsOn: Activity = "OUTDOOR_SIGHTSEEING";

score(input, dependencies?) {
  const outdoor = dependencies?.get("OUTDOOR_SIGHTSEEING");
  if (outdoor) {
    // invert each day's score directly: 100 - outdoorScore
  }
  return super.score(input); // fallback
}
```

---

## Files Changed

| File | Change |
|---|---|
| `activity-scorer.interface.ts` | Added optional `dependsOn` and `dependencies` map to `score` signature |
| `activity-ranking.service.ts` | Iterative dependency resolution loop with deadlock detection |
| `indoor-sightseeing.scorer.ts` | Added `dependsOn`, consumes outdoor result if available |
| `base-activity-scorer.ts` | Updated `score` signature to accept optional `dependencies` map (unused, `_dependencies`) |

---

## Future: Shared Intermediate Signals

For activities that share signals (e.g. hiking and outdoor sightseeing both use
`tempComfort` and `windScore`), introduce a pre-computation step:

```ts
// apps/api/src/modules/activities/daily-conditions.ts
export interface DailyConditions {
  date: string;
  tempComfort: number;    // 0–100
  dryScore: number;       // 0–100
  windScore: number;      // 0–100
  isSevereWeather: boolean;
}
```

`ActivityScoringInput` would carry `dailyConditions?: DailyConditions[]`, computed once
by `ActivityRankingService` before the scoring loop. Scorers read from it rather than
recalculating from raw weather data.

Revisit when a 5th+ activity is added that shares signals with an existing scorer.
