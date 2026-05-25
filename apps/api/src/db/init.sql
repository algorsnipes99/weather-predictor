CREATE TABLE IF NOT EXISTS ranking_cache (
  id          SERIAL PRIMARY KEY,
  lat_key     NUMERIC(8, 2) NOT NULL,
  lon_key     NUMERIC(8, 2) NOT NULL,
  location_name     VARCHAR(255) NOT NULL,
  location_country  VARCHAR(255),
  location_timezone VARCHAR(100),
  result      JSONB        NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  UNIQUE (lat_key, lon_key)
);
