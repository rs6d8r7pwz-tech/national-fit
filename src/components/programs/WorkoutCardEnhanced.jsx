import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown, ChevronUp, Dumbbell, Trash2, CheckCircle2,
  Play, RefreshCw, Loader2, ArrowLeftRight, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import ProgramCompletedModal from '@/components/programs/ProgramCompletedModal';
import ProgramPDFExport from '@/components/programs/ProgramPDFExport';

const goalLabels = {
  seche: '🔥 Sèche', prise_masse: '💪 Masse', maintien: '⚖️ Maintien',
  force: '🏋️ Force', cardio: '🏃 Cardio',
};
const levelColors = {
  debutant: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  intermediaire: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  avance: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export default function WorkoutCardEnhanced({ program, onDelete, onUpdate, onToggleFavorite }) {
  const [expanded, setExpanded] = useState(false);
  const [marking, setMarking] = useState(false);
  const [swappingEx, setSwappingEx] = useState(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);

  const done = program.sessions_done || 0;
  const total = program.total_sessions || program.sessions?.length || 1;
  const pct = Math.min(100, Math.round((done / total) * 100));
  const isCompleted = done >= total;

  // Find current session index
  const currentSessionIdx = Math.min(done % (program.sessions?.length || 1), (program.sessions?.length || 1) - 1);

  const markSessionDone = async () => {
    if (isCompleted || marking) return;
    setMarking(true);
    const newDone = done + 1;
    const completed = newDone >= total;
    await base44.entities.WorkoutProgram.update(program.id, {
      sessions_done: newDone, completed, is_active: !completed,
    });
    onUpdate?.();
    setMarking(false);
    if (completed) setShowCompletedModal(true);
  };

  const swapExercise = async (sessionIdx, exIdx) => {
    const ex = program.sessions[sessionIdx].exercises[exIdx];
    if (!ex.alternative) return;

    setSwapLoading(true);
    setSwappingEx({ sessionIdx, exIdx });

    const sessions = JSON.parse(JSON.stringify(program.sessions));
    const exercise = sessions[sessionIdx].exercises[exIdx];

    const isCurrentlyAlt = exercise.chosen_variant === 'B';
    exercise.chosen_variant = isCurrentlyAlt ? 'A' : 'B';
    const tmp = exercise.name;
    exercise.name = exercise.alternative;
    exercise.alternative = tmp;

    await base44.entities.WorkoutProgram.update(program.id, { sessions });
    onUpdate?.();
    setSwapLoading(false);
    setSwappingEx(null);
  };

  const requestNewVariant = async (sessionIdx, exIdx) => {
    const ex = program.sessions[sessionIdx].exercises[exIdx];
    setSwapLoading(true);
    setSwappingEx({ sessionIdx, exIdx });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Donne-moi UN SEUL exercice alternatif à "${ex.name}" ciblant les mêmes muscles (${ex.muscle_group || 'même groupe'}). Réponds juste avec le nom de l'exercice, rien d'autre. Maximum 5 mots.`,
    });

    const sessions = JSON.parse(JSON.stringify(program.sessions));
    sessions[sessionIdx].exercises[exIdx].alternative = result.trim();

    await base44.entities.WorkoutProgram.update(program.id, { sessions });
    onUpdate?.();
    setSwapLoading(false);
    setSwappingEx(null);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    setFavorited(f => !f);
    if (favorited) return; // si déjà favori on toggle local seulement (pas de suppression depuis cette carte)
    onToggleFavorite?.({
      title: program.title,
      description: program.description || '',
      mode: program.mode || 'efficace',
      goal: program.goal || '',
      level: program.level || 'intermediaire',
      equipment: program.equipment || '',
      body_type_score: program.body_type_score || 5,
      total_sessions: program.total_sessions || 0,
      sessions_done: 0,
      exercise_preferences: program.exercise_preferences || {},
      weak_muscles: program.weak_muscles || [],
      sessions: program.sessions || [],
      is_active: false,
      completed: program.completed || false,
    });
  };

  return (
    <>
    {showCompletedModal && (
      <ProgramCompletedModal program={program} onClose={() => setShowCompletedModal(false)} />
    )}
    <Card className={`overflow-hidden transition-all duration-300 bg-card border-border ${isCompleted ? 'opacity-70' : 'hover:shadow-lg'}`}>
      <div className="p-5">
        {isCompleted && (
          <div className="flex items-center gap-2 bg-green-500/10 text-green-400 rounded-xl px-3 py-2 mb-3 text-sm font-semibold border border-green-500/30">
            <CheckCircle2 className="h-4 w-4" />
            Programme terminé ! Félicitations 🎉
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${levelColors[program.level] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                {program.level}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                {goalLabels[program.goal] || program.goal}
              </span>
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground leading-tight">{program.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
          </div>
          <div className="ml-4 text-right shrink-0">
            <p className="text-2xl font-heading font-bold text-green-400">{pct}%</p>
            <p className="text-xs text-muted-foreground">{done}/{total} séances</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : ''}`}
            style={!isCompleted ? { background: 'linear-gradient(90deg, hsl(220,90%,50%), hsl(220,90%,65%))' } : {}}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
          <Button
            variant="ghost" size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? 'Masquer' : 'Voir séances'}
          </Button>

          <div className="flex items-center gap-2">
            {!isCompleted && (
              <Link to={`/seance?program=${program.id}&session=${currentSessionIdx}`}>
                <Button size="sm" className="gap-1.5 bg-green-500 hover:bg-green-600 text-white shadow hulk-glow text-xs font-heading tracking-wider">
                  <Play className="h-3.5 w-3.5" /> DÉMARRER
                </Button>
              </Link>
            )}
            {!isCompleted && (
              <Button
                size="sm" variant="outline"
                onClick={markSessionDone}
                disabled={marking}
                className="gap-1.5 border-border text-foreground text-xs"
              >
                {marking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Séance faite
              </Button>
            )}
            <button
              onClick={handleToggleFavorite}
              className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                favorited 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <Star className={`h-4 w-4 ${favorited ? 'fill-primary' : ''}`} />
            </button>
            <ProgramPDFExport program={program} isFR={true} />
            <Button
              variant="ghost" size="sm"
              className="text-destructive hover:text-destructive hover:bg-red-50 p-2"
              onClick={() => onDelete(program.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded sessions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border bg-muted/30">
              {program.sessions?.map((session, si) => (
                <div key={si} className={`p-4 ${si < program.sessions.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      si < currentSessionIdx ? 'bg-primary text-primary-foreground' : si === currentSessionIdx ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {si < currentSessionIdx ? '✓' : si + 1}
                    </span>
                    <h4 className="font-semibold text-sm text-foreground">{session.day} -- {session.name}</h4>
                    {si === currentSessionIdx && !isCompleted && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium ml-auto border border-primary/30">Suivante</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {session.exercises?.map((ex, ei) => (
                      <div key={ei} className="bg-card rounded-xl border border-border px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{ex.name}</p>
                            {ex.alternative && (
                              <p className="text-xs text-muted-foreground truncate">
                                Alt: {ex.alternative}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {ex.sets}×{ex.reps}
                              {ex.rest_seconds ? ` · ${ex.rest_seconds}s` : ''}
                            </span>
                            {ex.alternative && (
                              <button
                                onClick={() => swapExercise(si, ei)}
                                disabled={swapLoading && swappingEx?.sessionIdx === si && swappingEx?.exIdx === ei}
                                className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                                title="Alterner exercice A/B"
                              >
                                {swapLoading && swappingEx?.sessionIdx === si && swappingEx?.exIdx === ei
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <ArrowLeftRight className="h-3 w-3" />
                                }
                              </button>
                            )}
                            <button
                              onClick={() => requestNewVariant(si, ei)}
                              disabled={swapLoading}
                              className="h-7 w-7 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                              title="Demander une nouvelle variante IA"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {ex.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{ex.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
    </>
  );
}