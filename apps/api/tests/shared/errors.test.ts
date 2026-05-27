import { describe, it, expect } from "vitest";
import { AppError, ExternalApiException, ActivityScoringException } from "../../src/shared/errors";

// Verifies the base class sets the properties that formatError in Apollo reads
// to decide whether to forward the message to the client or hide it.
describe("AppError", () => {
  it("sets message, code, and isOperational", () => {
    const err = new AppError("something broke", "SOME_CODE", true);
    expect(err.message).toBe("something broke");
    expect(err.code).toBe("SOME_CODE");
    expect(err.isOperational).toBe(true);
  });

  // Operational = safe to forward to the client; non-operational = hide and log internally.
  // Default must be true so subclasses don't accidentally expose internal errors.
  it("defaults isOperational to true", () => {
    const err = new AppError("x", "X");
    expect(err.isOperational).toBe(true);
  });

  it("is an instance of Error", () => {
    expect(new AppError("x", "X")).toBeInstanceOf(Error);
  });

  // name must reflect the subclass so logs are readable at a glance.
  it("name is set to the class name", () => {
    expect(new AppError("x", "X").name).toBe("AppError");
  });

  // Stack trace is captured at construction so the throw site is preserved.
  it("has a stack trace", () => {
    expect(new AppError("x", "X").stack).toBeDefined();
  });
});

// ExternalApiException is thrown by HttpOpenMeteoClient on network errors and non-OK responses.
// isOperational: true — the message is safe to forward to the GraphQL client.
describe("ExternalApiException", () => {
  it("is operational", () => {
    expect(new ExternalApiException("forecast").isOperational).toBe(true);
  });

  it("has code EXTERNAL_API_ERROR", () => {
    expect(new ExternalApiException("forecast").code).toBe("EXTERNAL_API_ERROR");
  });

  // apiType distinguishes forecast vs marine failures in logs and Prometheus metrics.
  it("stores apiType", () => {
    expect(new ExternalApiException("forecast").apiType).toBe("forecast");
    expect(new ExternalApiException("marine").apiType).toBe("marine");
  });

  // httpStatus is included when the API responded but with a non-OK code (e.g. 503).
  it("stores httpStatus when provided", () => {
    expect(new ExternalApiException("forecast", 503).httpStatus).toBe(503);
  });

  // httpStatus is absent for pure network failures where no response was received.
  it("httpStatus is undefined when not provided", () => {
    expect(new ExternalApiException("forecast").httpStatus).toBeUndefined();
  });

  // Default message must name the api type so logs are useful without a custom message.
  it("uses a default message when none is provided", () => {
    const err = new ExternalApiException("forecast");
    expect(err.message).toContain("forecast");
    expect(err.message.length).toBeGreaterThan(0);
  });

  it("uses a custom message when provided", () => {
    const err = new ExternalApiException("marine", 404, "Custom marine error");
    expect(err.message).toBe("Custom marine error");
  });

  // Must extend AppError so formatError instanceof checks work correctly.
  it("is an instance of AppError and Error", () => {
    const err = new ExternalApiException("forecast");
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it("name is ExternalApiException", () => {
    expect(new ExternalApiException("forecast").name).toBe("ExternalApiException");
  });
});

// ActivityScoringException is thrown when a scorer produces bad output (e.g. NaN).
// isOperational: false — this is an internal bug, not a user-facing failure.
// Apollo formatError will hide the message and return a generic "Internal server error".
describe("ActivityScoringException", () => {
  it("is NOT operational", () => {
    expect(new ActivityScoringException("SKIING").isOperational).toBe(false);
  });

  it("has code ACTIVITY_SCORING_ERROR", () => {
    expect(new ActivityScoringException("SKIING").code).toBe("ACTIVITY_SCORING_ERROR");
  });

  // activity name is stored so the ranking service can include it in the server-side log.
  it("stores activity name", () => {
    expect(new ActivityScoringException("SURFING").activity).toBe("SURFING");
  });

  // Default message must name the activity so logs point to the right scorer.
  it("uses a default message when none is provided", () => {
    const err = new ActivityScoringException("SKIING");
    expect(err.message).toContain("SKIING");
    expect(err.message.length).toBeGreaterThan(0);
  });

  it("uses a custom message when provided", () => {
    const err = new ActivityScoringException("SKIING", "NaN on 2026-05-23");
    expect(err.message).toBe("NaN on 2026-05-23");
  });

  it("is an instance of AppError and Error", () => {
    const err = new ActivityScoringException("SKIING");
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it("name is ActivityScoringException", () => {
    expect(new ActivityScoringException("SKIING").name).toBe("ActivityScoringException");
  });
});
