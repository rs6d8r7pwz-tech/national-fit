import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { startOfWeek, format, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FrequencyChart({ sessions, isFR = true }) {
  // Compte les séances par semaine sur les 8 dernières semaines
  const now = new Date();
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const weekStart = startOfWeek(addWeeks(now, i - 7), { weekStartsOn: 1 });
    const label = format(weekStart, 'd MMM', { locale: fr });
    const count = sessions.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      const ws = startOfWeek(d, { weekStartsOn: 1 });
      return ws.getTime() === weekStart.getTime();
    }).length;
    return { label, count };
  });

  const max = Math.max(...weeks.map(w => w.count), 1);

  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3">
        📅 {isFR ? 'Fréquence (séances/semaine)' : 'Frequency (sessions/week)'}
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={weeks} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,163,74,0.08)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
            formatter={(v) => [v, isFR ? 'Séances' : 'Sessions']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {weeks.map((entry, i) => (
              <Cell key={i} fill={entry.count === max && max > 0 ? '#16a34a' : '#86efac'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}