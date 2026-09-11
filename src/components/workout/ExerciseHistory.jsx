import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Historique réel d'un exercice : lit les ExerciseLog (Supabase) de l'utilisateur
// et montre la dernière charge x reps — repère de progression pour le débutant.
export default function ExerciseHistory({ exerciseName }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!exerciseName) return;
    let cancelled = false;
    (async () => {
      try {
        const logs = await base44.entities.ExerciseLog.filter({ exercise_name: exerciseName });
        const rows = (logs || [])
          .filter(l => Array.isArray(l.weight_per_set) && l.weight_per_set.some(w => Number(w) > 0))
          .sort((a, b) => new Date(b.created_at || b.created_date || 0) - new Date(a.created_at || a.created_date || 0))
          .slice(0, 3)
          .map(l => ({
            weight: Math.max(...l.weight_per_set.map(Number)),
            reps: (Array.isArray(l.reps_per_set) && l.reps_per_set[0]) || 0,
            date: l.created_at || l.created_date,
            isPr: !!l.is_pr,
          }));
        if (!cancelled) setHistory(rows);
      } catch {
        if (!cancelled) setHistory([]);
      }
    })();
    return () => { cancelled = true; };
  }, [exerciseName]);

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
        <span className="text-xs text-muted-foreground font-medium">Dernière fois</span>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {history.map((h, i) => (
          <div key={i} className="shrink-0 bg-gray-50 rounded-lg px-2.5 py-1.5 text-center min-w-[64px]">
            <p className="text-xs text-muted-foreground">
              {h.date ? new Date(h.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {h.weight} kg{h.isPr ? ' 🏆' : ''}
            </p>
            <p className="text-[10px] text-muted-foreground">× {h.reps}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
