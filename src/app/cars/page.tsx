'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Users, Clock, Plus, X, Trash2, Lock, ArrowRight, ArrowLeft, Hand } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function Toast({ message, isError = false, show }: { message: string, isError?: boolean, show: boolean }) {
  return (
    <div className={`fixed top-20 right-4 ${isError ? 'bg-red-900 border-red-500 text-red-100' : 'bg-emerald-900 border-emerald-500 text-emerald-100'} border px-4 py-3 rounded-xl shadow-lg transition-all duration-300 z-[100] ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
      {message}
    </div>
  );
}

export default function CarsPage() {
  const { nickname } = useStore();
  const [activeTab, setActiveTab] = useState<'available' | 'requests'>('available');
  
  const [cars, setCars] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  
  // Modals state
  const [showCarForm, setShowCarForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [confirmMatch, setConfirmMatch] = useState<{ show: boolean, request: any | null, matchingCar: any | null }>({ show: false, request: null, matchingCar: null });
  
  // Toast state
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isToastError, setIsToastError] = useState(false);

  const displayToast = (msg: string, isError = false) => {
    setToastMsg(msg);
    setIsToastError(isError);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // --- Car Form State ---
  const [carDirection, setCarDirection] = useState<'ida' | 'vuelta'>('ida');
  const [totalSeats, setTotalSeats] = useState(4);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('Casa César');
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState(''); // kept for backward compatibility, though we use direction
  const [stops, setStops] = useState<string[]>([]);
  const [acceptsStops, setAcceptsStops] = useState(true);
  const [preFillRequestId, setPreFillRequestId] = useState<string | null>(null);

  // --- Request Form State ---
  const [reqDirection, setReqDirection] = useState<'ida' | 'vuelta'>('ida');
  const [reqLocation, setReqLocation] = useState('');
  const [reqPrice, setReqPrice] = useState('');

  const fetchCarsAndRequests = async () => {
    const { data: carsData } = await supabase.from('cars').select('*').order('created_at', { ascending: true });
    if (carsData) setCars(carsData);

    const { data: reqData } = await supabase.from('ride_requests').select('*').order('created_at', { ascending: true });
    if (reqData) setRequests(reqData);
  };

  useEffect(() => {
    fetchCarsAndRequests();

    const channel1 = supabase.channel('cars_channel_2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, fetchCarsAndRequests)
      .subscribe();

    const channel2 = supabase.channel('reqs_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, fetchCarsAndRequests)
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, []);

  // Sync fixed fields based on direction
  useEffect(() => {
    if (carDirection === 'ida') {
      setDestination('Casa César');
      if (origin === 'Casa César') setOrigin('');
    } else {
      setOrigin('Casa César');
      if (destination === 'Casa César' && origin !== 'Casa César') setDestination(origin);
    }
  }, [carDirection]);

  // --- Handlers for Stops ---
  const handleAddStop = () => setStops([...stops, '']);
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

  // --- Modals opening ---
  const openCarForm = (initialData?: { direction?: 'ida' | 'vuelta', location?: string, reqId?: string }) => {
    setCarDirection(initialData?.direction || 'ida');
    if (initialData?.direction === 'ida') {
      setOrigin(initialData?.location || '');
      setDestination('Casa César');
    } else if (initialData?.direction === 'vuelta') {
      setOrigin('Casa César');
      setDestination(initialData?.location || '');
    } else {
      setOrigin('');
      setDestination('Casa César');
    }
    setTotalSeats(4);
    setDepartureTime('');
    setStops([]);
    setAcceptsStops(true);
    setPreFillRequestId(initialData?.reqId || null);
    setShowCarForm(true);
  };

  // --- Submits ---
  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !origin || !departureTime || !destination) return;
    
    // Asegurar que el perfil existe en la BD (por si el usuario borró las tablas pero sigue logueado en el navegador)
    await supabase.from('profiles').upsert({ nickname }).select();

    const validStops = stops.filter(s => s.trim() !== '');

    const { data: newCar, error } = await supabase.from('cars').insert({
      driver: nickname,
      total_seats: totalSeats,
      available_seats: totalSeats - 1, // Driver takes 1
      direction: carDirection,
      origin,
      destination,
      stops: validStops,
      accepts_stops: acceptsStops,
      departure_time: departureTime,
      passengers: [nickname],
    }).select().single();
    
    if (error) {
      console.error(error);
      displayToast(`Error DB: ${error.message} (Code: ${error.code})`, true);
      return;
    }

    // If we were pre-filling from a request, we auto-accept that request into this new car
    if (preFillRequestId && newCar) {
      const req = requests.find(r => r.id === preFillRequestId);
      if (req) {
        await acceptRequestIntoCar(req, newCar);
      }
    }

    setShowCarForm(false);
    displayToast('¡Viaje publicado con éxito!');
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !reqLocation) return;

    // Asegurar que el perfil existe en la BD
    await supabase.from('profiles').upsert({ nickname }).select();

    const { error } = await supabase.from('ride_requests').insert({
      user_nickname: nickname,
      direction: reqDirection,
      location: reqLocation,
      proposed_price: reqPrice ? parseFloat(reqPrice) : 0,
      status: 'pending'
    });

    if (error) {
      console.error(error);
      displayToast(`Error DB: ${error.message} (Code: ${error.code})`, true);
      return;
    }

    setShowRequestForm(false);
    setReqLocation('');
    setReqPrice('');
    displayToast('Solicitud enviada. ¡Suerte!');
  };

  // --- Car Actions ---
  const joinCar = async (car: any) => {
    if (!nickname || car.passengers.includes(nickname) || car.available_seats <= 0) return;
    await supabase.from('cars').update({
      passengers: [...car.passengers, nickname],
      available_seats: car.available_seats - 1
    }).eq('id', car.id);
    displayToast('Te has unido al viaje');
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

  const deleteRequest = async (reqId: string) => {
    await supabase.from('ride_requests').delete().eq('id', reqId);
  };

  // --- Matchmaking Engine ---
  const handleCarryPerson = (req: any) => {
    // Check condition A: User has a compatible active trip
    const compatibleCar = cars.find(c => c.driver === nickname && c.direction === req.direction && c.available_seats > 0);
    
    if (compatibleCar) {
      // Condition A -> Alert Modal
      setConfirmMatch({ show: true, request: req, matchingCar: compatibleCar });
    } else {
      // Condition B -> No compatible trip -> Pre-fill creation modal
      const confirmText = "No tienes un viaje publicado en esta dirección. Para llevarla, añade el trayecto. ¿Quieres crearlo ahora?";
      if (window.confirm(confirmText)) {
        openCarForm({ direction: req.direction, location: req.location, reqId: req.id });
      }
    }
  };

  const acceptRequestIntoCar = async (req: any, car: any) => {
    // Add passenger
    const newPassengers = [...car.passengers, req.user_nickname];
    
    // Inject location into stops if not already there and if accepts_stops
    let newStops = car.stops || [];
    if (car.accepts_stops && !newStops.includes(req.location) && req.location !== car.origin && req.location !== car.destination) {
      newStops = [...newStops, req.location];
    }

    await supabase.from('cars').update({
      passengers: newPassengers,
      available_seats: car.available_seats - 1,
      stops: newStops
    }).eq('id', car.id);

    await supabase.from('ride_requests').update({ status: 'accepted' }).eq('id', req.id);
    
    setConfirmMatch({ show: false, request: null, matchingCar: null });
    displayToast(`${req.user_nickname} se ha unido a tu coche`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toast message={toastMsg} isError={isToastError} show={showToast} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Coches y Logística</h1>
          <p className="text-zinc-400">Publica un viaje o pide que te lleven.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl transition-all text-sm font-bold shadow-md shadow-black/20 active:scale-95 border border-zinc-700"
          >
            <Hand size={18} /> Pedir Viaje
          </button>
          <button 
            onClick={() => openCarForm()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all text-sm font-bold active:scale-95"
          >
            <Plus size={18} /> Publicar Viaje
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
        <button 
          onClick={() => setActiveTab('available')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'available' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Viajes Disponibles
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Buscando Viaje
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
      </div>

      {/* TAB: VIAJES DISPONIBLES */}
      {activeTab === 'available' && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cars.length === 0 && (
            <p className="text-zinc-500 col-span-full text-center py-12">Todavía no hay viajes registrados.</p>
          )}
          
          {cars.map((car) => {
            const isPassenger = car.passengers?.includes(nickname);
            const isDriver = car.driver === nickname;

            return (
              <div key={car.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden hover:border-zinc-700 transition-colors relative group">
                
                {/* Accepts Stops Badge */}
                {!car.accepts_stops && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-zinc-950/80 backdrop-blur border border-red-500/30 text-red-400 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" title="Itinerario Cerrado: No acepta desvíos">
                    <Lock size={10} /> Cerrado
                  </div>
                )}

                {/* HEADER TRAYECTO */}
                <div className="p-5 border-b border-zinc-800/60 bg-zinc-900/50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${car.driver}`} alt={car.driver} className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700" />
                      <div>
                        <h3 className="font-semibold text-zinc-100">Viaje de {car.driver}</h3>
                        <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <Clock size={12} /> Salida: {car.departure_time?.slice(0,5)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${car.available_seats > 0 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                      <Users size={12} />
                      <span className="text-[11px] font-bold">{car.available_seats} huecos</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/50 flex items-center gap-1.5">
                      {car.direction === 'ida' ? <ArrowRight size={12} className="text-indigo-400"/> : <ArrowLeft size={12} className="text-pink-400"/>}
                      <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">{car.direction}</span>
                    </div>
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
                      <span className="text-base font-bold text-zinc-100">{car.destination}</span>
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
                      <button onClick={() => deleteCar(car.id)} className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-900 hover:bg-red-500/10 rounded-lg transition-colors" title="Borrar viaje">
                        <Trash2 size={16} />
                      </button>
                    ) : isPassenger ? (
                      <button onClick={() => leaveCar(car)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-colors">
                        Bajarme
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
      )}

      {/* TAB: BUSCANDO VIAJE */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.filter(r => r.status === 'pending').length === 0 && (
            <p className="text-zinc-500 text-center py-12">Nadie necesita viaje en este momento. ¡Qué bien os organizáis!</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {requests.map(req => {
              const isMine = req.user_nickname === nickname;
              if (req.status !== 'pending' && !isMine) return null; // Show own accepted ones maybe, but let's hide accepted mostly or style differently

              return (
                <div key={req.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${req.status === 'accepted' ? 'bg-emerald-900/10 border-emerald-500/20 opacity-70' : 'bg-zinc-900 border-zinc-800'}`}>
                  <div className="flex items-center gap-4">
                    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${req.user_nickname}`} alt={req.user_nickname} className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-zinc-100">{req.user_nickname}</h4>
                        {req.status === 'accepted' && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">¡Emparejado!</span>}
                      </div>
                      <p className="text-sm text-zinc-300 flex items-center gap-1.5">
                        {req.direction === 'ida' ? <ArrowRight size={14} className="text-indigo-400"/> : <ArrowLeft size={14} className="text-pink-400"/>}
                        <span className="font-medium">{req.location}</span>
                      </p>
                      {req.proposed_price > 0 && (
                        <p className="text-xs text-indigo-400 mt-1 font-semibold">Propone: {req.proposed_price}€</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {isMine ? (
                      <button onClick={() => deleteRequest(req.id)} className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-950 hover:bg-red-500/10 rounded-lg transition-colors" title="Borrar solicitud">
                        <Trash2 size={16} />
                      </button>
                    ) : req.status === 'pending' ? (
                      <button 
                        onClick={() => handleCarryPerson(req)}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                      >
                        Llevar a esta persona
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONFIRM MATCH MODAL */}
      {confirmMatch.show && confirmMatch.request && confirmMatch.matchingCar && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Añadir a tu viaje</h3>
            <p className="text-sm text-zinc-400 mb-6">Al llevar a <strong className="text-zinc-200">{confirmMatch.request.user_nickname}</strong> se añadirá a tu viaje actual de <strong className="text-indigo-400 uppercase">{confirmMatch.request.direction}</strong>.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmMatch({ show: false, request: null, matchingCar: null })} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
              <button onClick={() => acceptRequestIntoCar(confirmMatch.request, confirmMatch.matchingCar)} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD RIDE REQUEST MODAL */}
      {showRequestForm && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-100">Pedir Viaje</h3>
              <button onClick={() => setShowRequestForm(false)} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800">
                <X size={20} />
              </button>
            </div>
            
            <form className="space-y-5" onSubmit={handleAddRequest}>
              
              <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex">
                <button 
                  type="button"
                  onClick={() => setReqDirection('ida')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${reqDirection === 'ida' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                >Ida</button>
                <button 
                  type="button"
                  onClick={() => setReqDirection('vuelta')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${reqDirection === 'vuelta' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                >Vuelta</button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">{reqDirection === 'ida' ? '¿Dónde te recogen?' : '¿Dónde te dejan?'}</label>
                <input type="text" value={reqLocation} onChange={(e) => setReqLocation(e.target.value)} placeholder="Ciudad, pueblo, calle..." required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Aportación Gasolina (Opcional)</label>
                <div className="relative">
                  <input type="number" step="0.01" min="0" value={reqPrice} onChange={(e) => setReqPrice(e.target.value)} placeholder="0.00" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-4 pr-8 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">€</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowRequestForm(false)} className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all active:scale-95">Pedir Viaje</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CAR MODAL (REFACTORED FOR DIRECTION) */}
      {showCarForm && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-100">Publicar un Viaje</h3>
              <button onClick={() => setShowCarForm(false)} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800">
                <X size={20} />
              </button>
            </div>
            
            <form className="space-y-5" onSubmit={handleAddCar}>
              
              {/* Dirección Toggle */}
              <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex">
                <button 
                  type="button"
                  onClick={() => setCarDirection('ida')}
                  className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${carDirection === 'ida' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                ><ArrowRight size={14}/> Ida a Casa César</button>
                <button 
                  type="button"
                  onClick={() => setCarDirection('vuelta')}
                  className={`flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${carDirection === 'vuelta' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                ><ArrowLeft size={14}/> Vuelta a casa</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Plazas Totales</label>
                  <input type="number" min="1" max="8" value={totalSeats} onChange={(e) => setTotalSeats(parseInt(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Hora Salida</label>
                  <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              
              <div className="space-y-4 pt-2 border-t border-zinc-800/50">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Origen</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-zinc-400 border-2 border-zinc-950"></div>
                    <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} disabled={carDirection === 'vuelta'} placeholder="¿De dónde sales?" required className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors ${carDirection === 'vuelta' ? 'opacity-70 cursor-not-allowed font-semibold' : ''}`} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Paradas (Opcional)</label>
                    <button type="button" onClick={handleAddStop} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
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

                  <label className="flex items-center gap-2 cursor-pointer mt-2 group">
                    <input type="checkbox" checked={acceptsStops} onChange={(e) => setAcceptsStops(e.target.checked)} className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" />
                    <span className="text-xs text-zinc-400 font-medium group-hover:text-zinc-300 transition-colors">Acepto propuestas de paradas adicionales</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Destino</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-zinc-950 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                    <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} disabled={carDirection === 'ida'} required className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors ${carDirection === 'ida' ? 'opacity-70 cursor-not-allowed font-semibold' : ''}`} />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowCarForm(false)} className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95">Publicar Viaje</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
