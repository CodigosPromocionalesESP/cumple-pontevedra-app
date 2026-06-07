'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

export default function CarsMap({ cars }: { cars: any[] }) {
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '');

  if (!apiKey) {
    return (
      <div className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Pontevedra,Spain&zoom=10&size=600x300&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0xffffff&style=feature:all|element:labels.text.stroke|color:0x000000&style=feature:all|element:labels.icon|visibility:off&style=feature:administrative|element:geometry.fill|color:0x000000&style=feature:administrative|element:geometry.stroke|color:0x144b53&style=feature:landscape|element:color:0x08304b&style=feature:poi|element:geometry|color:0x0c4152&style=feature:poi.park|element:geometry|color:0x023e58&style=feature:road.highway|element:geometry.fill|color:0x000000&style=feature:road.highway|element:geometry.stroke|color:0x0b434f&style=feature:road.arterial|element:geometry.fill|color:0x000000&style=feature:road.arterial|element:geometry.stroke|color:0x0b3d51&style=feature:road.local|element:geometry|color:0x000000&style=feature:transit|element:geometry|color:0x146474&style=feature:water|element:color:0x021019')] bg-cover bg-center opacity-30 grayscale mix-blend-screen" />
        <MapPin size={32} className="mb-2 text-zinc-400 z-10" />
        <p className="z-10 font-medium">Mapa Placeholder</p>
        <p className="text-xs z-10 mt-1 max-w-[200px] text-center">Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en tu .env para ver el mapa real.</p>
      </div>
    );
  }

  // Si hubiera API Key, usaríamos @react-google-maps/api con el estilo nocturno
  return (
    <div className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
      <p>Mapa de Google cargado (Night Mode)</p>
    </div>
  );
}
