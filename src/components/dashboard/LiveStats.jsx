import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Dumbbell, TrendingDown, Zap, Calendar } from 'lucide-react';

function StatCard({ icon: IconComp, label, value, unit, color, delay = 0 }) {
  const Icon = IconComp;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="h-4.5 w-4.5" style={{ width: '1.1rem', height: '1.1rem' }} />
      </div>
      <p className="text-2xl font-heading font-bold text-foreground leading-none">
        {value}
        {unit && <span className="text-sm font-body text-muted-foreground ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

export default function LiveStats({ progressEntries = [], programs = [], profile }) {
  // Stats semaine
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekEntries = progressEntries.filter(e => new Date(e.date) >= weekAgo);
  const weekWorkouts = weekEntries.filter(e => e.workout_completed).length;

  // Progression poids
  const latest = progressEntries[0];
  const oldest = progressEntries[progressEntries.length - 1];
  const weightDelta = latest && oldest && latest.id !== oldest.id
    ? (latest.weight_kg - oldest.weight_kg).toFixed(1)
    : null;

  // Séances totales
  const totalSessions = programs.reduce((acc, p) => acc + (p.sessions_done || 0), 0);

  // Objectif du jour
  const todayDone = progressEntries[0]?.date === new Date().toISOString().split('T')[0] && progressEntries[0]?.workout_completed;

  return (
    <div>
      <h2 className="font-heading text-sm tracking-widest text-muted-foreground mb-3 uppercase">Statistiques live</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Flame}
          label="Séances cette semaine"
          value={weekWorkouts}
          unit={`/ ${profile?.available_days || 3}`}
          color="bg-orange-50 text-orange-500"
          delay={0}
        />
        <StatCard
          icon={Dumbbell}
          label="Séances complétées"
          value={totalSessions}
          color="bg-green-50 text-green-600"
          delay={0.05}
        />
        <StatCard
          icon={TrendingDown}
          label="Évolution poids"
          value={weightDelta !== null ? (weightDelta > 0 ? `+${weightDelta}` : weightDelta) : '--'}
          unit={weightDelta !== null ? 'kg' : ''}
          color="bg-purple-50 text-purple-600"
          delay={0.1}
        />
        <StatCard
          icon={Calendar}
          label="Objectif du jour"
          value={todayDone ? '✓' : '--'}
          color={todayDone ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"}
          delay={0.15}
        />
      </div>
    </div>
  );
}