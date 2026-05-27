import { WeatherService } from "../modules/weather/weather.service";
import { ActivityRankingService } from "../modules/activities/activity-ranking.service";
import { RankingCacheRepository } from "../modules/rankings/ranking-cache.repository";
import { TokenPayload } from "../auth/jwt";
import { ResolvedLocation } from "../modules/location/location.types";
import { ActivityRankingResult } from "../modules/activities/activity.types";

export interface AppContext {
  weatherService: WeatherService;
  activityRankingService: ActivityRankingService;
  rankingCache: RankingCacheRepository | null;
  user: TokenPayload;
}

interface ActivityRankingInput {
  location: ResolvedLocation;
}

interface ActivityRankingsArgs {
  input: ActivityRankingInput;
}

export const resolvers = {
  Query: {
    activityRankings: async (
      _parent: unknown,
      args: ActivityRankingsArgs,
      context: AppContext
    ): Promise<ActivityRankingResult> => {
      const { location } = args.input;

      // Return early if a cached result exists for this location — skips weather fetch and scoring.
      // Cache key is lat/lon rounded to 2 decimal places (not location name), so two slightly
      // different coordinates for the same city can share a cache entry. Entries expire after
      // 6 hours — this prevents users from receiving stale forecasts on repeat visits or the
      // following day. Expiry is enforced by the database (expires_at > NOW()), not a background job.
      if (context.rankingCache) {
        const cached = await context.rankingCache.get(location);
        if (cached) return cached;
      }

      // Fetch 7-day forecast + marine data, then run all 4 activity scorers and sort by score.
      const weather = await context.weatherService.getSevenDayWeather(location);
      const result = context.activityRankingService.rank({
        location,
        dailyWeather: weather.daily,
        marineWeather: weather.marineDaily,
      });

      // Fire-and-forget cache write — a write failure must never break the response.
      if (context.rankingCache) {
        context.rankingCache.set(result).catch(() => {});
      }

      return result;
    },
  },
};
