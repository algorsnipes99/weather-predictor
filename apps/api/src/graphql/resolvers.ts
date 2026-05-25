import { WeatherService } from "../modules/weather/weather.service";
import { ActivityRankingService } from "../modules/activities/activity-ranking.service";
import { RankingCacheRepository } from "../modules/rankings/ranking-cache.repository";

export interface AppContext {
  weatherService: WeatherService;
  activityRankingService: ActivityRankingService;
  rankingCache: RankingCacheRepository | null;
}

export const resolvers = {
  Query: {
    activityRankings: async (
      _parent: unknown,
      args: { input: { location: { name: string; country?: string; latitude: number; longitude: number; timezone?: string } } },
      context: AppContext
    ) => {
      const { location } = args.input;

      if (context.rankingCache) {
        const cached = await context.rankingCache.get(location);
        if (cached) return cached;
      }

      const weather = await context.weatherService.getSevenDayWeather(location);
      const result = context.activityRankingService.rank({
        location,
        dailyWeather: weather.daily,
        marineWeather: weather.marineDaily,
      });

      if (context.rankingCache) {
        context.rankingCache.set(result).catch(() => {});
      }

      return result;
    },
  },
};
