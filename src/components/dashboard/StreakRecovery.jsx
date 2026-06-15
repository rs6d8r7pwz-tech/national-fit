import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeContext';

const RECOVERY_KEY = 'nfit_streak_recovery_used_week';

function getCurrentWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

export default function StreakRecovery({ profile, onRecovered }) {
  const { language } = useTheme();
  const isFR = language === 'fr';
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const weekKey = getCurrentWeekKey();
  const alreadyUsed = (() => { try { return localStorage.getItem(RECOVERY_KEY) === weekKey; } catch { return false; } })();

  // Show only if streak > 0 but last workout was 2+ days ago
  const streak = profile?.streak_days || 0;
  const lastWorkout = profile?.last_workout_date;
  if (!lastWorkout || streak === 0 || alreadyUsed || dismissed) return null;

  const daysSince = Math.floor((new Date() - new Date(lastWorkout)) / 86400000);
  if (daysSince < 2 || daysSince > 5) return null;

  const handleRecover = async () => {
    setLoading(true);
    try { localStorage.setItem(RECOVERY_KEY, weekKey); } catch {}
    await base44.entities.UserProfile.update(profile.id, {
      streak_days: streak,
      last_workout_date: new Date().toISOString().split('T')[0],
    });
    onRecovered?.();
    setDismissed(true);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative rounded-2xl p-4 border border-orange-200 bg-orange-50 flex items-center gap-4"
        >
          <div className="h-11 w-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-orange-800">
              {isFR ? `🔥 Streak en danger — ${streak} jours` : `🔥 Streak at risk — ${streak} days`}
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {isFR ? 'Utilise ton joker hebdomadaire pour le préserver (1x/semaine)' : 'Use your weekly joker to keep it (1x/week)'}
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleRecover}
            disabled={loading}
            className="gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs shrink-0"
          >
            <Zap className="h-3.5 w-3.5" />
            {isFR ? 'Joker !' : 'Joker!'}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 h-5 w-5 rounded-full bg-orange-200 flex items-center justify-center hover:bg-orange-300"
          >
            <X className="h-3 w-3 text-orange-600" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}