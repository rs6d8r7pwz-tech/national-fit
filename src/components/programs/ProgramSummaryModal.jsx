import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Dumbbell, Target, Calendar, Zap, Activity } from 'lucide-react';

export default function ProgramSummaryModal({ program, profile, aiSummary, muscleFocusSummary, onConfirm, onModify, onClose }) {
  if (!program) return null;

  const totalEx = program.sessions?.reduce((acc, s) => acc + (s.exercises?.length || 0), 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4 pb-20"
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
        style={{ background: '#fff', border: '1px solid rgba(30,80,220,0.15)' }}
      >
        {/* Header */}
        <div className="sticky top-0 p-5 rounded-t-3xl" style={{ background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(220,90%,42%))' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl text-white tracking-wider">RÉSUMÉ DU PROGRAMME</h2>
              <p className="text-blue-100 text-sm mt-1">{program.title}</p>
            </div>
            <button onClick={onClose} className="h-8 w-8 bg-white/20 rounded-xl flex items-center justify-center">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Calendar, label: 'Séances', value: program.total_sessions || 0 },
              { icon: Dumbbell, label: 'Exercices', value: totalEx },
              { icon: Target, label: 'Objectif', value: profile?.goal?.replace('_', ' ') || '--' },
            ].map(({ icon: IconComp, label, value }) => (
              <div key={label} className="rounded-2xl p-3 text-center bg-blue-50 border border-blue-100">
                <IconComp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="font-bold text-slate-800 text-sm">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Description IA */}
          {aiSummary && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <p className="font-semibold text-sm text-blue-700">Analyse IA -- Pourquoi ce programme ?</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{aiSummary}</p>
            </div>
          )}

          {/* Résumé des zones musculaires ciblées */}
          {muscleFocusSummary && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <p className="font-semibold text-sm text-orange-600">🎯 Zones musculaires ciblées</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{muscleFocusSummary}</p>
            </div>
          )}

          {/* Aperçu sessions */}
          <div>
            <p className="font-semibold text-sm text-slate-700 mb-3">Structure du programme :</p>
            <div className="space-y-2">
              {program.sessions?.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-50 border border-slate-100">
                  <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800">{s.day} -- {s.name}</p>
                    <p className="text-xs text-slate-500">{s.exercises?.length || 0} exercices</p>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end max-w-[120px]">
                    {s.exercises?.slice(0, 2).map((ex, j) => (
                      <span key={j} className="text-xs rounded-full px-2 py-0.5 text-blue-700 bg-blue-50 border border-blue-200 truncate max-w-[80px]">
                        {ex.name.split(' ')[0]}
                      </span>
                    ))}
                    {(s.exercises?.length || 0) > 2 && (
                      <span className="text-xs text-slate-400">+{s.exercises.length - 2}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onModify}
              className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 gap-2"
            >
              ✏️ Modifier
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 text-white hulk-glow gap-2 font-heading tracking-wider"
              style={{ background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(220,90%,42%))' }}
            >
              <CheckCircle2 className="h-4 w-4" />
              VALIDER !
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}