import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Scale, TrendingUp, Calendar } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export default function DarkStatsRow({ progressEntries = [], programs = [], profile }) {
  const { language } = useTheme();
  const isFR = language === 'fr';
  const last7 = progressEntries.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) <= 7;
  });
  const workoutsThisWeek = last7.filter(e => e.workout_completed).length;

  const weights = progressEntries.filter(e => e.weight_kg).map(e => e.weight_kg);
  const currentWeight = weights[0] || profile?.weight_kg || 0;
  const prevWeight = weights[1] || currentWeight;
  const weightDiff = currentWeight - prevWeight;

  const activeProgram = programs.find(p => p.is_active && !p.completed);
  const totalSessions = activeProgram?.total_sessions || 1;
  const sessionsDone = activeProgram?.sessions_done || 0;
  const programPct = Math.round((sessionsDone / totalSessions) * 100);

  const stats = [
    {
      icon: Dumbbell, label: isFR ? 'Séances/sem' : 'Sessions/wk', value: workoutsThisWeek,
      sub: `${isFR ? 'sur' : 'of'} ${profile?.available_days || 5}`,
      color: '#ffffff', bg: 'rgba(30,80,220,0.85)', border: 'rgba(60,110,255,0.6)',
    },
    {
      icon: Scale, label: isFR ? 'Poids' : 'Weight', value: currentWeight ? `${currentWeight}kg` : '—',
      sub: currentWeight && prevWeight !== currentWeight ? `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)}kg` : (isFR ? 'stable' : 'stable'),
      color: '#ffffff', bg: 'rgba(14,165,233,0.80)', border: 'rgba(56,189,248,0.5)',
    },
    {
      icon: TrendingUp, label: isFR ? 'Programme' : 'Program', value: `${programPct}%`,
      sub: activeProgram ? `${sessionsDone}/${totalSessions}` : (isFR ? 'Aucun actif' : 'No active'),
      color: '#ffffff', bg: 'rgba(124,58,237,0.78)', border: 'rgba(167,139,250,0.5)',
    },
    {
      icon: Calendar, label: 'Streak', value: `${profile?.streak_days || 0}${isFR ? 'j' : 'd'}`,
      sub: isFR ? 'consécutifs' : 'in a row', color: '#ffffff', bg: 'rgba(220,38,38,0.82)', border: 'rgba(248,113,113,0.5)',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-xl p-2.5 flex flex-col items-center text-center shadow-md"
          style={{ background: s.bg, border: `1px solid ${s.border}`, backdropFilter: 'blur(8px)', boxShadow: `0 4px 16px ${s.bg}88` }}
        >
          <div className="h-7 w-7 rounded-lg flex items-center justify-center mb-1.5"
            style={{ background: 'rgba(255,255,255,0.22)' }}>
            <s.icon className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="font-heading text-lg leading-none text-white">{s.value}</p>
          <p className="text-[9px] text-white/80 mt-0.5 leading-tight font-medium">{s.label}</p>
          <p className="text-[9px] text-white/60 leading-tight">{s.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}