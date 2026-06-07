'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { CheckSquare, Square, Plus, UtensilsCrossed, ShoppingCart } from 'lucide-react';

export default function FoodPage() {
  const { nickname } = useStore();
  const [activeTab, setActiveTab] = useState<'meals'|'shopping'>('meals');
  
  const mockMeals = [
    { id: 1, name: 'Cena Viernes', description: 'Bocadillos y picoteo al llegar', attendees: ['Pedro', 'María', 'Juan'] },
    { id: 2, name: 'Comida Sábado', description: 'Barbacoa', attendees: ['Pedro', 'María'] },
  ];

  const mockShopping = [
    { id: 1, item: 'Hielo (4 bolsas)', checked: false },
    { id: 2, item: 'Carne para barbacoa', checked: true },
    { id: 3, item: 'Cervezas y refrescos', checked: false },
  ];

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
          {mockMeals.map((meal) => {
            const imIn = nickname && meal.attendees.includes(nickname);
            return (
              <div key={meal.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full -z-0"></div>
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100">{meal.name}</h3>
                    <p className="text-sm text-zinc-400">{meal.description}</p>
                  </div>
                  <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${imIn ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {imIn ? 'Apuntado ✓' : 'Yo me apunto'}
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800/50 relative z-10">
                  <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">{meal.attendees.length} Apuntados:</p>
                  <div className="flex flex-wrap gap-2">
                    {meal.attendees.map((p, i) => (
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
          <div className="flex gap-2 mb-6">
            <input type="text" placeholder="Añadir a la lista..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors" />
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors">
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-1">
            {mockShopping.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-xl transition-colors cursor-pointer group">
                <button className={`transition-colors ${item.checked ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                  {item.checked ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
                <span className={`text-sm font-medium transition-all ${item.checked ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                  {item.item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
