import express from "express";
import cors from "cors";
import { json } from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./graphql/schema.js";
import { resolvers, AppContext } from "./graphql/resolvers.js";
import { WeatherService } from "./modules/weather/weather.service.js";
import { HttpOpenMeteoClient } from "./modules/weather/open-meteo.client.js";
import { ActivityRankingService } from "./modules/activities/activity-ranking.service.js";
import { SkiingScorer } from "./modules/activities/scoring/skiing.scorer.js";
import { SurfingScorer } from "./modules/activities/scoring/surfing.scorer.js";
import { OutdoorSightseeingScorer } from "./modules/activities/scoring/outdoor-sightseeing.scorer.js";
import { IndoorSightseeingScorer } from "./modules/activities/scoring/indoor-sightseeing.scorer.js";
import { getDbPool } from "./db/db.client.js";
import { RankingCacheRepository } from "./modules/rankings/ranking-cache.repository.js";
import { authRouter } from "./auth/auth.router.js";
import { requireAuth } from "./auth/auth.middleware.js";
import { startMetricsServer } from "./metrics/metrics.server.js";
import { httpMetricsMiddleware } from "./metrics/http.middleware.js";
import { metricsPlugin } from "./metrics/apollo.plugin.js";
import { AppError } from "./shared/errors.js";

// Wire up the Open-Meteo HTTP client and weather service
const client = new HttpOpenMeteoClient();
const weatherService = new WeatherService(client);

// Register all activity scorers — add a new scorer here to include it in rankings
const activityRankingService = new ActivityRankingService([
  new SkiingScorer(),
  new SurfingScorer(),
  new OutdoorSightseeingScorer(),
  new IndoorSightseeingScorer(),
]);

// Connect to Postgres if DATABASE_URL is set; cache is optional and degrades gracefully
const dbPool = getDbPool();
const rankingCache = dbPool ? new RankingCacheRepository(dbPool) : null;

if (rankingCache) {
  console.log("Ranking cache: enabled (Postgres)");
} else {
  console.log("Ranking cache: disabled (no DATABASE_URL)");
}

const app = express();
app.use(cors());
app.use(json());
app.use(httpMetricsMiddleware);

// Public routes — no auth required
app.use("/auth", authRouter);

// Start Apollo before mounting it as Express middleware
const server = new ApolloServer<AppContext>({
  typeDefs,
  resolvers,
  plugins: [metricsPlugin],
  formatError: (_formattedError, err) => {
    const cause = (err as { originalError?: unknown }).originalError ?? err;
    if (cause instanceof AppError && cause.isOperational) {
      return { message: cause.message, extensions: { code: cause.code } };
    }
    console.error("[Apollo] Unexpected error:", cause);
    return { message: "Internal server error", extensions: { code: "INTERNAL_ERROR" } };
  },
});
await server.start();

// Built once per request and passed into every resolver via Apollo context.
// req.user is guaranteed non-null here because requireAuth runs first and
// returns 401 before Apollo is reached if the token is missing or invalid.
const buildContext = async ({ req }: { req: express.Request }): Promise<AppContext> => ({
  weatherService,
  activityRankingService,
  rankingCache,
  user: req.user!,
});

// All GraphQL requests must carry a valid JWT — requireAuth enforces this before Apollo runs
app.use(
  "/graphql",
  requireAuth,
  expressMiddleware(server, { context: buildContext })
);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`Auth endpoint:    http://localhost:${PORT}/auth/token`);
});

const METRICS_PORT = process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT) : 9090;
startMetricsServer(METRICS_PORT);
