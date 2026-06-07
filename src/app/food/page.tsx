'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { CheckSquare, Square, Plus, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FoodPage() {
  const { nickname } = useStore();
  const [activeTab, setActiveTab] = useState<'meals'|'shopping'>('meals');
  
  const [meals, setMeals] = useState<any[]>([]);
  const [shopping, setShopping] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');

  const fetchMeals = async () => {
    const { data } = await supabase.from('meals').select('*').order('created_at', { ascending: true });
    if (data) setMeals(data);
  };

  const fetchShopping = async () => {
    const { data } = await supabase.from('shopping_list').select('*').order('created_at', { ascending: true });
    if (data) setShopping(data);
  };

  useEffect(() => {
    fetchMeals();
    fetchShopping();

    const mealsChannel = supabase.channel('meals_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, fetchMeals)
      .subscribe();

    const shoppingChannel = supabase.channel('shopping_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list' }, fetchShopping)
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
    if (!newItem.trim() || !nickname) return;

    await supabase.from('shopping_list').insert({
      item: newItem.trim(),
      added_by: nickname,
      checked: false
    });
    setNewItem('');
  };

  const toggleShoppingItem = async (item: any) => {
    await supabase.from('shopping_list').update({ checked: !item.checked }).eq('id', item.id);
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
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${imIn ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {imIn ? 'Apuntado ✓' : 'Yo me apunto'}
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800/50 relative z-10">
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">{attendees.length} Apuntados:</p>
                  <div className="flex flex-wrap gap-2">
                    {attendees.map((p: string, i: number) => (
                      <span key={i} className="text-xs bg-zinc-950 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'shopping' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <form onSubmit={addShoppingItem} className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Añadir a la lista..." 
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" 
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors">
              <Plus size={20} />
            </button>
          </form>
          
          <div className="space-y-1">
            {shopping.length === 0 && <p className="text-zinc-500 text-center py-4">La lista está vacía.</p>}
            {shopping.map((item) => (
              <div key={item.id} onClick={() => toggleShoppingItem(item)} className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-xl transition-colors cursor-pointer group">
                <button className={`transition-colors ${item.checked ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                  {item.checked ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
                <span className={`text-sm font-medium transition-all ${item.checked ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                  {item.item}
                </span>
                <span className="ml-auto text-xs text-zinc-600">{item.added_by}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
