import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { getMemory } from '@/lib/aiMemory';

// Génère une suggestion de charge basée sur la mémoire + PRs
function getSuggestion(exerciseName, reps) {
  const prs = (() => { try { return JSON.parse(localStorage.getItem('hulkfit_prs') || '{}'); } catch { return {}; } })();
  const mem = getMemory();
  const prevReps = prs[exerciseName];
  const repsNum = parseInt(String(reps).split('-')[0]) || 10;

  // Fatigue check
  const recentFatigue = mem.sessions?.slice(-3).map(s => s.feedback).filter(f => f === 'hard').length || 0;
  const isFatigued = recentFatigue >= 2;

  if (isFatigued) {
    return { text: 'Charge légère conseillée -- récupération en cours 🧘', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
  }
  if (prevReps) {
    const prevNum = parseInt(String(prevReps).split('-')[0]) || 0;
    if (repsNum > prevNum) return { text: `Objectif : dépasser ${prevReps} reps -- tu peux le faire ! 🔥`, color: 'text-green-700', bg: 'bg-green-50 border-green-200' };
    if (repsNum === prevNum) return { text: `Maintiens ta charge -- ou tente +2.5kg 💪`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' };
  }
  if (repsNum <= 6) return { text: 'Série lourde -- priorité sur la forme 🎯', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
  if (repsNum >= 15) return { text: 'Haute répétition -- charge modérée, focus contraction 🔥', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' };
  return { text: 'Charge standard -- vise l\'échec à la dernière rép ⚡', color: 'text-green-700', bg: 'bg-green-50 border-green-200' };
}

export default function AIWeightSuggestion({ exerciseName, reps }) {
  if (!exerciseName) return null;
  const suggestion = getSuggestion(exerciseName, reps);

  return (
    <motion.div
      key={exerciseName}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`flex items-start gap-2 mx-4 mb-3 px-3 py-2.5 rounded-xl border text-xs ${suggestion.bg}`}
    >
      <Zap className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${suggestion.color}`} />
      <p className={`font-medium leading-snug ${suggestion.color}`}>
        <span className="opacity-60 font-normal">Coach IA · </span>
        {suggestion.text}
      </p>
    </motion.div>
  );
}