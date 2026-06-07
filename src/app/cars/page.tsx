'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Users, Clock, Plus, X, Trash2 } from 'lucide-react';
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
  const [stops, setStops] = useState<string[]>([]);

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

  const handleAddStop = () => {
    setStops([...stops, '']);
  };

  const handleStopChange = (index: number, value: string) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };

  const handleRemoveStop = (index: number) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
  };

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !origin || !departureTime || !returnTime) return;
    
    // Filter out empty stops
    const validStops = stops.filter(s => s.trim() !== '');

    await supabase.from('cars').insert({
      driver: nickname,
      total_seats: totalSeats,
      available_seats: totalSeats - 1,
      origin,
      stops: validStops,
      destination: 'Casa César',
      departure_time: departureTime,
      return_time: returnTime,
      passengers: [nickname],
    });
    
    setShowForm(false);
    setOrigin('');
    setStops([]);
    setDepartureTime('');
    setReturnTime('');
    setTotalSeats(4);
  };

  const joinCar = async (car: any) => {
    if (!nickname || car.passengers.includes(nickname) || car.available_seats <= 0) return;
    
    await supabase.from('cars').update({
      passengers: [...car.passengers, nickname],
      available_seats: car.available_seats - 1
    }).eq('id', car.id);
  };

  const leaveCar = async (car: any) => {
    if (!nickname || !car.passengers.includes(nickname) || car.driver === nickname) return;
    
    const newPassengers = car.passengers.filter((p: string) => p !== nickname);
    
    await supabase.from('cars').update({
      passengers: newPassengers,
      available_seats: car.available_seats + 1
    }).eq('id', car.id);
  };

  const deleteCar = async (carId: string) => {
    await supabase.from('cars').delete().eq('id', carId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Coches y Ruta</h1>
          <p className="text-zinc-400">Organiza cómo llegamos a Casa César.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all text-sm font-bold active:scale-95"
        >
          <Plus size={18} />
          Añadir Viaje
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cars.length === 0 && (
          <p className="text-zinc-500 col-span-full text-center py-12">Todavía no hay viajes registrados.</p>
        )}
        
        {cars.map((car) => {
          const isPassenger = car.passengers?.includes(nickname);
          const isDriver = car.driver === nickname;

          return (
            <div key={car.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden hover:border-zinc-700 transition-colors">
              
              {/* HEADER TRAYECTO */}
              <div className="p-5 border-b border-zinc-800/60 bg-zinc-900/50 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${car.driver}`} alt={car.driver} className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700" />
                  <div>
                    <h3 className="font-semibold text-zinc-100">Viaje de {car.driver}</h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <Clock size={12} /> Salida: {car.departure_time?.slice(0,5)}
                    </p>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${car.available_seats > 0 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                  <Users size={12} />
                  <span className="text-[11px] font-bold">{car.available_seats} huecos</span>
                </div>
              </div>
              
              {/* TIMELINE BLABLACAR STYLE */}
              <div className="p-6 flex-1">
                <div className="relative pl-6">
                  {/* Vertical gradient line */}
                  <div className="absolute top-2 bottom-2 left-[7px] w-[3px] bg-gradient-to-b from-indigo-600 to-pink-500 rounded-full opacity-80" />
                  
                  {/* Origin */}
                  <div className="relative mb-6">
                    <div className="absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-300 border-[3px] border-zinc-900 z-10" />
                    <span className="text-base font-bold text-zinc-100">{car.origin}</span>
                  </div>

                  {/* Stops */}
                  {car.stops?.map((stop: string, idx: number) => (
                    <div key={idx} className="relative mb-6">
                      <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-zinc-600 border-[2px] border-zinc-900 z-10" />
                      <span className="text-sm font-medium text-zinc-300">{stop}</span>
                    </div>
                  ))}

                  {/* Destination */}
                  <div className="relative">
                    <div className="absolute -left-[22.5px] top-1.5 w-4 h-4 rounded-full bg-blue-500 border-[3px] border-zinc-900 z-10 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    <span className="text-base font-bold text-zinc-100">{car.destination || 'Casa César'}</span>
                  </div>
                </div>
              </div>

              {/* FOOTER & ACCIONES */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex -space-x-2 mr-4 overflow-hidden">
                  {car.passengers?.map((p: string, i: number) => (
                    <img 
                      key={i} 
                      src={`https://api.dicebear.com/9.x/notionists/svg?seed=${p}`} 
                      alt={p} 
                      title={p}
                      className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-950 relative z-10" 
                    />
                  ))}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {isDriver ? (
                    <button onClick={() => deleteCar(car.id)} className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-900 hover:bg-red-500/10 rounded-lg transition-colors" title="Borrar coche">
                      <Trash2 size={16} />
                    </button>
                  ) : isPassenger ? (
                    <button onClick={() => leaveCar(car)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-colors">
                      Bajarme del coche
                    </button>
                  ) : car.available_seats > 0 ? (
                    <button onClick={() => joinCar(car)} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white rounded-lg text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all active:scale-95">
                      Unirme
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-zinc-500 px-2">Lleno</span>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ADD CAR MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-100">Publicar un Viaje</h3>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800">
                <X size={20} />
              </button>
            </div>
            
            <form className="space-y-5" onSubmit={handleAddCar}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Plazas Totales</label>
                  <input type="number" min="1" max="8" value={totalSeats} onChange={(e) => setTotalSeats(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Hora Salida</label>
                  <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              
              <div className="space-y-4 pt-2 border-t border-zinc-800/50">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Origen</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-zinc-400 border-2 border-zinc-950"></div>
                    <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="¿De dónde sales?" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Paradas (Opcional)</label>
                    <button type="button" onClick={handleAddStop} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                      <Plus size={14} /> Añadir parada
                    </button>
                  </div>
                  
                  {stops.map((stop, index) => (
                    <div key={index} className="relative flex items-center gap-2 animate-in slide-in-from-top-2">
                      <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-950"></div>
                        <input 
                          type="text" 
                          value={stop} 
                          onChange={(e) => handleStopChange(index, e.target.value)} 
                          placeholder={`Parada ${index + 1}...`} 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" 
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveStop(index)} className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Destino</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-zinc-950"></div>
                    <input type="text" value="Casa César" disabled className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-300 font-semibold cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95">Publicar Viaje</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
