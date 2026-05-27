# Exception Handling Plan

## Goal

Close error handling gaps across the API by introducing a typed exception hierarchy,
ensuring failures are contained to the correct layer, and controlling what information
is exposed to the GraphQL client versus logged internally.

---

## Exception Hierarchy

```
AppError (base, extends Error)
  ├── ExternalApiException   — Open-Meteo forecast / marine failures
  └── ActivityScoringException — individual scorer or NaN-data failures
```

All custom exceptions live in `apps/api/src/shared/errors.ts`.

### `AppError`

Base class for all application errors. The `isOperational` flag distinguishes
expected failures (network timeouts, bad API responses) from unexpected bugs.

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

| Property | Purpose |
|---|---|
| `message` | Safe, user-facing description of the failure |
| `code` | Machine-readable string (e.g. `EXTERNAL_API_ERROR`) — useful for client-side handling |
| `isOperational` | `true` = expected failure, forward message to client. `false` = bug, return generic message, log full stack |

### `ExternalApiException`

Thrown by `HttpOpenMeteoClient` for network errors, non-OK HTTP responses, and
JSON parse failures.

```ts
export class ExternalApiException extends AppError {
  constructor(
    public readonly apiType: "forecast" | "marine",
    public readonly httpStatus?: number,
    message?: string,
  ) {
    super(
      message ?? `Weather forecast service unavailable (${apiType}).`,
      "EXTERNAL_API_ERROR",
      true,
    );
    this.apiType = apiType;
    this.httpStatus = httpStatus;
  }
}
```

### `ActivityScoringException`

Thrown by `BaseActivityScorer` when a scorer produces a NaN score for a day,
or by `ActivityRankingService` when it catches an unexpected scorer throw.

```ts
export class ActivityScoringException extends AppError {
  constructor(
    public readonly activity: string,
    message?: string,
  ) {
    super(
      message ?? `Scoring failed for activity: ${activity}.`,
      "ACTIVITY_SCORING_ERROR",
      false, // unexpected — don't forward internal detail to client
    );
  }
}
```

---

## Files to Create

| File | Change |
|---|---|
| `apps/api/src/shared/errors.ts` | `AppError`, `ExternalApiException`, `ActivityScoringException` |

---

## Files to Modify

### `apps/api/src/modules/weather/open-meteo.client.ts`

| Gap | Fix |
|---|---|
| Throws plain `Error` on forecast failure | Throw `ExternalApiException` with `apiType: "forecast"` |
| `res.json()` not guarded | Wrap in try/catch, throw `ExternalApiException` on parse failure |
| Marine non-OK response not metered | Move metric increment to cover both `!res` and `!res.ok` cases |
| Marine non-OK silently returns `undefined` | Still returns `undefined` (intentional), but now meters the event correctly |

### `apps/api/src/modules/activities/scoring/base-activity-scorer.ts`

| Gap | Fix |
|---|---|
| NaN scores silently returned | After `scoreDay`, check `isNaN(result.score)` — throw `ActivityScoringException` |

### `apps/api/src/modules/activities/activity-ranking.service.ts`

| Gap | Fix |
|---|---|
| One scorer crash kills all four | Wrap each `scorer.score()` in try/catch — log and skip the failed scorer, continue with remaining |

### `apps/api/src/index.ts`

| Gap | Fix |
|---|---|
| Apollo forwards raw error messages to client | Add `formatError` to `ApolloServer` config |

`formatError` logic:

```
if error is AppError and isOperational:
  forward error.message and error.code to client safely

else:
  log full error + stack server-side
  return generic { message: "Internal server error", code: "INTERNAL_ERROR" }
```

---

## Error Flow After Changes

```
Open-Meteo network/HTTP failure
  → ExternalApiException (isOperational: true)
  → propagates to resolver
  → Apollo formatError: forwards safe message to client

Open-Meteo JSON parse failure
  → ExternalApiException (isOperational: true)
  → same path as above

Scorer produces NaN
  → ActivityScoringException (isOperational: false)
  → caught in ActivityRankingService per-scorer try/catch
  → scorer is skipped, remaining three activities returned
  → error logged server-side with activity name + stack

Scorer throws unexpectedly
  → caught in ActivityRankingService per-scorer try/catch
  → wrapped in ActivityScoringException
  → scorer skipped, error logged

All scorers fail
  → ActivityRankingService returns empty activities array
  → client receives valid response with empty activities (not a 500)

Unhandled unexpected throw reaches Apollo
  → formatError: isOperational: false → generic "Internal server error"
  → full stack logged server-side only
```

---

## What This Does NOT Cover

- Retry logic on transient Open-Meteo failures (could be added with exponential backoff)
- Structured logging (errors currently go to `console.error` — a log library like `pino` would be the next step)
- Alerting on repeated `ExternalApiException` events (Prometheus counter already exists; alerting rules in Alertmanager are out of scope)
- Client-side error code handling in the React frontend (currently shows a generic error message)
