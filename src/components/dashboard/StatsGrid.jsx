import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Flame, Target, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const statConfig = [
  { label: 'Séances cette semaine', icon: Calendar, colorClass: 'text-accent', bgClass: 'bg-accent/15', border: 'border-accent/30' },
  { label: 'Calories brûlées', icon: Flame, colorClass: 'text-orange-400', bgClass: 'bg-orange-500/15', border: 'border-orange-500/30' },
  { label: 'Objectif atteint', icon: Target, colorClass: 'text-primary', bgClass: 'bg-primary/15', border: 'border-primary/30' },
  { label: 'Progression poids', icon: TrendingUp, colorClass: 'text-purple-400', bgClass: 'bg-purple-500/15', border: 'border-purple-500/30' },
];

export default function StatsGrid({ progressEntries = [], profile }) {
  const thisWeekEntries = progressEntries.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  const workoutsThisWeek = thisWeekEntries.filter(e => e.workout_completed).length;
  const targetDays = profile?.available_days || 3;
  const goalPct = targetDays > 0 ? Math.round((workoutsThisWeek / targetDays) * 100) : 0;

  const values = [
    String(workoutsThisWeek),
    String(workoutsThisWeek * 350),
    `${Math.min(goalPct, 100)}%`,
    progressEntries.length > 1
      ? `${(progressEntries[0]?.weight_kg - progressEntries[progressEntries.length - 1]?.weight_kg || 0).toFixed(1)} kg`
      : '--',
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className={`p-5 hover:shadow-lg transition-all duration-300 border ${stat.border} bg-card`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.bgClass} mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.colorClass}`} />
            </div>
            <p className={`text-2xl font-heading tracking-wider ${stat.colorClass}`}>{values[i]}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}