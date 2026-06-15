import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Plus, X, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const GOAL_TYPES = [
  // Poids / morpho
  { value: 'poids_cible',             label: '⚖️ Poids cible',              unit: 'kg' },
  { value: 'tour_de_taille',          label: '📏 Tour de taille',           unit: 'cm' },
  { value: 'masse_musculaire_pct',    label: '💪 Masse musculaire',         unit: '%' },
  // Poitrine
  { value: 'bench_press',             label: '🏋️ Développé couché barre',   unit: 'kg' },
  { value: 'developpe_couche_halteres', label: '🏋️ Développé couché haltères', unit: 'kg' },
  { value: 'developpe_incline',       label: '📐 Développé incliné',        unit: 'kg' },
  { value: 'dips',                    label: '🤸 Dips lestés',              unit: 'kg' },
  // Épaules / Dos
  { value: 'developpe_militaire',     label: '🎯 Développé militaire',      unit: 'kg' },
  { value: 'tirage_barre',            label: '🔝 Tirage barre',             unit: 'kg' },
  { value: 'rowing_barre',            label: '🚣 Rowing barre',             unit: 'kg' },
  { value: 'tractions',               label: '🏅 Tractions (reps)',         unit: 'reps' },
  // Bras
  { value: 'curl_biceps',             label: '💪 Curl biceps',              unit: 'kg' },
  { value: 'extension_triceps',       label: '🔱 Extension triceps',        unit: 'kg' },
  // Jambes
  { value: 'squat',                   label: '🦵 Squat',                    unit: 'kg' },
  { value: 'deadlift',                label: '💥 Soulevé de terre',         unit: 'kg' },
  { value: 'leg_press',               label: '🦿 Leg press',                unit: 'kg' },
  { value: 'fentes',                  label: '🚶 Fentes lestées',           unit: 'kg' },
  { value: 'hip_thrust',              label: '🍑 Hip thrust',               unit: 'kg' },
  // Cardio / régularité
  { value: 'cardio_km',               label: '🏃 Distance cardio',          unit: 'km' },
  { value: 'calories_brulees_semaine',label: '🔥 Calories brûlées/sem.',    unit: 'kcal' },
  { value: 'seances_semaine',         label: '📅 Séances/semaine',          unit: 'séances' },
  { value: 'streak_jours',            label: '🔥 Streak consécutif',        unit: 'jours' },
];

export default function UserGoalsWidget({ profile }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'poids_cible', target_value: '', current_value: '', deadline: '', motivation_why: '' });
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['userGoals'],
    queryFn: () => base44.entities.UserGoal.list('-created_at'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserGoal.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['userGoals'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserGoal.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userGoals'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserGoal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userGoals'] }),
  });

  const handleCreate = () => {
    const typeInfo = GOAL_TYPES.find(t => t.value === form.type);
    createMutation.mutate({
      ...form,
      target_value: Number(form.target_value),
      current_value: form.current_value ? Number(form.current_value) : undefined,
      label: typeInfo?.label || form.type,
      unit: typeInfo?.unit || '',
    });
  };

  const activeGoals = goals.filter(g => !g.completed);
  const doneGoals = goals.filter(g => g.completed);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/90 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Target className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-emerald-900">Mes Objectifs</p>
            <p className="text-xs text-slate-400">{activeGoals.length} en cours</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="h-7 w-7 p-0 rounded-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          <Plus className="h-3.5 w-3.5 text-white" />
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-emerald-100"
          >
            <div className="p-4 space-y-3 bg-emerald-50/50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-700">Nouvel objectif</p>
                <button onClick={() => setShowForm(false)}>
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="h-9 text-sm bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Valeur cible</p>
                  <Input type="number" placeholder="ex: 80" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} className="h-9 text-sm" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Valeur actuelle</p>
                  <Input type="number" placeholder="ex: 90" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Deadline</p>
                <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="h-9 text-sm" />
              </div>
              <Input placeholder="Pourquoi cet objectif ? (motivation)" value={form.motivation_why} onChange={e => setForm(f => ({ ...f, motivation_why: e.target.value }))} className="h-9 text-sm" />
              <Button
                onClick={handleCreate}
                disabled={!form.target_value || createMutation.isPending}
                className="w-full text-white h-9 text-sm"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                Ajouter l'objectif
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals list */}
      <div className="p-3 space-y-2">
        {activeGoals.length === 0 && !showForm && (
          <p className="text-xs text-slate-400 text-center py-3 italic">Aucun objectif — ajoute ton premier défi !</p>
        )}
        {activeGoals.map(goal => {
          const typeInfo = GOAL_TYPES.find(t => t.value === goal.type);
          const pct = goal.current_value && goal.target_value
            ? Math.min(100, Math.round(
                goal.type === 'poids_cible'
                  ? (1 - Math.abs(goal.current_value - goal.target_value) / Math.max(goal.current_value, 1)) * 100
                  : (goal.current_value / goal.target_value) * 100
              ))
            : 0;
          const daysLeft = goal.deadline
            ? Math.max(0, Math.ceil((new Date(goal.deadline) - new Date()) / 86400000))
            : null;

          return (
            <div key={goal.id} className="bg-white rounded-xl border border-emerald-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-800">{typeInfo?.label || goal.label}</p>
                <div className="flex items-center gap-1.5">
                  {daysLeft !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${daysLeft <= 7 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                      {daysLeft}j
                    </span>
                  )}
                  <button
                    onClick={() => updateMutation.mutate({ id: goal.id, data: { completed: true } })}
                    className="h-6 w-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100"
                  >
                    <Check className="h-3 w-3 text-emerald-600" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(goal.id)} className="h-6 w-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-red-50">
                    <X className="h-3 w-3 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {goal.current_value || '?'} → {goal.target_value} {typeInfo?.unit}
                </span>
              </div>
              {goal.motivation_why && (
                <p className="text-xs text-slate-400 mt-1.5 italic">"{goal.motivation_why}"</p>
              )}
            </div>
          );
        })}

        {doneGoals.length > 0 && (
          <p className="text-xs text-emerald-600 font-semibold text-center mt-1">
            🎉 {doneGoals.length} objectif{doneGoals.length > 1 ? 's' : ''} atteint{doneGoals.length > 1 ? 's' : ''} !
          </p>
        )}
      </div>
    </div>
  );
}