'use client';

import { useState, useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
};

// Pontevedra Coordinates
const center = {
  lat: 42.431,
  lng: -8.644,
};

// Night mode styling array
const nightModeStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

export default function CarsMap({ cars }: { cars: any[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const [map, setMap] = useState<any>(null);

  if (!apiKey) {
    return (
      <div className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 relative overflow-hidden">
        <MapPin size={32} className="mb-2 text-zinc-400 z-10" />
        <p className="z-10 font-medium">Mapa Placeholder</p>
        <p className="text-xs z-10 mt-1 max-w-[200px] text-center">Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en tu .env para ver el mapa real.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 border border-zinc-800 rounded-2xl overflow-hidden relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={6}
        options={{
          styles: nightModeStyles,
          disableDefaultUI: true,
          zoomControl: true,
        }}
        onLoad={setMap}
      >
        {/* Destination Marker */}
        <Marker 
          position={center} 
          label={{ text: 'Pontevedra', color: 'white', className: 'font-bold mt-8' }}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          }}
        />
        
        {/* We can't automatically geocode all cars origins dynamically without limits/costs easily on client side, 
            so we'll just show the map centered on Pontevedra. If we had lat/lng we would map over cars here.
            For now, the map itself with night mode is the premium aesthetic feature. */}
      </GoogleMap>
    </div>
  );
}
