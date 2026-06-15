import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Dumbbell, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const levelLabels = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
const goalLabels = { perte_poids: 'Perte de poids', prise_muscle: 'Prise de muscle', endurance: 'Endurance', tonification: 'Tonification', bien_etre: 'Bien-être' };

export default function WorkoutCard({ program, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [marking, setMarking] = useState(false);

  const done = program.sessions_done || 0;
  const total = program.total_sessions || program.sessions?.length || 1;
  const pct = Math.min(100, Math.round((done / total) * 100));
  const isCompleted = done >= total;

  const markSessionDone = async () => {
    if (isCompleted || marking) return;
    setMarking(true);
    const newDone = done + 1;
    const completed = newDone >= total;
    await base44.entities.WorkoutProgram.update(program.id, {
      sessions_done: newDone,
      completed,
      is_active: !completed,
    });
    onUpdate?.();
    setMarking(false);
  };

  return (
    <Card className={`overflow-hidden transition-shadow duration-300 ${isCompleted ? 'opacity-70' : 'hover:shadow-lg'}`}>
      <div className="p-5">
        {isCompleted && (
          <div className="flex items-center gap-2 bg-accent/10 text-accent rounded-xl px-3 py-2 mb-3 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Programme terminé ! Bravo 🎉
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">{levelLabels[program.level] || program.level}</Badge>
              <Badge className="bg-primary/10 text-primary border-0 text-xs">{goalLabels[program.goal] || program.goal}</Badge>
              {program.exercise_preferences && Object.keys(program.exercise_preferences).length > 0 && (
                <Badge variant="outline" className="text-xs">Personnalisé</Badge>
              )}
            </div>
            <h3 className="font-heading font-bold text-lg text-foreground">{program.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
          </div>
          <div className="ml-4 text-right shrink-0">
            <div className="flex items-center gap-1 text-sm text-muted-foreground justify-end">
              <Dumbbell className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">{done}</span>
              <span>/ {total} séances</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progression</span>
            <span className={isCompleted ? 'text-accent font-semibold' : 'text-primary font-semibold'}>{pct}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isCompleted ? 'bg-accent' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              {expanded ? 'Masquer' : 'Voir les séances'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <Button
                size="sm"
                onClick={markSessionDone}
                disabled={marking}
                className="gap-1.5 bg-accent hover:bg-accent/90 text-white text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {marking ? 'Enregistrement...' : 'Séance faite ✓'}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(program.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-border p-5 space-y-4 bg-muted/30">
              {program.sessions?.map((session, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <h4 className="font-semibold text-sm">{session.day} -- {session.name}</h4>
                  </div>
                  <div className="ml-8 space-y-1.5">
                    {session.exercises?.map((ex, j) => (
                      <div key={j} className="flex items-center justify-between text-sm bg-card rounded-lg px-3 py-2">
                        <span className="text-foreground font-medium">{ex.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {ex.sets}×{ex.reps} {ex.rest_seconds ? `• ${ex.rest_seconds}s repos` : ''}
                        </span>
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
  );
}