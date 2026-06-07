'use client';

import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { nickname, setNickname } = useStore();
  const [inputName, setInputName] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!nickname) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">¡Nos vamos a Pontevedra!</h1>
          <p className="text-zinc-400 mb-8">Introduce tu nickname para organizarnos.</p>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (inputName.trim().length > 2) {
                setNickname(inputName.trim());
              }
            }}
            className="space-y-4"
          >
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Ej: Pedro, María..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={inputName.trim().length <= 2}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-xl transition-all"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
