'use client';

import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 42.431,
  lng: -8.644,
};

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

interface CarsMapProps {
  cars: any[];
  selectedCarId: string | null;
}

export default function CarsMap({ cars, selectedCarId }: CarsMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [routesMap, setRoutesMap] = useState<Record<string, google.maps.DirectionsResult>>({});

  // Clean up routes for deleted cars
  useEffect(() => {
    setRoutesMap(prev => {
      const newRoutesMap = { ...prev };
      let changed = false;
      const carIds = cars.map(c => c.id);
      Object.keys(newRoutesMap).forEach(id => {
        if (!carIds.includes(id)) {
          delete newRoutesMap[id];
          changed = true;
        }
      });
      return changed ? newRoutesMap : prev;
    });
  }, [cars]);

  // Use an effect to track which cars we already requested directions for, so we don't spam the DirectionsService
  const [requestedRoutes, setRequestedRoutes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newRequests = new Set(requestedRoutes);
    cars.forEach(car => {
      if (car.origin && !requestedRoutes.has(car.id)) {
        newRequests.add(car.id);
      }
    });
    if (newRequests.size !== requestedRoutes.size) {
      setRequestedRoutes(newRequests);
    }
  }, [cars, requestedRoutes]);

  const directionsCallback = (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus, carId: string) => {
    if (status === 'OK' && result) {
      setRoutesMap(prev => ({
        ...prev,
        [carId]: result
      }));
    }
  };

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-500 relative overflow-hidden">
        <MapPin size={32} className="mb-2 text-zinc-400 z-10" />
        <p className="z-10 font-medium">Mapa Placeholder</p>
        <p className="text-xs z-10 mt-1 max-w-[200px] text-center">Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en tu .env para ver el mapa real.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={9}
        options={{
          styles: nightModeStyles,
          disableDefaultUI: true,
          zoomControl: true,
        }}
        onLoad={(mapInstance) => setMap(mapInstance)}
      >
        {/* Directions Services requests */}
        {cars.map(car => (
          car.origin && !routesMap[car.id] ? (
            <DirectionsService
              key={`ds-${car.id}`}
              options={{
                destination: 'Pontevedra, Spain',
                origin: car.origin + ', Spain', // appending Spain for better accuracy
                travelMode: google.maps.TravelMode.DRIVING,
              }}
              callback={(res, status) => directionsCallback(res, status, car.id)}
            />
          ) : null
        ))}

        {/* Directions Renderers */}
        {cars.map(car => {
          const route = routesMap[car.id];
          if (!route) return null;

          const isSelected = selectedCarId === car.id;
          const hasSelection = selectedCarId !== null;

          let strokeOpacity = 0.4;
          let strokeWeight = 4;
          let strokeColor = '#3b82f6'; // blue-500
          let zIndex = 1;

          if (isSelected) {
            strokeOpacity = 1.0;
            strokeWeight = 6;
            strokeColor = '#818cf8'; // indigo-400
            zIndex = 10;
          } else if (hasSelection) {
            strokeOpacity = 0.1;
            strokeWeight = 3;
            zIndex = 0;
          }

          return (
            <DirectionsRenderer
              key={`dr-${car.id}`}
              directions={route}
              options={{
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor,
                  strokeWeight,
                  strokeOpacity,
                  zIndex
                }
              }}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
}
