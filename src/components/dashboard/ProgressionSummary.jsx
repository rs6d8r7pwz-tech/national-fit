import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Trophy, Dumbbell, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeContext';

// Progression VISIBLE pour les débutants : montre des preuves concrètes de
// progrès à partir des données déjà enregistrées en fin de séance
// (WorkoutSession, ExerciseLog). But : que l'utilisateur SENTE qu'il avance.

function maxOf(arr) {
  if (!Array.isArray(arr) || !arr.length) return 0;
  return arr.reduce((m, v) => (Number(v) > m ? Number(v) : m), 0);
}

export default function ProgressionSummary({ profile }) {
  const { language } = useTheme();
  const isFR = language === 'fr';

  const { data: sessions = [] } = useQuery({
    queryKey: ['workoutSessions'],
    queryFn: () => base44.entities.WorkoutSession.list('-date', 60),
    initialData: [],
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['exerciseLogs'],
    queryFn: () => base44.entities.ExerciseLog.list('-created_at', 300),
    initialData: [],
  });

  const sessionCount = sessions.length;
  if (sessionCount === 0) return null; // les tout nouveaux voient la 1re séance ailleurs

  const totalVolume = sessions.reduce((a, s) => a + (Number(s.total_volume_kg) || 0), 0);
  const totalSets = sessions.reduce((a, s) => a + (Number(s.total_sets) || 0), 0);

  // Progression par exercice : premier poids -> dernier poids (logs triés du + récent au + ancien)
  const byExercise = {};
  logs.forEach((l) => {
    const w = maxOf(l.weight_per_set);
    if (!w) return; // exos au poids du corps / chronométrés : pas de charge
    const name = l.exercise_name || '';
    if (!name) return;
    (byExercise[name] = byExercise[name] || []).push(w);
  });

  const progress = Object.entries(byExercise)
    .filter(([, ws]) => ws.length >= 2)
    .map(([name, ws]) => {
      const last = ws[0]; // + récent
      const first = ws[ws.length - 1]; // + ancien
      const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
      return { name, first, last, pct };
    })
    .filter((p) => p.last >= p.first)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  const T = {
    title: isFR ? 'TES PROGRÈS' : 'YOUR PROGRESS',
    sessions: isFR ? 'séances' : 'sessions',
    volume: isFR ? 'kg soulevés' : 'kg lifted',
    sets: isFR ? 'séries' : 'sets',
    youProgress: isFR ? 'Tu progresses sur :' : 'You are improving on:',
    keepGoing: isFR
      ? 'Continue : une séance de plus et tu verras ta première comparaison de charges ici.'
      : 'Keep going: one more session and your first strength comparison shows up here.',
    tip: isFR
      ? 'Quand une séance devient facile, ajoute une répétition ou un peu de poids — c’est exactement ça, progresser.'
      : 'When a session feels easy, add a rep or a little weight — that is exactly what progress is.',
    regularity: isFR
      ? 'Ta régularité, c’est déjà ta progression. Continue comme ça !'
      : 'Your consistency IS your progress. Keep it up!',
  };

  const fmtKg = (n) => (Number.isInteger(n) ? n : Math.round(n * 10) / 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-green-200 bg-white shadow-sm"
    >
      <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-gray-50">
        <div className="h-8 w-8 rounded-xl bg-green-100 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
        <p className="font-heading text-sm tracking-wider text-foreground">{T.title}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats de fond -- preuves de régularité */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-green-50 border border-green-100 px-2 py-2.5 text-center">
            <p className="text-xl font-bold text-green-700 leading-none">{sessionCount}</p>
            <p className="text-[10px] text-green-600 mt-1">{T.sessions}</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-2 py-2.5 text-center">
            <p className="text-xl font-bold text-blue-700 leading-none">{totalVolume > 0 ? fmtKg(totalVolume) : '—'}</p>
            <p className="text-[10px] text-blue-600 mt-1">{T.volume}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-2 py-2.5 text-center">
            <p className="text-xl font-bold text-slate-700 leading-none">{totalSets || '—'}</p>
            <p className="text-[10px] text-slate-500 mt-1">{T.sets}</p>
          </div>
        </div>

        {/* Progression par exercice */}
        {progress.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" /> {T.youProgress}
            </p>
            {progress.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Dumbbell className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <p className="text-xs font-medium text-slate-700 flex-1 min-w-0 truncate">{p.name}</p>
                <div className="flex items-center gap-1 shrink-0 text-xs">
                  <span className="text-slate-400">{fmtKg(p.first)}</span>
                  <ArrowRight className="h-3 w-3 text-slate-300" />
                  <span className="font-bold text-slate-800">{fmtKg(p.last)} kg</span>
                  {p.pct > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">+{p.pct}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : sessionCount < 2 ? (
          <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl px-3 py-2.5">{T.keepGoing}</p>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl px-3 py-2.5">{T.regularity}</p>
        )}

        <p className="text-[11px] text-slate-400 leading-relaxed border-t border-gray-50 pt-3">{T.tip}</p>
      </div>
    </motion.div>
  );
}
