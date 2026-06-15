import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, Target, TrendingUp, Scale, Zap } from 'lucide-react';

const GOAL_LABELS = {
  seche: 'Sèche', prise_masse: 'Masse', maintien: 'Maintien', force: 'Force', cardio: 'Cardio',
};

export default function DashboardStats({ progressEntries = [], profile }) {
  const thisWeek = progressEntries.filter(e => {
    const d = new Date(e.date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  const workoutsThisWeek = thisWeek.filter(e => e.workout_completed).length;
  const targetDays = profile?.available_days || 3;
  const goalPct = Math.min(100, Math.round((workoutsThisWeek / targetDays) * 100));
  const latestWeight = progressEntries?.[0]?.weight_kg;
  const weightDelta = progressEntries.length > 1
    ? (progressEntries[0]?.weight_kg - progressEntries[progressEntries.length - 1]?.weight_kg || 0).toFixed(1)
    : null;

  const stats = [
    {
      icon: Calendar,
      label: 'Séances / semaine',
      value: `${workoutsThisWeek} / ${targetDays}`,
      sub: goalPct === 100 ? '🎉 Objectif atteint !' : `${goalPct}% de l'objectif`,
      color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200',
      ring: goalPct === 100 ? '#22c55e' : '#86efac',
      pct: goalPct,
    },
    {
      icon: Flame,
      label: 'Cal. brûlées (sem.)',
      value: `${workoutsThisWeek * 350}`,
      sub: 'kcal estimées',
      color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200',
      pct: null,
    },
    {
      icon: Scale,
      label: 'Poids actuel',
      value: latestWeight ? `${latestWeight} kg` : '--',
      sub: weightDelta !== null ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg total` : 'Aucune donnée',
      color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200',
      pct: null,
    },
    {
      icon: Target,
      label: 'Objectif actif',
      value: profile?.goal ? GOAL_LABELS[profile.goal] : '--',
      sub: profile?.food_mode === 'strict' ? '⚔️ Mode strict' : '😋 Mode flexible',
      color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
      pct: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <div className={`rounded-2xl border ${s.border} ${s.bg} p-4 card-hover`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center bg-white shadow-sm`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
            </div>
            <p className={`font-heading text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            {s.pct !== null && (
              <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-green-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}