'use client';

import { useState } from 'react';
import CarsMap from '@/components/CarsMap';
import { useStore } from '@/store/useStore';
import { Users, Clock, MapPin, Plus } from 'lucide-react';

export default function CarsPage() {
  const { nickname } = useStore();
  const [showForm, setShowForm] = useState(false);
  
  // Mock data to demonstrate the UI
  const mockCars = [
    {
      id: 1,
      driver: 'Pedro',
      totalSeats: 5,
      availableSeats: 2,
      origin: 'Madrid',
      departureTime: '15:30',
      returnTime: '18:00',
      passengers: ['María', 'Juan']
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Coches y Ruta</h1>
        <p className="text-zinc-400">Organiza cómo llegamos a Pontevedra.</p>
      </div>

      <CarsMap cars={mockCars} />

      <div className="flex justify-between items-center mt-8 mb-4">
        <h2 className="text-xl font-semibold text-zinc-100">Lista de Coches</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all text-sm font-medium"
        >
          <Plus size={16} />
          Añadir Coche
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6 animate-in slide-in-from-top-4 fade-in duration-300">
          <h3 className="text-lg font-medium text-zinc-200 mb-4">Nuevo Coche</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Conductor</label>
                <input type="text" value={nickname || ''} disabled className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Plazas Libres</label>
                <input type="number" min="1" max="8" defaultValue="4" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Origen</label>
                <input type="text" placeholder="Ej: Madrid" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Hora Salida</label>
                <input type="time" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium">Cancelar</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Guardar Coche</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {mockCars.map((car) => (
          <div key={car.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                  {car.driver.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100">Coche de {car.driver}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <MapPin size={12} /> {car.origin}
                  </p>
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Users size={14} className={car.availableSeats > 0 ? "text-green-400" : "text-red-400"} />
                <span className="text-sm font-medium text-zinc-300">{car.availableSeats} libres</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4 border-t border-zinc-800/50 pt-4">
              <div className="flex items-center gap-1.5">
                <Clock size={14} /> Ida: {car.departureTime}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} /> Vuelta: {car.returnTime}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Pasajeros</p>
              <div className="flex flex-wrap gap-2">
                {car.passengers.map((p, i) => (
                  <span key={i} className="bg-zinc-800 px-2.5 py-1 rounded-md text-xs text-zinc-300">{p}</span>
                ))}
                {car.availableSeats > 0 && (
                  <button className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-2.5 py-1 rounded-md text-xs font-medium transition-all">
                    + Unirme
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
