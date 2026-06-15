import React from 'react';
import { motion } from 'framer-motion';
import { Target, Flame, CheckCircle2, Circle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HULK_LEVELS } from './XPRing';

function getLevel(xp) {
  let lvl = HULK_LEVELS[0];
  for (const l of HULK_LEVELS) { if (xp >= l.min) lvl = l; }
  return lvl;
}

function getNextLevel(xp) {
  for (const l of HULK_LEVELS) { if (xp < l.min) return l; }
  return null;
}

export default function DailyGoalWidget({ profile, progressEntries = [], programs = [] }) {
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = progressEntries.find(e => e.date === today);
  const todayDone = !!todayEntry?.workout_completed;

  const xp = profile?.xp_points || 0;
  const streak = profile?.streak_days || 0;
  const nextLevel = getNextLevel(xp);
  const currentLevel = getLevel(xp);
  const xpToNext = nextLevel ? nextLevel.min - xp : 0;

  const activeProgram = programs.find(p => p.is_active && !p.completed);
  const done = activeProgram?.sessions_done || 0;
  const total = activeProgram?.total_sessions || 1;
  const programPct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  const streakAtRisk = streak > 2 && !todayDone && new Date().getHours() >= 17;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-green-100 flex items-center justify-center">
            <Target className="h-4 w-4 text-green-600" />
          </div>
          <p className="font-heading text-sm tracking-wider text-foreground">OBJECTIF DU JOUR</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${todayDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {todayDone ? '✓ Complété' : 'En attente'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Daily workout goal */}
        <div className="flex items-center gap-3">
          {todayDone
            ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            : <Circle className="h-5 w-5 text-gray-300 shrink-0" />
          }
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {todayDone ? 'Séance du jour validée 💪' : 'Séance du jour à compléter'}
            </p>
            {activeProgram && (
              <p className="text-xs text-muted-foreground mt-0.5">{activeProgram.title}</p>
            )}
          </div>
          {!todayDone && activeProgram && (
            <Link
              to={`/seance?program=${activeProgram.id}&session=${done % (activeProgram.sessions?.length || 1)}`}
              className="shrink-0 text-xs bg-green-500 text-white px-3 py-1.5 rounded-full font-medium hover:bg-green-600 transition-colors"
            >
              Démarrer
            </Link>
          )}
        </div>

        {/* Streak reminder */}
        {streakAtRisk && (
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2"
          >
            <Flame className="h-4 w-4 text-orange-500 flame-pulse shrink-0" />
            <p className="text-xs text-orange-700 font-medium">
              Ne casse pas ta série de <strong>{streak} jours</strong> ! Il te reste quelques heures. 🔥
            </p>
          </motion.div>
        )}

        {/* Program progress */}
        {activeProgram && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground">Progression programme</p>
              <span className="text-xs font-medium text-foreground">{done}/{total} séances</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600"
                initial={{ width: 0 }}
                animate={{ width: `${programPct}%` }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Prochain milestone XP */}
        {nextLevel && (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
            <Zap className="h-4 w-4 text-purple-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-purple-700 truncate">
                <strong>{xpToNext} XP</strong> avant <strong>{nextLevel.emoji} {nextLevel.label}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}