import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const TABS = [
  { key: 'poids', label: 'Poids', unit: 'kg', color: '#22c55e' },
  { key: 'waist_cm', label: 'Taille', unit: 'cm', color: '#a855f7' },
  { key: 'arms_cm', label: 'Bras', unit: 'cm', color: '#3b82f6' },
  { key: 'body_fat_pct', label: '% Graisse', unit: '%', color: '#f97316' },
];

export default function ProgressChart({ entries }) {
  const [activeTab, setActiveTab] = useState('poids');

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));

  const chartData = sorted.map(e => ({
    date: format(new Date(e.date), 'd MMM', { locale: fr }),
    poids: e.weight_kg,
    waist_cm: e.waist_cm,
    arms_cm: e.arms_cm,
    body_fat_pct: e.body_fat_pct,
  }));

  const tab = TABS.find(t => t.key === activeTab);

  // Calculate trend
  const validData = chartData.filter(d => d[activeTab] != null);
  const first = validData[0]?.[activeTab];
  const last = validData[validData.length - 1]?.[activeTab];
  const diff = first && last ? (last - first).toFixed(1) : null;
  const isDown = diff < 0;
  const isUp = diff > 0;

  if (chartData.length < 2) {
    return (
      <Card className="p-5 bg-white border-gray-200">
        <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-2">Graphiques</h3>
        <p className="text-sm text-muted-foreground">Ajoutez au moins 2 entrées pour voir vos courbes.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-white border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Évolution</h3>
        {diff !== null && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${isDown ? 'text-green-600' : isUp ? 'text-red-500' : 'text-gray-500'}`}>
            {isDown ? <TrendingDown className="h-4 w-4" /> : isUp ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            {isUp ? '+' : ''}{diff} {tab.unit}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={tab.color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={tab.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['auto', 'auto']} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: 12 }}
            formatter={(v) => v ? [`${v} ${tab.unit}`, tab.label] : ['-', tab.label]}
          />
          <Area
            type="monotone"
            dataKey={activeTab}
            stroke={tab.color}
            strokeWidth={2.5}
            fill={`url(#grad-${activeTab})`}
            dot={{ r: 4, fill: tab.color, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: tab.color }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}