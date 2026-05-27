import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpOpenMeteoClient } from "../../../src/modules/weather/open-meteo.client";
import { ExternalApiException } from "../../../src/shared/errors";
import { capeTownLocation } from "../../fixtures/locations.fixture";
import { mixedForecastResponse } from "../../fixtures/open-meteo-forecast.fixture";
import { goodSurfMarineResponse } from "../../fixtures/open-meteo-marine.fixture";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: typeof body === "string"
      ? () => Promise.reject(new SyntaxError("invalid json"))
      : () => Promise.resolve(body),
  };
}

describe("HttpOpenMeteoClient.getForecast", () => {
  const client = new HttpOpenMeteoClient();

  it("returns parsed forecast data on success", async () => {
    mockFetch.mockResolvedValue(makeResponse(mixedForecastResponse));
    const result = await client.getForecast(capeTownLocation);
    expect(result.latitude).toBe(mixedForecastResponse.latitude);
    expect(result.daily.time).toHaveLength(7);
  });

  it("throws ExternalApiException on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    await expect(client.getForecast(capeTownLocation)).rejects.toBeInstanceOf(ExternalApiException);
  });

  it("ExternalApiException has apiType forecast on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    await expect(client.getForecast(capeTownLocation)).rejects.toMatchObject({ apiType: "forecast" });
  });

  it("throws ExternalApiException with httpStatus on non-OK response", async () => {
    mockFetch.mockResolvedValue(makeResponse({}, 503));
    await expect(client.getForecast(capeTownLocation)).rejects.toMatchObject({
      apiType: "forecast",
      httpStatus: 503,
    });
  });

  it("throws ExternalApiException when response body is not valid JSON", async () => {
    mockFetch.mockResolvedValue(makeResponse("not-json"));
    await expect(client.getForecast(capeTownLocation)).rejects.toBeInstanceOf(ExternalApiException);
  });

  it("ExternalApiException is operational", async () => {
    mockFetch.mockRejectedValue(new Error("timeout"));
    await expect(client.getForecast(capeTownLocation)).rejects.toMatchObject({ isOperational: true });
  });
});

describe("HttpOpenMeteoClient.getMarineForecast", () => {
  const client = new HttpOpenMeteoClient();

  it("returns parsed marine data on success", async () => {
    mockFetch.mockResolvedValue(makeResponse(goodSurfMarineResponse));
    const result = await client.getMarineForecast(capeTownLocation);
    expect(result).toBeDefined();
    expect(result!.daily.time).toHaveLength(7);
  });

  it("returns undefined on network failure (does not throw)", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    await expect(client.getMarineForecast(capeTownLocation)).resolves.toBeUndefined();
  });

  it("returns undefined on non-OK response (does not throw)", async () => {
    mockFetch.mockResolvedValue(makeResponse({}, 404));
    await expect(client.getMarineForecast(capeTownLocation)).resolves.toBeUndefined();
  });

  it("returns undefined when response body is not valid JSON (does not throw)", async () => {
    mockFetch.mockResolvedValue(makeResponse("not-json"));
    await expect(client.getMarineForecast(capeTownLocation)).resolves.toBeUndefined();
  });

  it("returns undefined on 500 response (does not throw)", async () => {
    mockFetch.mockResolvedValue(makeResponse({}, 500));
    await expect(client.getMarineForecast(capeTownLocation)).resolves.toBeUndefined();
  });
});
