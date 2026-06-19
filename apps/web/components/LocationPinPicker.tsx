"use client";

import { useEffect, useRef } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import { useTheme } from "@/components/ThemeProvider";
import { getMapStyle } from "@/lib/map-tiles";

type Props = {
  lat: number;
  lng: number;
  onPinMove: (lat: number, lng: number) => void;
};

export default function LocationPinPicker({ lat, lng, onPinMove }: Props) {
  const { theme } = useTheme();
  const mapRef = useRef<MapRef>(null);

  const mapStyle = getMapStyle(theme);

  // Recenter/fly-to on external coordinate changes
  useEffect(() => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 1500,
    });
  }, [lat, lng]);

  return (
    <div className="h-40 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: lng,
          latitude: lat,
          zoom: 15,
        }}
        style={{ height: "100%", width: "100%" }}
        mapStyle={mapStyle}
        scrollZoom={true}
      >
        <Marker
          longitude={lng}
          latitude={lat}
          draggable
          onDragEnd={(event) => {
            onPinMove(event.lngLat.lat, event.lngLat.lng);
          }}
        />
      </Map>
    </div>
  );
}
