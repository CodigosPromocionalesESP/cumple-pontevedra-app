'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { UtensilsCrossed, ShoppingCart, Plus, Trash2, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FoodPage() {
  const { nickname } = useStore();
  const [activeTab, setActiveTab] = useState<'meals'|'shopping'>('meals');
  
  // Meals
  const [meals, setMeals] = useState<any[]>([]);
  
  // Shopping
  const [shoppingItems, setShoppingItems] = useState<any[]>([]);
  const [shoppingParticipants, setShoppingParticipants] = useState<any[]>([]);
  
  // New Item Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('comida');
  const [newItemUnit, setNewItemUnit] = useState('uds');
  // Creator "me cunde" fields (appear dynamically when typing)
  const [creatorQuantity, setCreatorQuantity] = useState('');

  // UI State for "Me Cunde"
  const [activeCundeId, setActiveCundeId] = useState<string | null>(null);
  const [cundeQuantity, setCundeQuantity] = useState('');

  // UI State for expanded participants
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const fetchMeals = async () => {
    const { data } = await supabase.from('meals').select('*').order('created_at', { ascending: true });
    if (data) setMeals(data);
  };

  const fetchShopping = async () => {
    const { data: items } = await supabase.from('shopping_list').select('*').order('created_at', { ascending: true });
    const { data: parts } = await supabase.from('shopping_list_participants').select('*');
    if (items) setShoppingItems(items);
    if (parts) setShoppingParticipants(parts);
  };

  useEffect(() => {
    fetchMeals();
    fetchShopping();

    const mealsChannel = supabase.channel('meals_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, fetchMeals)
      .subscribe();

    const shoppingChannel = supabase.channel('shopping_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list' }, fetchShopping)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list_participants' }, fetchShopping)
      .subscribe();

    return () => {
      supabase.removeChannel(mealsChannel);
      supabase.removeChannel(shoppingChannel);
    };
  }, []);

  const toggleMealAttendance = async (meal: any) => {
    if (!nickname) return;
    const attendees = meal.attendees || [];
    const isAttending = attendees.includes(nickname);
    
    const newAttendees = isAttending 
      ? attendees.filter((n: string) => n !== nickname)
      : [...attendees, nickname];

    await supabase.from('meals').update({ attendees: newAttendees }).eq('id', meal.id);
  };

  const addShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || !nickname) return;

    const { data: inserted } = await supabase.from('shopping_list').insert({
      category: newItemCategory,
      item: newItemName.trim(),
      base_price: parseFloat(newItemPrice),
      unit_type: newItemUnit,
      added_by: nickname
    }).select().single();

    // If creator filled in their quantity, auto-register as participant
    if (inserted && creatorQuantity && parseFloat(creatorQuantity) > 0) {
      await supabase.from('shopping_list_participants').insert({
        shopping_list_id: inserted.id,
        nickname,
        quantity: parseFloat(creatorQuantity)
      });
    }

    setNewItemName('');
    setNewItemPrice('');
    setCreatorQuantity('');
  };

  const deleteShoppingItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('shopping_list').delete().eq('id', id);
  };

  const confirmCunde = async (itemId: string) => {
    if (!nickname || !cundeQuantity) return;
    await supabase.from('shopping_list_participants').insert({
      shopping_list_id: itemId,
      nickname,
      quantity: parseFloat(cundeQuantity)
    });
    setActiveCundeId(null);
    setCundeQuantity('');
  };

  const cancelCunde = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nickname) return;
    await supabase.from('shopping_list_participants').delete().match({ shopping_list_id: itemId, nickname });
  };

  const getAvatarUrl = (name: string) => `https://api.dicebear.com/9.x/notionists/svg?seed=${name}`;

  // Whether the form has enough data to show "me cunde" fields
  const showCreatorCunde = newItemName.trim().length > 0 && newItemPrice.length > 0;

  const renderShoppingList = (category: string) => {
    const items = shoppingItems.filter(i => i.category === category);
    if (items.length === 0) return <p className="text-zinc-500 text-sm py-2">No hay elementos en esta categoría.</p>;

    return (
      <div className="space-y-3">
        {items.map(item => {
          const participants = shoppingParticipants.filter(p => p.shopping_list_id === item.id);
          const imIn = participants.find(p => p.nickname === nickname);
          const isExpanded = expandedItemId === item.id;
          const isCundeActive = activeCundeId === item.id;

          // Totals
          const totalQuantity = participants.reduce((acc: number, p: any) => acc + Number(p.quantity), 0);
          const totalPrice = totalQuantity * Number(item.base_price);

          return (
            <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden transition-all">
              {/* HEADER ITEM */}
              <div className="p-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-zinc-100">{item.item}</h4>
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                      {item.base_price}€ / {item.unit_type}
                    </span>
                  </div>
                  {/* Accumulated totals — gradient text, centered */}
                  {participants.length > 0 && (
                    <p className="mt-2 text-sm font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                      {totalQuantity} {item.unit_type} · {totalPrice.toFixed(2)}€ total
                    </p>
                  )}
                  <div className="text-xs text-zinc-500 mt-1.5 flex items-center gap-2">
                    <span>Añadido por {item.added_by}</span>
                    {participants.length > 0 && (
                      <>
                        <span>•</span>
                        <button 
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
                        >
                          <Users size={12} />
                          {participants.length} apuntado{participants.length !== 1 ? 's' : ''}
                          <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </>
                    )}
                    {participants.length === 0 && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-600">0 apuntados</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {imIn ? (
                    <button 
                      onClick={(e) => cancelCunde(item.id, e)}
                      className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      Ya no me cunde
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setActiveCundeId(isCundeActive ? null : item.id); setCundeQuantity(''); }}
                      className="text-xs bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-indigo-500/20 transition-all active:scale-95 font-bold"
                    >
                      Me cunde
                    </button>
                  )}
                  {item.added_by === nickname && (
                    <button onClick={(e) => deleteShoppingItem(item.id, e)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* PANEL "ME CUNDE" (INPUT) */}
              {isCundeActive && !imIn && (
                <div className="bg-zinc-800/50 border-y border-zinc-800 p-4">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">¿Qué cantidad necesitas? (en {item.unit_type})</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      value={cundeQuantity}
                      onChange={(e) => setCundeQuantity(e.target.value)}
                      placeholder="Ej: 0.5"
                      className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm w-24 focus:outline-none focus:border-indigo-500 text-zinc-100"
                    />
                    <div className="flex-1 text-sm text-zinc-300">
                      Coste: <strong className="text-indigo-400">
                        {cundeQuantity ? (parseFloat(cundeQuantity) * item.base_price).toFixed(2) : '0.00'}€
                      </strong>
                    </div>
                    <button onClick={() => setActiveCundeId(null)} className="text-xs px-3 py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
                    <button onClick={() => confirmCunde(item.id)} className="text-xs bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white px-4 py-1.5 rounded-lg font-bold shadow-sm shadow-indigo-500/20 transition-all active:scale-95">Confirmar</button>
                  </div>
                </div>
              )}

              {/* SUB-LISTA PARTICIPANTES (DROPDOWN) */}
              {isExpanded && participants.length > 0 && (
                <div className="bg-zinc-900/80 p-4 border-t border-zinc-800/50">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Participantes</p>
                  <div className="space-y-2">
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center gap-3">
                          <img src={getAvatarUrl(p.nickname)} alt={p.nickname} className="w-6 h-6 rounded-full bg-zinc-800" />
                          <span className="text-sm font-medium text-zinc-200">{p.nickname}</span>
                        </div>
                        <div className="text-xs flex gap-4 text-zinc-400">
                          <span>{p.quantity} {item.unit_type}</span>
                          <span className="font-semibold text-zinc-300">{(p.quantity * item.base_price).toFixed(2)}€</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Comida y Compras</h1>
        <p className="text-zinc-400">Organiza los menús y la lista de la compra colaborativa.</p>
      </div>

      <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
        <button 
          onClick={() => setActiveTab('meals')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'meals' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <UtensilsCrossed size={16} /> Plan de Comidas
        </button>
        <button 
          onClick={() => setActiveTab('shopping')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'shopping' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <ShoppingCart size={16} /> Lista de la Compra
        </button>
      </div>

      {activeTab === 'meals' && (
        <div className="space-y-4">
          {meals.length === 0 && <p className="text-zinc-500 text-center py-8">No hay comidas planificadas.</p>}
          {meals.map((meal) => {
            const attendees = meal.attendees || [];
            const imIn = nickname && attendees.includes(nickname);
            return (
              <div key={meal.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full -z-0"></div>
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100">{meal.name}</h3>
                    <p className="text-sm text-zinc-400">{meal.description}</p>
                  </div>
                  <button 
                    onClick={() => toggleMealAttendance(meal)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${imIn ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30' : 'bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40'}`}>
                    {imIn ? 'Apuntado ✓' : 'Yo me apunto'}
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800/50 relative z-10">
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">{attendees.length} Apuntados:</p>
                  <div className="flex flex-wrap gap-2">
                    {attendees.map((p: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-md">
                        <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${p}`} alt={p} className="w-4 h-4 rounded-full" />
                        <span className="text-xs text-zinc-300">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'shopping' && (
        <div className="space-y-6">
          {/* Formulario Crear Item */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Añadir nuevo producto</h3>
            <form onSubmit={addShoppingItem} className="space-y-3">
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <input 
                  type="text" 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nombre del producto..." 
                  className="flex-[2] min-w-[150px] bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" 
                />
                <div className="flex flex-1 min-w-[150px] gap-2">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="Precio/ud" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" 
                  />
                  <select 
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="uds">uds</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                  </select>
                </div>
                <select 
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="comida">Comida</option>
                  <option value="bebida">Bebida y demás</option>
                </select>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors">
                  <Plus size={20} />
                </button>
              </div>

              {/* Dynamic "Me Cunde" panel for the creator */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: showCreatorCunde ? '120px' : '0px',
                  opacity: showCreatorCunde ? 1 : 0,
                }}
              >
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-3 flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-zinc-400 font-medium">¿Te cunde? Indica tu cantidad:</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={creatorQuantity}
                    onChange={(e) => setCreatorQuantity(e.target.value)}
                    placeholder={`Cantidad (${newItemUnit})`}
                    className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:border-indigo-500 text-zinc-100 transition-colors"
                  />
                  {creatorQuantity && newItemPrice && (
                    <span className="text-sm text-zinc-300">
                      Tu coste: <strong className="text-indigo-400">{(parseFloat(creatorQuantity) * parseFloat(newItemPrice)).toFixed(2)}€</strong>
                    </span>
                  )}
                  {!creatorQuantity && (
                    <span className="text-xs text-zinc-600 italic">Opcional — déjalo vacío si solo quieres añadirlo para otros</span>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Listas Divididas */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">🍔 Comida</h3>
              {renderShoppingList('comida')}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">🍻 Bebida y demás</h3>
              {renderShoppingList('bebida')}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
