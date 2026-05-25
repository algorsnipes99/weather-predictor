import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "./graphql/schema";
import { resolvers, AppContext } from "./graphql/resolvers";
import { WeatherService } from "./modules/weather/weather.service";
import { HttpOpenMeteoClient } from "./modules/weather/open-meteo.client";
import { ActivityRankingService } from "./modules/activities/activity-ranking.service";
import { SkiingScorer } from "./modules/activities/scoring/skiing.scorer";
import { SurfingScorer } from "./modules/activities/scoring/surfing.scorer";
import { OutdoorSightseeingScorer } from "./modules/activities/scoring/outdoor-sightseeing.scorer";
import { IndoorSightseeingScorer } from "./modules/activities/scoring/indoor-sightseeing.scorer";

const client = new HttpOpenMeteoClient();
const weatherService = new WeatherService(client);
const activityRankingService = new ActivityRankingService([
  new SkiingScorer(),
  new SurfingScorer(),
  new OutdoorSightseeingScorer(),
  new IndoorSightseeingScorer(),
]);

const server = new ApolloServer<AppContext>({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async () => ({ weatherService, activityRankingService }),
});

console.log(`Server running at ${url}`);
