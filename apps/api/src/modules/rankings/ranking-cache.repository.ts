import pg from "pg";
import { ActivityRankingResult } from "../activities/activity.types";
import { ResolvedLocation } from "../location/location.types";

const CACHE_TTL_HOURS = 6;

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

export class RankingCacheRepository {
  constructor(private readonly pool: pg.Pool) {}

  async get(location: ResolvedLocation): Promise<ActivityRankingResult | null> {
    const latKey = roundCoord(location.latitude);
    const lonKey = roundCoord(location.longitude);

    const { rows } = await this.pool.query<{ result: ActivityRankingResult }>(
      `SELECT result FROM ranking_cache
       WHERE lat_key = $1 AND lon_key = $2 AND expires_at > NOW()`,
      [latKey, lonKey]
    );

    return rows[0]?.result ?? null;
  }

  async set(result: ActivityRankingResult): Promise<void> {
    const { location } = result;
    const latKey = roundCoord(location.latitude);
    const lonKey = roundCoord(location.longitude);

    await this.pool.query(
      `INSERT INTO ranking_cache
         (lat_key, lon_key, location_name, location_country, location_timezone, result, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${CACHE_TTL_HOURS} hours')
       ON CONFLICT (lat_key, lon_key) DO UPDATE SET
         location_name     = EXCLUDED.location_name,
         location_country  = EXCLUDED.location_country,
         location_timezone = EXCLUDED.location_timezone,
         result            = EXCLUDED.result,
         generated_at      = NOW(),
         expires_at        = NOW() + INTERVAL '${CACHE_TTL_HOURS} hours'`,
      [
        latKey,
        lonKey,
        location.name,
        location.country ?? null,
        location.timezone ?? null,
        JSON.stringify(result),
      ]
    );
  }
}
