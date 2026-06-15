import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X } from 'lucide-react';

const MILESTONES = [
  { days: 7,   label: '7 jours', emoji: '🔥', xp: 100, msg: 'Une semaine parfaite !',    color: 'from-orange-400 to-red-500' },
  { days: 30,  label: '1 mois',  emoji: '💥', xp: 500, msg: 'Un mois de domination !',   color: 'from-green-400 to-green-600' },
  { days: 100, label: '100 jours',emoji: '⚡', xp: 1500,msg: '100 jours — Titan Form !',  color: 'from-purple-400 to-purple-700' },
  { days: 365, label: '1 an',    emoji: '♾️', xp: 5000,msg: 'Immortal Hulk activé !',    color: 'from-yellow-400 to-orange-500' },
];

const CACHE_KEY = 'hulkfit_last_milestone';

export default function StreakMilestone({ streak = 0, onXpGain }) {
  const [milestone, setMilestone] = useState(null);

  useEffect(() => {
    const lastShown = parseInt(localStorage.getItem(CACHE_KEY) || '0');
    const hit = [...MILESTONES].reverse().find(m => streak >= m.days && lastShown < m.days);
    if (hit) {
      setMilestone(hit);
      localStorage.setItem(CACHE_KEY, String(hit.days));
      if (onXpGain) onXpGain(hit.xp);
      // Vibration
      if (navigator.vibrate) navigator.vibrate([100, 50, 200, 50, 300]);
    }
  }, [streak]);

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: -40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
          onClick={() => setMilestone(null)}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-w-sm rounded-3xl bg-gradient-to-br ${milestone.color} p-8 text-white text-center shadow-2xl`}
          >
            <button onClick={() => setMilestone(null)} className="absolute top-4 right-4 opacity-70 hover:opacity-100">
              <X className="h-5 w-5" />
            </button>
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8, repeat: 2 }}
              className="text-7xl mb-3"
            >
              {milestone.emoji}
            </motion.div>
            <h2 className="font-heading text-4xl tracking-widest mb-1">MILESTONE !</h2>
            <p className="font-heading text-2xl tracking-wider opacity-90">{milestone.label}</p>
            <p className="mt-2 text-white/80 text-sm">{milestone.msg}</p>
            <div className="mt-4 bg-white/20 rounded-2xl px-4 py-3 flex items-center justify-center gap-2">
              <Flame className="h-5 w-5" />
              <span className="font-heading text-xl">+{milestone.xp} XP</span>
            </div>
            <p className="mt-4 text-xs text-white/60">{streak} jours consécutifs 🔥</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}