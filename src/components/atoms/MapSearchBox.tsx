"use client";

import { useEffect, useRef, useState } from "react";
import { MapControl, ControlPosition, useMapsLibrary } from "@vis.gl/react-google-maps";

interface MapSearchBoxProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  onRawInput?: (text: string) => void;
}

export default function MapSearchBox({ onPlaceSelect, onRawInput }: MapSearchBoxProps) {
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  // Init Autocomplete once places library loads
  useEffect(() => {
    if (!places || !inputRef.current) return;
    const ac = new places.Autocomplete(inputRef.current, {
      fields: ["geometry", "name", "formatted_address"],
    });
    setAutocomplete(ac);
  }, [places]);

  // Wire place_changed event
  useEffect(() => {
    if (!autocomplete) return;
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        onPlaceSelect(place);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [autocomplete, onPlaceSelect]);

  const handleManualAdd = () => {
    if (!inputRef.current) return;
    const val = inputRef.current.value.trim();
    if (!val) return;

    // If it looks like raw lat,lng, push directly
    if (val.includes(",") && !isNaN(parseFloat(val.split(",")[0]))) {
      if (onRawInput) onRawInput(val);
      inputRef.current.value = "";
      return;
    }

    if (!places) return;

    // Fetch the very first prediction and lock on
    const service = new places.AutocompleteService();
    service.getPlacePredictions({ input: val }, (predictions, status) => {
      if (status === "OK" && predictions && predictions[0]) {
        const placeId = predictions[0].place_id;
        const detailsService = new places.PlacesService(document.createElement("div"));
        detailsService.getDetails({ placeId, fields: ["geometry"] }, (place, detailStatus) => {
          if (detailStatus === "OK" && place?.geometry?.location) {
            onPlaceSelect(place as google.maps.places.PlaceResult);
            if (inputRef.current) inputRef.current.value = "";
          }
        });
      } else {
        if (onRawInput) onRawInput(val);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  return (
    <MapControl position={ControlPosition.TOP_CENTER}>
      <div className="mt-3 flex items-center gap-2 bg-white rounded-xl shadow-lg ring-1 ring-black/10 px-3 py-2 w-[80vw] max-w-2xl">
        {/* Search icon */}
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search place to add as stop, or paste lat,lng…"
          className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          onKeyDown={(e) => { if (e.key === "Enter") handleManualAdd(); }}
        />
        <button
          onClick={handleManualAdd}
          className="text-xs text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all px-3 py-1.5 rounded-lg flex-shrink-0 cursor-pointer"
        >
          + Add Stop
        </button>
      </div>
    </MapControl>
  );
}
