import { useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";
import type { ResolvedLocationInput } from "../graphql/types";

interface Props {
  onLocationResolved: (location: ResolvedLocationInput) => void;
  loading: boolean;
}

function extractCountry(place: google.maps.places.PlaceResult): string | undefined {
  const component = place.address_components?.find((c) =>
    c.types.includes("country")
  );
  return component?.long_name;
}

export function SearchBar({ onLocationResolved, loading }: Props) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const name = place.name ?? place.formatted_address ?? "Unknown";
    const country = extractCountry(place);

    onLocationResolved({ name, country, latitude: lat, longitude: lng });
  }

  return (
    <div className="relative w-full max-w-xl">
      <Autocomplete
        onLoad={(ref) => {
          autocompleteRef.current = ref;
        }}
        onPlaceChanged={handlePlaceChanged}
        types={["(cities)"]}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for a city or town…"
          disabled={loading}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-60"
        />
      </Autocomplete>
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
