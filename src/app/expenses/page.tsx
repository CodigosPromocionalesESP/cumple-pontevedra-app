'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, Receipt, Calculator, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ExpensesPage() {
  const { nickname } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalPeople, setTotalPeople] = useState(1);

  // Form
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');

  const fetchExpensesAndProfiles = async () => {
    // Fetch expenses
    const { data: expensesData } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (expensesData) setExpenses(expensesData);

    // Fetch profiles count to divide
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    if (count && count > 0) {
      setTotalPeople(count);
    }
  };

  useEffect(() => {
    fetchExpensesAndProfiles();

    const expensesChannel = supabase.channel('expenses_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchExpensesAndProfiles)
      .subscribe();

    const profilesChannel = supabase.channel('profiles_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchExpensesAndProfiles)
      .subscribe();

    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !concept || !amount) return;

    await supabase.from('expenses').insert({
      payer: nickname,
      concept,
      amount: parseFloat(amount),
    });

    setShowForm(false);
    setConcept('');
    setAmount('');
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
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
          <span className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">{totalSpent.toFixed(2)}€</span>
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
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white px-4 py-2 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all text-sm font-medium active:scale-95"
        >
          <Plus size={16} /> Añadir Gasto
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6 animate-in slide-in-from-top-4 fade-in duration-300">
          <form className="space-y-4" onSubmit={handleAddExpense}>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Concepto</label>
              <input type="text" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej: Compra bebida" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-100 focus:border-indigo-500 transition-colors focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Quién pagó</label>
                <input type="text" value={nickname || ''} disabled className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Cuánto (€)</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-100 focus:border-indigo-500 transition-colors focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white rounded-lg text-sm font-medium shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95">Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {expenses.length === 0 && <p className="text-zinc-500 text-center py-4">No hay gastos registrados todavía.</p>}
        {expenses.map((expense) => (
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
                  <span>{new Date(expense.created_at).toLocaleDateString()}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-zinc-100">{Number(expense.amount).toFixed(2)}€</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
