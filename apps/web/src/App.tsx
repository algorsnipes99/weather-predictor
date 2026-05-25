import { useLoadScript } from "@react-google-maps/api";
import { SearchBar } from "./components/SearchBar";
import { ResultsSection } from "./components/ResultsSection";
import { useActivityRankings } from "./hooks/useActivityRankings";
import type { ResolvedLocationInput } from "./graphql/types";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

export function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

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

        {loadError && (
          <p className="mb-4 text-sm text-red-500">
            Failed to load Google Maps: {loadError.message}
          </p>
        )}

        {isLoaded && (
          <SearchBar onLocationResolved={handleLocationResolved} loading={loading} />
        )}

        {!isLoaded && !loadError && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
            Loading maps…
          </div>
        )}

        <ResultsSection result={result} loading={loading} error={error} />
      </div>
    </div>
  );
}
