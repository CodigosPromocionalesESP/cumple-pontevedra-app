'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, Utensils, Receipt, LogOut } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function Navbar() {
  const pathname = usePathname();
  const { logout, nickname } = useStore();

  const navItems = [
    { name: 'Coches', href: '/cars', icon: Car },
    { name: 'Comidas', href: '/food', icon: Utensils },
    { name: 'Gastos', href: '/expenses', icon: Receipt },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800 z-50 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around p-3 relative">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) || (pathname === '/' && item.href === '/cars');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                isActive 
                  ? 'text-indigo-400 bg-indigo-500/10' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={24} className="mb-1" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.name}</span>
            </Link>
          );
        })}
        <button 
          onClick={logout}
          className="flex flex-col items-center p-2 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all absolute right-4 top-[-50px] bg-zinc-900 border border-zinc-800 shadow-lg"
          title={`Salir (${nickname})`}
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
