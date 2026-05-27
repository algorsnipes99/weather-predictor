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
  }
}

export class ActivityScoringException extends AppError {
  constructor(
    public readonly activity: string,
    message?: string,
  ) {
    super(
      message ?? `Scoring failed for activity: ${activity}.`,
      "ACTIVITY_SCORING_ERROR",
      false,
    );
  }
}
