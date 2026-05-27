import { describe, it, expect } from "vitest";
import { AppError, ExternalApiException, ActivityScoringException } from "../../src/shared/errors";

describe("AppError", () => {
  it("sets message, code, and isOperational", () => {
    const err = new AppError("something broke", "SOME_CODE", true);
    expect(err.message).toBe("something broke");
    expect(err.code).toBe("SOME_CODE");
    expect(err.isOperational).toBe(true);
  });

  it("defaults isOperational to true", () => {
    const err = new AppError("x", "X");
    expect(err.isOperational).toBe(true);
  });

  it("is an instance of Error", () => {
    expect(new AppError("x", "X")).toBeInstanceOf(Error);
  });

  it("name is set to the class name", () => {
    expect(new AppError("x", "X").name).toBe("AppError");
  });

  it("has a stack trace", () => {
    expect(new AppError("x", "X").stack).toBeDefined();
  });
});

describe("ExternalApiException", () => {
  it("is operational", () => {
    expect(new ExternalApiException("forecast").isOperational).toBe(true);
  });

  it("has code EXTERNAL_API_ERROR", () => {
    expect(new ExternalApiException("forecast").code).toBe("EXTERNAL_API_ERROR");
  });

  it("stores apiType", () => {
    expect(new ExternalApiException("forecast").apiType).toBe("forecast");
    expect(new ExternalApiException("marine").apiType).toBe("marine");
  });

  it("stores httpStatus when provided", () => {
    expect(new ExternalApiException("forecast", 503).httpStatus).toBe(503);
  });

  it("httpStatus is undefined when not provided", () => {
    expect(new ExternalApiException("forecast").httpStatus).toBeUndefined();
  });

  it("uses a default message when none is provided", () => {
    const err = new ExternalApiException("forecast");
    expect(err.message).toContain("forecast");
    expect(err.message.length).toBeGreaterThan(0);
  });

  it("uses a custom message when provided", () => {
    const err = new ExternalApiException("marine", 404, "Custom marine error");
    expect(err.message).toBe("Custom marine error");
  });

  it("is an instance of AppError and Error", () => {
    const err = new ExternalApiException("forecast");
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it("name is ExternalApiException", () => {
    expect(new ExternalApiException("forecast").name).toBe("ExternalApiException");
  });
});

describe("ActivityScoringException", () => {
  it("is NOT operational", () => {
    expect(new ActivityScoringException("SKIING").isOperational).toBe(false);
  });

  it("has code ACTIVITY_SCORING_ERROR", () => {
    expect(new ActivityScoringException("SKIING").code).toBe("ACTIVITY_SCORING_ERROR");
  });

  it("stores activity name", () => {
    expect(new ActivityScoringException("SURFING").activity).toBe("SURFING");
  });

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
