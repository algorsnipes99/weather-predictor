import { useLazyQuery } from "@apollo/client";
import { ACTIVITY_RANKINGS_QUERY } from "../graphql/queries";
import type {
  ActivityRankingsQueryData,
  ActivityRankingInput,
  ResolvedLocationInput,
} from "../graphql/types";

export function useActivityRankings() {
  const [execute, { loading, error, data }] = useLazyQuery<
    ActivityRankingsQueryData,
    { input: ActivityRankingInput }
  >(ACTIVITY_RANKINGS_QUERY);

  function fetchRankings(location: ResolvedLocationInput) {
    execute({ variables: { input: { location } } });
  }

  return {
    fetchRankings,
    loading,
    error,
    result: data?.activityRankings ?? null,
  };
}
