'use client';

import { useState, useEffect } from 'react';
import CarsMap from '@/components/CarsMap';
import { useStore } from '@/store/useStore';
import { Users, Clock, MapPin, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CarsPage() {
  const { nickname } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  
  // Form state
  const [totalSeats, setTotalSeats] = useState(4);
  const [origin, setOrigin] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState('');

  const fetchCars = async () => {
    const { data } = await supabase.from('cars').select('*').order('created_at', { ascending: true });
    if (data) setCars(data);
  };

  useEffect(() => {
    fetchCars();

    const channel = supabase.channel('cars_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, () => {
        fetchCars();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !origin || !departureTime || !returnTime) return;
    
    await supabase.from('cars').insert({
      driver: nickname,
      total_seats: totalSeats,
      available_seats: totalSeats - 1,
      origin,
      destination: 'Pontevedra',
      departure_time: departureTime,
      return_time: returnTime,
      passengers: [nickname],
    });
    
    setShowForm(false);
    setOrigin('');
    setDepartureTime('');
    setReturnTime('');
  };

  const joinCar = async (car: any) => {
    if (!nickname || car.passengers.includes(nickname) || car.available_seats <= 0) return;
    
    await supabase.from('cars').update({
      passengers: [...car.passengers, nickname],
      available_seats: car.available_seats - 1
    }).eq('id', car.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Coches y Ruta</h1>
        <p className="text-zinc-400">Organiza cómo llegamos a Pontevedra.</p>
      </div>

      <CarsMap cars={cars} />

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
          <form className="space-y-4" onSubmit={handleAddCar}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Conductor</label>
                <input type="text" value={nickname || ''} disabled className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Plazas Totales</label>
                <input type="number" min="1" max="8" value={totalSeats} onChange={(e) => setTotalSeats(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Origen</label>
                <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Ej: Madrid" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Hora Salida</label>
                <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Hora Vuelta</label>
              <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Guardar Coche</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {cars.length === 0 && (
          <p className="text-zinc-500 col-span-2 text-center py-8">Todavía no hay coches registrados.</p>
        )}
        {cars.map((car) => (
          <div key={car.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                  {car.driver.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100">Coche de {car.driver}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <MapPin size={12} /> {car.origin}
                  </p>
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Users size={14} className={car.available_seats > 0 ? "text-green-400" : "text-red-400"} />
                <span className="text-sm font-medium text-zinc-300">{car.available_seats} libres</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4 border-t border-zinc-800/50 pt-4">
              <div className="flex items-center gap-1.5">
                <Clock size={14} /> Ida: {car.departure_time?.slice(0,5)}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} /> Vuelta: {car.return_time?.slice(0,5)}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Pasajeros</p>
              <div className="flex flex-wrap gap-2">
                {car.passengers?.map((p: string, i: number) => (
                  <span key={i} className="bg-zinc-800 px-2.5 py-1 rounded-md text-xs text-zinc-300">{p}</span>
                ))}
                {car.available_seats > 0 && !car.passengers?.includes(nickname) && (
                  <button onClick={() => joinCar(car)} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-2.5 py-1 rounded-md text-xs font-medium transition-all">
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
