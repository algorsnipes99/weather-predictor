import { Registry, Counter, Histogram, collectDefaultMetrics } from "prom-client";

export const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

export const graphqlOperationDuration = new Histogram({
  name: "graphql_operation_duration_seconds",
  help: "Duration of GraphQL operations in seconds",
  labelNames: ["operation_name"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

export const graphqlErrorsTotal = new Counter({
  name: "graphql_errors_total",
  help: "Total number of GraphQL errors",
  labelNames: ["operation_name"],
  registers: [registry],
});

export const weatherFetchDuration = new Histogram({
  name: "weather_fetch_duration_seconds",
  help: "Duration of Open-Meteo fetch calls in seconds",
  labelNames: ["type"],
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

export const weatherFetchErrorsTotal = new Counter({
  name: "weather_fetch_errors_total",
  help: "Total number of Open-Meteo fetch errors",
  labelNames: ["type"],
  registers: [registry],
});

export const rankingCacheHitsTotal = new Counter({
  name: "ranking_cache_hits_total",
  help: "Total number of ranking cache hits",
  registers: [registry],
});

export const rankingCacheMissesTotal = new Counter({
  name: "ranking_cache_misses_total",
  help: "Total number of ranking cache misses",
  registers: [registry],
});

export const rankingCacheWriteDuration = new Histogram({
  name: "ranking_cache_write_duration_seconds",
  help: "Duration of ranking cache write operations in seconds",
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5],
  registers: [registry],
});
