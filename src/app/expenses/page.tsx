'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, Receipt, Calculator, ArrowRight } from 'lucide-react';

export default function ExpensesPage() {
  const { nickname } = useStore();
  const [showForm, setShowForm] = useState(false);

  const mockExpenses = [
    { id: 1, payer: 'Pedro', amount: 120.50, concept: 'Compra Supermercado', date: 'Viernes' },
    { id: 2, payer: 'María', amount: 45.00, concept: 'Gasolina', date: 'Sábado' },
    { id: 3, payer: 'Juan', amount: 80.00, concept: 'Regalo Cumpleaños', date: 'Viernes' },
  ];

  const totalSpent = mockExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPeople = 5; // Asumimos 5 personas para el mock
  const perPerson = totalSpent / totalPeople;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Cuentas Claras</h1>
        <p className="text-zinc-400">Apunta los gastos para cuadrar al final del viaje.</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-900/40 to-zinc-900 border border-indigo-500/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Calculator size={100} />
        </div>
        <h2 className="text-sm font-medium text-indigo-300/80 uppercase tracking-wider mb-2">Resumen Total</h2>
        <div className="flex items-end gap-4 mb-4">
          <span className="text-4xl font-bold text-white">{totalSpent.toFixed(2)}€</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-300 bg-black/20 w-max px-3 py-1.5 rounded-lg border border-white/5">
          <span>Tocamos a</span>
          <span className="font-bold text-indigo-400">{perPerson.toFixed(2)}€</span>
          <span>por persona ({totalPeople})</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-zinc-100">Gastos Registrados</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all text-sm font-medium"
        >
          <Plus size={16} /> Añadir Gasto
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6 animate-in slide-in-from-top-4 fade-in duration-300">
          <form className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Concepto</label>
              <input type="text" placeholder="Ej: Compra bebida" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-100 focus:border-indigo-500 transition-colors focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Quién pagó</label>
                <input type="text" value={nickname || ''} disabled className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Cuánto (€)</label>
                <input type="number" step="0.01" placeholder="0.00" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-100 focus:border-indigo-500 transition-colors focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium">Cancelar</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {mockExpenses.map((expense) => (
          <div key={expense.id} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                <Receipt size={24} />
              </div>
              <div>
                <h3 className="font-medium text-zinc-100">{expense.concept}</h3>
                <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-0.5">
                  <span className="font-medium text-zinc-400">{expense.payer}</span>
                  <ArrowRight size={10} className="text-zinc-600" />
                  <span>{expense.date}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-zinc-100">{expense.amount.toFixed(2)}€</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
