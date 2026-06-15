import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export default function ProgramEditor({ program, onSave, onClose }) {
  const [sessions, setSessions] = useState(
    program.sessions?.map(s => ({
      ...s,
      exercises: s.exercises?.map(e => ({ ...e })) || [],
    })) || []
  );
  const [openSession, setOpenSession] = useState(0);

  const updateExercise = (si, ei, field, value) => {
    setSessions(prev => prev.map((s, i) =>
      i !== si ? s : {
        ...s,
        exercises: s.exercises.map((e, j) => j !== ei ? e : { ...e, [field]: value })
      }
    ));
  };

  const removeExercise = (si, ei) => {
    setSessions(prev => prev.map((s, i) =>
      i !== si ? s : { ...s, exercises: s.exercises.filter((_, j) => j !== ei) }
    ));
  };

  const addExercise = (si) => {
    setSessions(prev => prev.map((s, i) =>
      i !== si ? s : {
        ...s,
        exercises: [...s.exercises, { name: '', sets: 3, reps: '10', rest_seconds: 60, notes: '', muscle_group: '' }]
      }
    ));
  };

  const updateSession = (si, field, value) => {
    setSessions(prev => prev.map((s, i) => i !== si ? s : { ...s, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#0a0e17' }}
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-white/[0.08] flex items-center justify-between"
        style={{ background: 'rgba(13,18,32,0.98)' }}>
        <div>
          <h2 className="font-heading text-xl text-green-400 tracking-wider">EDIT PROGRAM / MODIFIER LE PROGRAMME</h2>
          <p className="text-xs text-muted-foreground">{program.title}</p>
        </div>
        <button onClick={onClose} className="h-8 w-8 rounded-xl bg-white/[0.08] flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sessions.map((session, si) => (
          <div key={si} className="rounded-2xl border border-white/[0.08] overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            {/* Session header */}
            <button
              onClick={() => setOpenSession(openSession === si ? -1 : si)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="text-left">
                <input
                  value={session.name}
                  onChange={e => { e.stopPropagation(); updateSession(si, 'name', e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  className="font-semibold text-sm text-foreground bg-transparent border-none outline-none w-full"
                  placeholder="Session name / Nom de la séance"
                />
                <p className="text-xs text-muted-foreground">{session.day} · {session.exercises.length} exercices</p>
              </div>
              {openSession === si ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            {/* Exercises */}
            {openSession === si && (
              <div className="px-4 pb-4 space-y-3">
                {session.exercises.map((ex, ei) => (
                  <div key={ei} className="rounded-xl p-3 space-y-2 border border-white/[0.06]"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-2">
                      <input
                        value={ex.name}
                        onChange={e => updateExercise(si, ei, 'name', e.target.value)}
                        className="flex-1 text-sm font-semibold bg-transparent border-b border-white/[0.12] pb-1 text-foreground placeholder:text-muted-foreground outline-none"
                        placeholder="Nom de l'exercice"
                      />
                      <button onClick={() => removeExercise(si, ei)} className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Sets</p>
                        <input
                          type="number"
                          value={ex.sets}
                          onChange={e => updateExercise(si, ei, 'sets', parseInt(e.target.value) || 3)}
                          className="w-full text-xs text-center rounded-lg px-2 py-1.5 text-foreground outline-none border border-white/[0.1]"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                          min={1} max={10}
                        />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Reps</p>

                        <input
                          value={ex.reps}
                          onChange={e => updateExercise(si, ei, 'reps', e.target.value)}
                          className="w-full text-xs text-center rounded-lg px-2 py-1.5 text-foreground outline-none border border-white/[0.1]"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                          placeholder="10-12"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Rest (s)</p>
                        <input
                          type="number"
                          value={ex.rest_seconds}
                          onChange={e => updateExercise(si, ei, 'rest_seconds', parseInt(e.target.value) || 60)}
                          className="w-full text-xs text-center rounded-lg px-2 py-1.5 text-foreground outline-none border border-white/[0.1]"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                          min={0}
                        />
                      </div>
                    </div>
                    <input
                      value={ex.notes || ''}
                      onChange={e => updateExercise(si, ei, 'notes', e.target.value)}
                      className="w-full text-xs rounded-lg px-2 py-1.5 text-muted-foreground placeholder:text-muted-foreground/50 outline-none border border-white/[0.08]"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                      placeholder="Technical notes (optional)"
                    />
                  </div>
                ))}
                <button
                  onClick={() => addExercise(si)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/10 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add exercise
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="shrink-0 px-4 py-3 border-t border-white/[0.08]" style={{ background: 'rgba(13,18,32,0.98)' }}>
        <Button
          onClick={() => onSave({ ...program, sessions })}
          className="w-full h-12 font-heading tracking-wider bg-green-500 hover:bg-green-400 text-black hulk-glow"
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          SAVE CHANGES
        </Button>
      </div>
    </motion.div>
  );
}