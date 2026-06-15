import React from 'react';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';

// Récupère l'historique local pour un exercice donné
function getExerciseHistory(name) {
  try {
    const mem = JSON.parse(localStorage.getItem('hulkfit_memory') || '{}');
    const sessions = mem.sessions || [];
    // Cherche les sessions qui contiennent cet exercice
    const found = sessions
      .filter(s => s.exercises?.some(e => e.toLowerCase().includes(name.toLowerCase().split(' ')[0])))
      .slice(-3)
      .reverse();
    return found;
  } catch { return []; }
}

export default function ExerciseHistory({ exerciseName }) {
  const history = getExerciseHistory(exerciseName);
  if (!history.length) return null;

  return (
    <motion.div
      key={exerciseName}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mx-4 mb-3 bg-white/80 border border-gray-200 rounded-xl px-3 py-2.5"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <History className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Historique récent</span>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {history.map((session, i) => {
          const label = session.feedback === 'easy' ? '😎' : session.feedback === 'hard' ? '🔥' : '💪';
          const date = session.date ? new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : `J-${(i + 1) * 7}`;
          return (
            <div key={i} className="shrink-0 bg-gray-50 rounded-lg px-2.5 py-1.5 text-center">
              <p className="text-xs text-muted-foreground">{date}</p>
              <p className="text-sm">{label}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}