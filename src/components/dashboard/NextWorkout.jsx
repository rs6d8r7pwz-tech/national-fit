import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NextWorkout({ programs = [] }) {
  const activeProgram = programs.find(p => p.is_active && !p.completed);
  if (!activeProgram) return null;

  const done = activeProgram.sessions_done || 0;
  const total = activeProgram.total_sessions || 1;
  const nextSession = activeProgram.sessions?.[done % (activeProgram.sessions?.length || 1)];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl border border-gray-200 p-4 card-hover shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-green-100 flex items-center justify-center">
            <Dumbbell className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Prochaine séance</p>
            <p className="font-semibold text-sm">{nextSession?.name || activeProgram.title}</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground bg-gray-100 rounded-full px-2 py-0.5">{done}/{total}</span>
      </div>

      {nextSession?.exercises && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {nextSession.exercises.slice(0, 3).map((ex, i) => (
            <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
              {ex.name}
            </span>
          ))}
          {nextSession.exercises.length > 3 && (
            <span className="text-xs text-muted-foreground px-1">+{nextSession.exercises.length - 3}</span>
          )}
        </div>
      )}

      <Link to={`/seance?program=${activeProgram.id}&session=${done % (activeProgram.sessions?.length || 1)}`}>
        <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white hulk-glow gap-2 font-heading tracking-wider">
          <Play className="h-3.5 w-3.5" /> DÉMARRER LA SÉANCE
        </Button>
      </Link>
    </motion.div>
  );
}