import { WeatherService } from "../modules/weather/weather.service";
import { ActivityRankingService } from "../modules/activities/activity-ranking.service";

export interface AppContext {
  weatherService: WeatherService;
  activityRankingService: ActivityRankingService;
}

export const resolvers = {
  Query: {
    activityRankings: async (
      _parent: unknown,
      args: { input: { location: { name: string; country?: string; latitude: number; longitude: number; timezone?: string } } },
      context: AppContext
    ) => {
      const { location } = args.input;
      const weather = await context.weatherService.getSevenDayWeather(location);
      return context.activityRankingService.rank({
        location,
        dailyWeather: weather.daily,
        marineWeather: weather.marineDaily,
      });
    },
  },
};
