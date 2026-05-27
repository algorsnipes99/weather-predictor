import { useRef, useEffect } from "react";
import { useGeocodingSearch } from "../hooks/useGeocodingSearch";
import type { GeocodingResult } from "../hooks/useGeocodingSearch";
import type { ResolvedLocationInput } from "../graphql/types";

interface Props {
  onLocationResolved: (location: ResolvedLocationInput) => void;
  loading: boolean;
}

export function SearchBar({ onLocationResolved, loading }: Props) {
  const { query, setQuery, results, loading: searching, error, clearResults } = useGeocodingSearch();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        clearResults();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearResults]);

  function handleSelect(result: GeocodingResult) {
    onLocationResolved({
      name: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    });
    clearResults();
  }

  const showDropdown = results.length > 0 || (query.length >= 2 && !searching && !error);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a city or town…"
          disabled={loading}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-60"
        />
        {(loading || searching) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {showDropdown && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(result)}
                className="flex w-full flex-col px-4 py-3 text-left hover:bg-sky-50 focus:bg-sky-50 focus:outline-none"
              >
                <span className="font-medium text-gray-900">{result.name}</span>
                <span className="text-sm text-gray-500">
                  {[result.admin1, result.country].filter(Boolean).join(", ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && results.length === 0 && query.length >= 2 && !searching && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm text-gray-500">
          No locations found for "{query}"
        </div>
      )}
    </div>
  );
}
