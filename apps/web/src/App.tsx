import { SearchBar } from "./components/SearchBar";
import { ResultsSection } from "./components/ResultsSection";
import { useActivityRankings } from "./hooks/useActivityRankings";
import type { ResolvedLocationInput } from "./graphql/types";

export function App() {
  const { fetchRankings, loading, error, result } = useActivityRankings();

  function handleLocationResolved(location: ResolvedLocationInput) {
    fetchRankings(location);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Weather Activity Ranker
          </h1>
          <p className="mt-3 text-gray-500">
            Search a city to see how suitable the next 7 days are for skiing,
            surfing, and sightseeing.
          </p>
        </header>

        <SearchBar onLocationResolved={handleLocationResolved} loading={loading} />

        <ResultsSection result={result} loading={loading} error={error} />
      </div>
    </div>
  );
}
