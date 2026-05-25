export const typeDefs = `#graphql
  type Query {
    activityRankings(input: ActivityRankingInput!): ActivityRankingResult!
  }

  input ActivityRankingInput {
    location: ResolvedLocationInput!
  }

  input ResolvedLocationInput {
    name: String!
    country: String
    latitude: Float!
    longitude: Float!
    timezone: String
  }

  type ActivityRankingResult {
    location: ResolvedLocation!
    generatedAt: String!
    activities: [ActivityRanking!]!
  }

  type ResolvedLocation {
    name: String!
    country: String
    latitude: Float!
    longitude: Float!
    timezone: String
  }

  type ActivityRanking {
    activity: Activity!
    score: Float!
    label: ScoreLabel!
    summary: String!
    days: [DailyActivityScore!]!
  }

  type DailyActivityScore {
    date: String!
    score: Float!
    label: ScoreLabel!
    reasons: [String!]!
  }

  enum Activity {
    SKIING
    SURFING
    OUTDOOR_SIGHTSEEING
    INDOOR_SIGHTSEEING
  }

  enum ScoreLabel {
    EXCELLENT
    GOOD
    FAIR
    POOR
  }
`;
