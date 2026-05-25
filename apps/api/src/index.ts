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

const client = new HttpOpenMeteoClient();
const weatherService = new WeatherService(client);
const activityRankingService = new ActivityRankingService([
  new SkiingScorer(),
  new SurfingScorer(),
  new OutdoorSightseeingScorer(),
  new IndoorSightseeingScorer(),
]);

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

// Public routes — no auth required
app.use("/auth", authRouter);

const server = new ApolloServer<AppContext>({ typeDefs, resolvers });
await server.start();

// All GraphQL requests must carry a valid JWT
app.use(
  "/graphql",
  requireAuth,
  expressMiddleware(server, {
    context: async ({ req }) => ({
      weatherService,
      activityRankingService,
      rankingCache,
      user: req.user!,
    }),
  })
);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`Auth endpoint:    http://localhost:${PORT}/auth/token`);
});
