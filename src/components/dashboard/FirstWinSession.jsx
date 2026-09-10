import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Check, Sparkles, Trophy, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeContext';
import { playSound } from '@/lib/sounds';

// Première victoire en 5 min : une mini-séance guidée sans matériel, montrée
// UNIQUEMENT aux tout nouveaux utilisateurs (0 séance faite). Objectif :
// complétion garantie en quelques minutes -> 1er streak, 1er XP, 1re célébration.

const DONE_KEY = 'nationalfit_firstwin_done';

const MOVES_FR = [
  { name: '10 squats lents', tip: 'Assieds-toi comme sur une chaise, dos droit, talons au sol.', emoji: '🦵' },
  { name: '5 à 8 pompes', tip: 'Sur les genoux si besoin, c’est parfait pour démarrer.', emoji: '💪' },
  { name: '20 secondes de gainage', tip: 'Sur les avant-bras, corps aligné, respire calmement.', emoji: '🔥' },
];
const MOVES_EN = [
  { name: '10 slow squats', tip: 'Sit back like onto a chair, straight back, heels down.', emoji: '🦵' },
  { name: '5 to 8 push-ups', tip: 'On your knees if needed — perfect to start.', emoji: '💪' },
  { name: '20 seconds plank', tip: 'On your forearms, body aligned, breathe calmly.', emoji: '🔥' },
];

function fireConfetti() {
  try {
    if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
    const shots = [
      { spread: 70, origin: { y: 0.6 } },
      { spread: 100, origin: { x: 0.2, y: 0.6 } },
      { spread: 100, origin: { x: 0.8, y: 0.6 } },
    ];
    shots.forEach((s, i) => setTimeout(() => confetti({
      particleCount: 70,
      colors: ['#1e50dc', '#ffffff', '#e11d2a'],
      ...s,
    }), i * 180));
  } catch {}
}

export default function FirstWinSession({ profile, onComplete }) {
  const { language } = useTheme();
  const isFR = language === 'fr';
  const queryClient = useQueryClient();
  const moves = isFR ? MOVES_FR : MOVES_EN;

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const alreadyDone = (() => { try { return !!localStorage.getItem(DONE_KEY); } catch { return false; } })();

  // Ne s'affiche qu'aux utilisateurs qui n'ont encore jamais fait de séance.
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['workoutSessions'],
    queryFn: () => base44.entities.WorkoutSession.list('-date', 5),
    initialData: [],
  });

  if (!profile || alreadyDone || isLoading) return null;
  if (sessions.length > 0 && !finished) return null;

  const finish = async () => {
    setSaving(true);
    fireConfetti();
    try { playSound('success'); } catch {}
    const today = new Date().toISOString().split('T')[0];
    try {
      await base44.entities.WorkoutSession.create({
        program_title: isFR ? 'Séance découverte' : 'Discovery session',
        session_name: isFR ? 'Ma première séance' : 'My first session',
        date: today,
        duration_min: 5,
        perceived_difficulty: 'facile',
        completed: true,
        total_sets: 3,
        total_volume_kg: 0,
        new_prs: 0,
      });
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (profile.last_workout_date !== today) {
        const prev = profile.streak_days || 0;
        const newStreak = (profile.last_workout_date === yesterday || !profile.last_workout_date) ? prev + 1 : 1;
        await base44.entities.UserProfile.update(profile.id, {
          xp_points: (profile.xp_points || 0) + 40,
          last_workout_date: today,
          streak_days: newStreak,
        });
      }
    } catch {}
    try { localStorage.setItem(DONE_KEY, '1'); } catch {}
    setFinished(true);
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ['workoutSessions'] });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    queryClient.invalidateQueries({ queryKey: ['progress'] });
    onComplete?.();
  };

  const handleNext = () => {
    try { if (navigator.vibrate) navigator.vibrate(40); } catch {}
    if (step < moves.length - 1) setStep((s) => s + 1);
    else finish();
  };

  // Écran de félicitations
  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-5 text-center text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1e50dc 0%, #3b82f6 55%, #e11d2a 100%)' }}
      >
        <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-2">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <p className="font-bold text-lg">{isFR ? 'Bravo, première séance validée ! 🎉' : 'Well done — first session done! 🎉'}</p>
        <p className="text-sm text-white/90 mt-1">
          {isFR
            ? 'Ton aventure commence. Reviens demain pour garder ta série 🔥'
            : 'Your journey starts now. Come back tomorrow to keep your streak 🔥'}
        </p>
      </motion.div>
    );
  }

  // Carte d'invitation (avant démarrage)
  if (!started) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1e50dc 0%, #2563eb 60%, #e11d2a 130%)' }}
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <p className="text-[11px] uppercase tracking-wider font-semibold text-white/80">
              {isFR ? 'Pour bien démarrer' : 'To get started'}
            </p>
          </div>
          <p className="font-bold text-xl leading-tight">{isFR ? 'Ta première victoire en 5 minutes' : 'Your first win in 5 minutes'}</p>
          <p className="text-sm text-white/90 mt-1.5 leading-relaxed">
            {isFR
              ? 'Trois mouvements simples, sans matériel. Fais-les à ton rythme et décroche ta première série 🔥'
              : 'Three simple moves, no equipment. Go at your own pace and start your streak 🔥'}
          </p>

          <div className="mt-3 space-y-1.5">
            {moves.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/90">
                <span className="text-base">{m.emoji}</span>
                <span>{m.name}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStarted(true)}
            className="mt-4 w-full bg-white text-blue-700 font-bold rounded-xl py-3 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
          >
            <Play className="h-4 w-4" />
            {isFR ? 'Commencer (5 min)' : 'Start (5 min)'}
          </button>
        </div>
      </motion.div>
    );
  }

  // Déroulé guidé, un mouvement à la fois
  const m = moves[step];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-blue-200 bg-white shadow-md"
    >
      <div className="flex gap-1.5 px-4 pt-4 justify-center">
        {moves.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-blue-500 w-8' : 'bg-blue-100 w-4'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="px-5 py-6 text-center"
        >
          <p className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold">
            {isFR ? 'Mouvement' : 'Move'} {step + 1}/{moves.length}
          </p>
          <div className="text-4xl my-2">{m.emoji}</div>
          <p className="font-bold text-lg text-slate-800">{m.name}</p>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">{m.tip}</p>

          <button
            onClick={handleNext}
            disabled={saving}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {step < moves.length - 1
              ? (isFR ? 'Fait ! Suivant' : 'Done! Next')
              : (isFR ? 'Terminer ma séance' : 'Finish my session')}
            {step < moves.length - 1 && <ChevronRight className="h-4 w-4" />}
          </button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
