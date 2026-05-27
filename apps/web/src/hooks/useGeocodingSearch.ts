import { useEffect, useRef, useState } from "react";

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  timezone: string;
  admin1?: string;
}

interface GeocodingApiResponse {
  results?: GeocodingResult[];
}

export function useGeocodingSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Geocoding request failed");
        const data: GeocodingApiResponse = await res.json();
        setResults(data.results ?? []);
      } catch {
        setError("Could not search locations. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function clearResults() {
    setResults([]);
    setQuery("");
  }

  return { query, setQuery, results, loading, error, clearResults };
}
