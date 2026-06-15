import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

const CHALLENGE_CACHE_KEY = 'nationalfit_weekly_challenge';

const FALLBACK_CHALLENGES_FR = [
  { title: '5 séances cette semaine', xp: 300, target: 5, unit: 'séances' },
  { title: 'Augmente ta charge de 5%', xp: 200, target: 1, unit: 'exercice PR' },
  { title: '3 jours de streak', xp: 150, target: 3, unit: 'jours' },
];
const FALLBACK_CHALLENGES_EN = [
  { title: '5 sessions this week', xp: 300, target: 5, unit: 'sessions' },
  { title: 'Increase your load by 5%', xp: 200, target: 1, unit: 'PR exercise' },
  { title: '3-day streak', xp: 150, target: 3, unit: 'days' },
];

export default function WeeklyChallenge({ profile, progressEntries = [] }) {
  const [challenge, setChallenge] = useState(null);
  const { language } = useTheme();
  const isFR = language === 'fr';

  useEffect(() => {
    if (!profile) return;
    try {
      const cached = JSON.parse(localStorage.getItem(CHALLENGE_CACHE_KEY) || 'null');
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      if (cached && new Date(cached.ts) >= weekStart) {
        setChallenge(cached.data); return;
      }
    } catch {}
    const list = isFR ? FALLBACK_CHALLENGES_FR : FALLBACK_CHALLENGES_EN;
    const fb = list[Math.floor(Math.random() * list.length)];
    setChallenge(fb);
    try { localStorage.setItem(CHALLENGE_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: fb })); } catch {}
  }, [profile?.id]);

  if (!challenge) return null;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekWorkouts = progressEntries.filter(e =>
    e.workout_completed && new Date(e.date) >= weekStart
  ).length;
  const progress = Math.min(weekWorkouts / (challenge.target || 5), 1);
  const pct = Math.round(progress * 100);
  const done = pct >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-4"
      style={{
        background: done
          ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
          : 'linear-gradient(135deg, #eff6ff, #ffffff)',
        borderColor: done ? '#86efac' : '#bfdbfe',
        boxShadow: done ? '0 2px 12px rgba(22,163,74,0.10)' : '0 2px 12px rgba(30,80,220,0.08)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${done ? 'bg-green-100' : 'bg-blue-100'}`}>
            {done ? <Trophy className="h-4 w-4 text-green-600" /> : <Zap className="h-4 w-4 text-blue-600" />}
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-wider font-semibold ${done ? 'text-green-600' : 'text-blue-500'}`}>{isFR ? 'Défi de la semaine' : 'Weekly challenge'}</p>
            <p className="text-sm font-bold text-slate-800">{challenge.title}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${done ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          <Zap className="h-3 w-3" /> +{challenge.xp} XP
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{weekWorkouts} / {challenge.target} {challenge.unit}</span>
          <span className={done ? 'text-green-600 font-bold' : 'text-blue-700 font-semibold'}>{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <motion.div
            className="h-full rounded-full"
            style={{ background: done ? 'linear-gradient(90deg, #16a34a, #4ade80)' : 'linear-gradient(90deg, hsl(220,90%,50%), hsl(220,90%,65%))' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
      {done && (
        <p className="text-xs text-green-600 font-bold mt-2 text-center">🎉 {isFR ? 'Défi complété ! XP gagné' : 'Challenge completed! XP earned'}</p>
      )}
    </motion.div>
  );
}