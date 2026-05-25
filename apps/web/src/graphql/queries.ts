import { gql } from "@apollo/client";

export const ACTIVITY_RANKINGS_QUERY = gql`
  query ActivityRankings($input: ActivityRankingInput!) {
    activityRankings(input: $input) {
      location {
        name
        country
        latitude
        longitude
      }
      generatedAt
      activities {
        activity
        score
        label
        summary
        days {
          date
          score
          label
          reasons
        }
      }
    }
  }
`;
