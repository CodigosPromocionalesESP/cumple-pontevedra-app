'use client';

import { useState, useEffect } from 'react';

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Arbitrary future date for the trip (e.g. next month)
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 1);
    targetDate.setDate(15);
    targetDate.setHours(17, 0, 0, 0);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <h2 className="text-zinc-400 text-sm font-medium mb-2 uppercase tracking-widest">Cuenta atrás para Pontevedra</h2>
      <div className="flex justify-center gap-4 text-zinc-100">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold font-mono">{timeLeft.days.toString().padStart(2, '0')}</span>
          <span className="text-xs text-zinc-500 uppercase">Días</span>
        </div>
        <span className="text-3xl font-bold text-zinc-700">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold font-mono">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="text-xs text-zinc-500 uppercase">Horas</span>
        </div>
        <span className="text-3xl font-bold text-zinc-700">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold font-mono">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="text-xs text-zinc-500 uppercase">Min</span>
        </div>
        <span className="text-3xl font-bold text-zinc-700">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold font-mono text-indigo-400">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="text-xs text-zinc-500 uppercase">Seg</span>
        </div>
      </div>
    </div>
  );
}
