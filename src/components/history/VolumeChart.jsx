import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function VolumeChart({ sessions, isFR = true }) {
  // Prend les 12 dernières séances avec volume
  const data = [...sessions]
    .filter(s => s.total_volume_kg > 0)
    .slice(-12)
    .map(s => ({
      date: s.date ? format(new Date(s.date), 'd MMM', { locale: fr }) : '',
      volume: s.total_volume_kg,
      duration: s.duration_min,
    }));

  if (data.length < 2) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
        📈 {isFR ? 'Volume soulevé (kg)' : 'Volume lifted (kg)'}
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1e50dc" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#1e50dc" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,80,220,0.08)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
            formatter={(v) => [`${v.toLocaleString('fr')} kg`, isFR ? 'Volume' : 'Volume']}
          />
          <Area type="monotone" dataKey="volume" stroke="#1e50dc" strokeWidth={2} fill="url(#volGrad)" dot={{ r: 3, fill: '#1e50dc' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}