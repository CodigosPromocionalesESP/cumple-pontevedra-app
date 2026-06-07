'use client';

import { useState, useEffect } from 'react';
import CarsMap from '@/components/CarsMap';
import { useStore } from '@/store/useStore';
import { Users, Clock, MapPin, Plus, X, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CarsPage() {
  const { nickname } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  
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

  const joinCar = async (car: any, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent selecting car
    if (!nickname || car.passengers.includes(nickname) || car.available_seats <= 0) return;
    
    await supabase.from('cars').update({
      passengers: [...car.passengers, nickname],
      available_seats: car.available_seats - 1
    }).eq('id', car.id);
  };

  // Helper to render the car cards
  const renderCarList = () => {
    if (cars.length === 0) {
      return <p className="text-zinc-500 text-center py-8">Todavía no hay coches registrados.</p>;
    }

    return cars.map((car) => {
      const isSelected = selectedCarId === car.id;
      return (
        <div 
          key={car.id} 
          onClick={() => setSelectedCarId(isSelected ? null : car.id)}
          className={`bg-zinc-950/50 border rounded-2xl p-4 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : 'border-zinc-800 hover:border-zinc-700'}`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                {car.driver.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm">Coche de {car.driver}</h3>
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} /> {car.origin}
                </p>
              </div>
            </div>
            <div className={`border px-2 py-1 rounded-full flex items-center gap-1.5 ${car.available_seats > 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <Users size={12} />
              <span className="text-[11px] font-medium">{car.available_seats} libres</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-zinc-400 mb-3 border-t border-zinc-800/50 pt-3">
            <div className="flex items-center gap-1.5">
              <Clock size={12} /> Ida: {car.departure_time?.slice(0,5)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} /> Vuelta: {car.return_time?.slice(0,5)}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {car.passengers?.map((p: string, i: number) => (
                <img 
                  key={i} 
                  src={`https://api.dicebear.com/9.x/notionists/svg?seed=${p}`} 
                  alt={p} 
                  title={p}
                  className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-950" 
                />
              ))}
            </div>
            {car.available_seats > 0 && !car.passengers?.includes(nickname) && (
              <button 
                onClick={(e) => joinCar(car, e)} 
                className="bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
              >
                Unirme
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    // Extends to edge of viewport (negating parent padding for a full immersion feel)
    <div className="absolute inset-0 pt-20 flex flex-col md:flex-row overflow-hidden bg-zinc-950">
      
      {/* MAP AREA */}
      <div className="flex-1 relative z-0">
        <CarsMap cars={cars} selectedCarId={selectedCarId} />

        {/* Mobile FAB */}
        <button 
          onClick={() => setShowMobileList(true)}
          className="md:hidden absolute bottom-24 right-4 z-40 bg-gradient-to-r from-indigo-600 to-pink-500 text-white p-4 rounded-full shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
        >
          <ChevronUp size={24} />
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-[350px] bg-zinc-900 border-l border-zinc-800 z-10">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/95 sticky top-0 backdrop-blur-sm z-20">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Coches y Ruta</h2>
            <p className="text-xs text-zinc-400">Organiza el viaje</p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-xl transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {renderCarList()}
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET */}
      <div 
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 bg-zinc-900 rounded-t-3xl border-t border-zinc-800 shadow-2xl transition-transform duration-300 ease-in-out ${showMobileList ? 'translate-y-0' : 'translate-y-[120%]'}`}
        style={{ maxHeight: '80vh' }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Coches y Ruta</h2>
              <p className="text-xs text-zinc-400">Selecciona para ver la ruta en el mapa</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(true)} className="p-2 bg-zinc-800 rounded-full text-zinc-100">
                <Plus size={20} />
              </button>
              <button onClick={() => setShowMobileList(false)} className="p-2 bg-zinc-800/50 rounded-full text-zinc-400">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
            {renderCarList()}
          </div>
        </div>
      </div>

      {/* ADD CAR MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-100">Añadir coche</h3>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={24} />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleAddCar}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Conductor</label>
                  <input type="text" value={nickname || ''} disabled className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Plazas Totales</label>
                  <input type="number" min="1" max="8" value={totalSeats} onChange={(e) => setTotalSeats(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Origen</label>
                <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Ej: Madrid" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Hora Salida</label>
                  <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Hora Vuelta</label>
                  <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95">Guardar Coche</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
