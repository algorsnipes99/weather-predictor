import type { ApolloError } from "@apollo/client";
import type { ActivityRankingResult } from "../graphql/types";
import { ActivityCard } from "./ActivityCard";

interface Props {
  result: ActivityRankingResult | null;
  loading: boolean;
  error: ApolloError | undefined;
}

export function ResultsSection({ result, loading, error }: Props) {
  if (loading) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3 text-gray-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-300 border-t-transparent" />
        <p className="text-sm">Fetching weather forecasts…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
        <p className="font-semibold">Something went wrong</p>
        <p className="mt-1 text-red-500">{error.message}</p>
      </div>
    );
  }

  if (!result) return null;

  const generatedDate = new Date(result.generatedAt).toLocaleString();

  return (
    <section className="mt-8 w-full max-w-2xl">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          {result.location.name}
          {result.location.country ? `, ${result.location.country}` : ""}
        </h2>
        <p className="mt-0.5 text-xs text-gray-400">
          Rankings generated at {generatedDate} · 7-day forecast
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {result.activities.map((ranking, index) => (
          <ActivityCard key={ranking.activity} ranking={ranking} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
