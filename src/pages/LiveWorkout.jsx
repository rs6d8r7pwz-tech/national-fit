import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ExerciseVideoModal from '@/components/workout/ExerciseVideoModal';
import { useTheme } from '@/lib/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Timer, Dumbbell,
  Zap, X, SkipForward, Trophy, Star, ArrowLeftRight
} from 'lucide-react';
import PRDetector from '@/components/workout/PRDetector';
import PRCelebration from '@/components/workout/PRCelebration';
import AIWeightSuggestion from '@/components/workout/AIWeightSuggestion';
import ExerciseHistory from '@/components/workout/ExerciseHistory';
import PostWorkoutSummary from '@/components/workout/PostWorkoutSummary';
import { recordSession, recordSkipped, buildMemoryContext } from '@/lib/aiMemory';
import { playSound } from '@/lib/sounds';

// Détecte si un exercice est basé sur le temps (burpees/AMRAP/EMOM etc.)
// Exemples: reps="1min", "30sec", "60s", "AMRAP", "MAX", notes contenant "en 1 minute"
function isTimeBasedExercise(exercise) {
  const repsStr = String(exercise.reps || '').toLowerCase();
  const notesStr = String(exercise.notes || '').toLowerCase();
  const nameStr = String(exercise.name || '').toLowerCase();
  return (
    /\d+\s*(min|sec|s\b|minute|seconde)/.test(repsStr) ||
    /(amrap|emom|max|tabata|timed|temps|chrono)/.test(repsStr) ||
    /en \d+\s*(min|sec|minute)/.test(notesStr) ||
    /(burpee|jumping jack|mountain climber|planche|gainage|corde à sauter)/.test(nameStr) && /\d+\s*(min|sec|s\b)/.test(repsStr)
  );
}

// PR storage helpers
const PR_KEY = 'nationalfit_prs';
function getPRs() { try { return JSON.parse(localStorage.getItem(PR_KEY) || '{}'); } catch { return {}; } }
function setPR(name, reps) { const prs = getPRs(); prs[name] = reps; localStorage.setItem(PR_KEY, JSON.stringify(prs)); }
function checkPR(name, reps) {
  const prs = getPRs();
  const prev = prs[name];
  const current = parseInt(String(reps).split('-')[0]) || 0;
  const prevNum = parseInt(String(prev || '0').split('-')[0]) || 0;
  if (current > prevNum) { setPR(name, reps); return true; }
  return false;
}

// Intensity levels → background gradient (light)
function getBg(intensity) {
  if (intensity < 30) return 'from-[#eff6ff] to-[#ffffff]';
  if (intensity < 60) return 'from-[#f0fdf4] to-[#eff6ff]';
  if (intensity < 80) return 'from-[#fff7ed] to-[#eff6ff]';
  return 'from-[#fef2f2] to-[#fff7ed]';
}

const getFeedbackOptions = (isFR) => [
  { value: 'easy', label: isFR ? 'Trop facile 😎' : 'Too easy 😎', color: 'bg-blue-500', desc: isFR ? 'Volume augmenté' : 'Volume increased' },
  { value: 'normal', label: isFR ? 'Parfait 💪' : 'Perfect 💪', color: 'bg-green-500', desc: isFR ? 'Programme maintenu' : 'Program maintained' },
  { value: 'hard', label: isFR ? 'Difficile 🔥' : 'Hard 🔥', color: 'bg-orange-500', desc: isFR ? 'Volume réduit' : 'Volume reduced' },
];

const AI_TIPS_FR = [
  "💧 Hydrate-toi entre chaque série !",
  "🫁 Expire à l'effort, inspire en revenant.",
  "💪 Contracte le muscle ciblé à chaque répétition.",
  "🔥 La vitesse d'exécution détermine l'intensité.",
  "🧘 Reste concentré -- chaque rep compte.",
  "💪 Tu es plus fort que tu ne le crois.",
  "⏱️ Le repos est aussi important que l'effort.",
  "📈 Chaque séance, tu bats une version de toi.",
];

const AI_TIPS_EN = [
  "💧 Stay hydrated between sets!",
  "🫁 Exhale on effort, inhale on the way back.",
  "💪 Contract the target muscle every rep.",
  "🔥 Execution speed determines intensity.",
  "🧘 Stay focused -- every rep counts.",
  "💪 You're stronger than you think.",
  "⏱️ Rest is just as important as the effort.",
  "📈 Every session, you beat a previous version of yourself.",
];

// Annonce vocale via Web Speech API
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'fr-FR';
  utt.rate = 1.1;
  utt.volume = 0.9;
  window.speechSynthesis.speak(utt);
}

function RestTimer({ seconds, onComplete, isFR = true }) {
  const [remaining, setRemaining] = useState(seconds);
  const announcedRef = React.useRef(false);

  useEffect(() => {
    // Announce start
    if (!announcedRef.current) {
      announcedRef.current = true;
      speak(isFR ? `Repos. ${seconds} secondes.` : `Rest. ${seconds} seconds.`);
    }
  }, []);

  useEffect(() => {
    if (remaining <= 0) {
      playSound('timerEnd');
      speak(isFR ? 'Repos terminé ! C\'est parti !' : 'Rest over! Let\'s go!');
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      onComplete();
      return;
    }
    // Announce at 10s and 3s
    if (remaining === 10) speak(isFR ? 'Dix secondes.' : 'Ten seconds.');
    if (remaining === 3) {
      speak(isFR ? 'Trois, deux, un.' : 'Three, two, one.');
      if (navigator.vibrate) navigator.vibrate(100);
    }
    const t = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const isUrgent = remaining <= 5;

  return (
    <div className="flex flex-col items-center justify-center h-full py-10 space-y-6">
      <motion.div
        animate={{ scale: isUrgent ? [1, 1.05, 1] : 1 }}
        transition={{ repeat: isUrgent ? Infinity : 0, duration: 0.5 }}
      >
        <p className="text-muted-foreground font-medium text-center">⏱️ {isFR ? 'Repos' : 'Rest'}</p>
      </motion.div>
      <div className="relative h-40 w-40">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(30,80,220,0.12)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={isUrgent ? '#f87171' : '#4ade80'} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-heading font-bold ${isUrgent ? 'text-red-500' : 'text-blue-600'}`}>
            {remaining}
          </span>
          <span className="text-xs text-muted-foreground">{isFR ? 'secondes' : 'seconds'}</span>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onComplete} className="gap-2 text-muted-foreground">
        <SkipForward className="h-4 w-4" /> {isFR ? 'Passer' : 'Skip'}
      </Button>
    </div>
  );
}

function ExerciseView({ exercise, setIndex, totalSets, onSetDone, onSkip, tipIndex, intensity, weight, onWeightChange, onSwapVariant, isFR = true, AI_TIPS }) {
  const done = setIndex;
  const current = setIndex + 1;
  const prevPR = getPRs()[exercise.name];
  const isTimed = isTimeBasedExercise(exercise);

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b ${getBg(intensity)} transition-all duration-1000`}>
      {/* AI suggestion + history (only on first set) */}
      {setIndex === 0 && (
        <>
          <AIWeightSuggestion exerciseName={exercise.name} reps={exercise.reps} />
          <ExerciseHistory exerciseName={exercise.name} />
        </>
      )}
      {/* Exercise name */}
      <div className="text-center py-4 px-4">
        <motion.h2
          key={exercise.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-3xl tracking-wide leading-tight text-blue-800"
        >
          {exercise.name}
        </motion.h2>
        {exercise.muscle_group && (
          <p className="text-muted-foreground text-sm mt-1">{exercise.muscle_group}</p>
        )}
        {/* Previous PR */}
        {prevPR && (
          <div className="inline-flex items-center gap-1 mt-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full">
            <Star className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">{isFR ? 'Record' : 'Record'}: {prevPR} reps</span>
          </div>
        )}
        {exercise.notes && (
          <p className="text-xs text-slate-500 mt-2 italic bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
            {exercise.notes}
          </p>
        )}
        {/* Alternative */}
        {exercise.alternative && (
          <button
            onClick={() => onSwapVariant?.()}
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-all active:scale-95"
          >
            <ArrowLeftRight className="h-3 w-3" />
            {isFR ? 'Variante' : 'Variant'}: {exercise.alternative}
          </button>
        )}
      </div>

      {/* Sets tracker */}
      <div className="flex justify-center gap-3 px-4 mb-6">
        {Array.from({ length: totalSets }).map((_, i) => (
          <motion.div
            key={i}
            animate={i === done ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              i < done
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : i === done
                  ? 'bg-blue-50 border-2 border-blue-500 text-blue-600'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            {i < done ? '✓' : i + 1}
          </motion.div>
        ))}
      </div>

      {/* Reps display */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          key={`${exercise.name}-${setIndex}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-3"
        >
          <div className="text-8xl font-heading text-blue-600 leading-none" style={{ textShadow: '0 0 20px rgba(30,80,220,0.2)' }}>
            {exercise.reps}
          </div>
          <p className="text-muted-foreground text-lg">
            {isFR ? 'Série' : 'Set'} {current} / {totalSets}
          </p>
          {exercise.rest_seconds && (
            <p className="text-xs text-muted-foreground">{isFR ? 'Repos' : 'Rest'}: {exercise.rest_seconds}s</p>
          )}
          {isTimed ? (
            <div className="flex flex-col items-center gap-1.5 mt-3">
              <span className="text-xs text-orange-600 font-semibold uppercase tracking-wider">⏱️ {isFR ? 'Exercice chronométré' : 'Timed exercise'}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{isFR ? 'Reps réalisées :' : 'Reps done:'}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="ex: 15"
                  value={weight || ''}
                  onChange={e => onWeightChange(exercise.name, e.target.value)}
                  className="w-20 text-center text-sm font-bold border-2 border-orange-300 rounded-xl px-2 py-1 focus:outline-none focus:border-orange-500 bg-white"
                />
                <span className="text-xs text-slate-500">reps</span>
              </div>
              <p className="text-[10px] text-slate-400 italic">{isFR ? 'Compte tes répétitions pendant le temps imparti' : 'Count your reps during the allotted time'}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-slate-500">{isFR ? 'Poids :' : 'Weight:'}</span>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="kg"
                value={weight || ''}
                onChange={e => onWeightChange(exercise.name, e.target.value)}
                className="w-20 text-center text-sm font-bold border-2 border-blue-200 rounded-xl px-2 py-1 focus:outline-none focus:border-blue-500 bg-white"
              />
              <span className="text-xs text-slate-500">kg</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* AI tip */}
      <div className="mx-4 mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-medium">
        {AI_TIPS[tipIndex % AI_TIPS.length]}
      </div>

      {/* Actions */}
      <div className="px-4 pb-6 space-y-3">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            onClick={onSetDone}
            className="w-full h-16 text-lg font-heading tracking-wider text-white hulk-glow shadow-xl"
            style={{ background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(220,90%,42%))' }}
          >
            <CheckCircle2 className="h-6 w-6 mr-2" />
            {isFR ? `SÉRIE ${current} TERMINÉE !` : `SET ${current} DONE!`}
          </Button>
        </motion.div>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full text-muted-foreground text-sm gap-2"
        >
          <SkipForward className="h-4 w-4" /> {isFR ? 'Passer cet exercice' : 'Skip this exercise'}
        </Button>
      </div>
    </div>
  );
}

function SessionComplete({ sessionName, totalExercises, onFeedback, isFR = true, FEEDBACK_OPTIONS = [] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-10 px-6 text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="h-24 w-24 rounded-3xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl shadow-green-300/50"
      >
        <Trophy className="h-12 w-12 text-white" />
      </motion.div>
      <div>
        <h2 className="font-heading text-3xl text-blue-400 tracking-wider">{isFR ? 'BRAVO !' : 'GREAT JOB!'}</h2>
        <p className="text-foreground font-semibold mt-1">{sessionName} {isFR ? 'terminée' : 'completed'}</p>
        <p className="text-muted-foreground text-sm mt-1">{totalExercises} {isFR ? 'exercices' : 'exercises'} · XP +150</p>
      </div>
      <div className="w-full space-y-3 pt-4">
        <p className="font-semibold text-sm text-foreground">{isFR ? 'Comment était la séance ?' : 'How was the session?'}</p>
        {FEEDBACK_OPTIONS.map(f => (
          <motion.button
            key={f.value}
            whileTap={{ scale: 0.97 }}
            onClick={() => onFeedback(f.value)}
            className={`w-full p-4 rounded-2xl ${f.color} text-white font-semibold text-left flex items-center justify-between`}
          >
            <span>{f.label}</span>
            <span className="text-xs font-normal opacity-80">{f.desc}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default function LiveWorkout() {
  const { getThemePersonality, language } = useTheme();
  const isFR = language === 'fr';
  const FEEDBACK_OPTIONS = getFeedbackOptions(isFR);
  const AI_TIPS = isFR ? AI_TIPS_FR : AI_TIPS_EN;
  const themePersonality = getThemePersonality();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const programId = params.get('program');
  const sessionIdx = parseInt(params.get('session') || '0');

  const queryClient = useQueryClient();
  const [exIdx, setExIdx] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [resting, setResting] = useState(false);
  const [done, setDone] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);
  const [prExercise, setPrExercise] = useState(null);
  const [setsCompleted, setSetsCompleted] = useState(0);
  const [prCount, setPrCount] = useState(0);
  const [profile, setProfile] = useState(null);
  // Capture des poids par exercice: { [exerciseName]: weightKg }
  const [weights, setWeights] = useState({});
  const [videoExercise, setVideoExercise] = useState(null);

  useEffect(() => {
    base44.entities.UserProfile.list().then(p => setProfile(p?.[0] || null));
  }, []);

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list('-created_at'),
    initialData: [],
  });

  const program = programs.find(p => p.id === programId);
  const session = program?.sessions?.[sessionIdx];
  const exercises = session?.exercises || [];
  const currentEx = exercises[exIdx];
  const totalSets = currentEx?.sets || 3;
  const totalPossibleSets = exercises.reduce((a, e) => a + (e.sets || 3), 0);
  const intensity = Math.round((setsCompleted / Math.max(totalPossibleSets, 1)) * 100);

  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => i + 1), 20000);
    return () => clearInterval(t);
  }, []);

  const handleSetDone = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    playSound('setDone');
    setSetsCompleted(s => s + 1);

    // Check PR on last set of exercise
    if (setIndex + 1 >= totalSets && currentEx) {
      const isPR = checkPR(currentEx.name, currentEx.reps);
      if (isPR) {
        setPrExercise(currentEx.name);
        setPrCount(c => c + 1);
        playSound('xp');
      }
    }

    if (setIndex + 1 >= totalSets) {
      if (currentEx?.rest_seconds) { setResting(true); }
      else { nextExercise(); }
    } else {
      if (currentEx?.rest_seconds) { setResting(true); }
      else { setSetIndex(s => s + 1); }
    }
  };

  const handleRestComplete = () => {
    setResting(false);
    if (setIndex + 1 >= totalSets) { nextExercise(); }
    else { setSetIndex(s => s + 1); }
  };

  const nextExercise = (skipped = false) => {
    if (skipped && currentEx) recordSkipped(currentEx.name);
    if (exIdx + 1 >= exercises.length) { setDone(true); }
    else { setExIdx(e => e + 1); setSetIndex(0); }
  };

  const startTime = React.useRef(Date.now());

  const handleFeedback = async (feedback, xpGain = 150) => {
    if (!program) return;
    const newDone = (program.sessions_done || 0) + 1;
    const completed = newDone >= (program.total_sessions || 1);
    const today = new Date().toISOString().split('T')[0];
    const durationMin = Math.round((Date.now() - startTime.current) / 60000);

    // 1. Enregistrer WorkoutSession
    const difficultyMap = { easy: 'facile', normal: 'normal', hard: 'difficile' };
    const totalVolume = exercises.reduce((acc, ex) => {
      if (isTimeBasedExercise(ex)) return acc; // pas de volume kg pour les exos chronométrés
      const w = parseFloat(weights[ex.name] || 0);
      return acc + w * (ex.sets || 3) * (parseInt(String(ex.reps).split('-')[0]) || 10);
    }, 0);

    const session_record = await base44.entities.WorkoutSession.create({
      program_id: program.id,
      program_title: program.title,
      session_name: session.name,
      date: today,
      duration_min: durationMin,
      perceived_difficulty: difficultyMap[feedback] || 'normal',
      completed: true,
      total_sets: setsCompleted,
      total_volume_kg: Math.round(totalVolume),
      new_prs: prCount,
    });

    // 2. Enregistrer ExerciseLog pour chaque exercice avec un poids saisi
    const logPromises = exercises.map(ex => {
      const isTimed = isTimeBasedExercise(ex);
      const inputVal = parseFloat(weights[ex.name] || 0);
      if (!inputVal) return null;

      if (isTimed) {
        // Pour les exos chronométrés : on log les reps réalisées, pas le poids
        const repsArr = Array.from({ length: ex.sets || 3 }, () => inputVal);
        const isPR = checkPR(ex.name + '_timed_reps', inputVal);
        return base44.entities.ExerciseLog.create({
          session_id: session_record.id,
          exercise_name: ex.name,
          muscle_group: ex.muscle_group || '',
          sets_completed: ex.sets || 3,
          reps_per_set: repsArr,
          weight_per_set: Array.from({ length: ex.sets || 3 }, () => 0),
          rest_seconds: ex.rest_seconds || 60,
          is_pr: isPR,
          notes: `Chronométré -- ${ex.reps}`,
        });
      }

      // Exercice classique avec poids
      const w = inputVal;
      const repsNum = parseInt(String(ex.reps).split('-')[0]) || 10;
      const setsArr = Array.from({ length: ex.sets || 3 }, () => repsNum);
      const weightsArr = Array.from({ length: ex.sets || 3 }, () => w);
      const prevPRs = getPRs();
      const isPR = (prevPRs[ex.name + '_weight'] || 0) < w;
      if (isPR) {
        const prs = getPRs();
        prs[ex.name + '_weight'] = w;
        localStorage.setItem(PR_KEY, JSON.stringify(prs));
        const estimated1RM = Math.round(w * (1 + repsNum / 30) * 10) / 10;
        base44.entities.PersonalRecord.create({
          exercise_name: ex.name,
          max_weight_kg: w,
          max_reps: repsNum,
          estimated_1rm: estimated1RM,
          date: today,
          session_id: session_record.id,
        }).catch(() => {});
      }
      return base44.entities.ExerciseLog.create({
        session_id: session_record.id,
        exercise_name: ex.name,
        muscle_group: ex.muscle_group || '',
        sets_completed: ex.sets || 3,
        reps_per_set: setsArr,
        weight_per_set: weightsArr,
        rest_seconds: ex.rest_seconds || 60,
        is_pr: isPR,
        pr_weight: isPR ? w : undefined,
      });
    }).filter(Boolean);
    await Promise.all(logPromises);

    // 3. Progression IA -- analyse des 3 dernières séances
    const recentSessions = await base44.entities.WorkoutSession.filter({ program_id: program.id });
    const last3 = recentSessions.slice(-3);
    if (last3.length >= 3) {
      const allEasy = last3.every(s => s.perceived_difficulty === 'facile');
      const allHard = last3.every(s => s.perceived_difficulty === 'difficile');
      if ((allEasy || allHard) && program.sessions) {
        const newSessions = JSON.parse(JSON.stringify(program.sessions));
        newSessions.forEach(sess => {
          sess.exercises?.forEach(ex => {
            if (allEasy) {
              // +1 série si < 5 séries
              if ((ex.sets || 3) < 5) ex.sets = (ex.sets || 3) + 1;
            } else if (allHard) {
              // -1 série (deload) si > 2 séries
              if ((ex.sets || 3) > 2) ex.sets = (ex.sets || 3) - 1;
            }
          });
        });
        await base44.entities.WorkoutProgram.update(program.id, { sessions: newSessions });
      }
    }

    // 4. Mise à jour programme
    await base44.entities.WorkoutProgram.update(program.id, {
      sessions_done: newDone, completed, is_active: !completed,
    });

    // 5. XP + Streak
    const profiles = await base44.entities.UserProfile.list();
    const p = profiles?.[0];
    if (p) {
      const lastDate = p.last_workout_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastDate !== today) {
        let newStreak = p.streak_days || 0;
        newStreak = (lastDate === yesterday || !lastDate) ? newStreak + 1 : 1;
        const baseXP = setsCompleted * 10 + exercises.length * 5;
        const feedbackMultiplier = feedback === 'hard' ? 1.5 : feedback === 'normal' ? 1.2 : 1.0;
        const prBonus = prCount * 25;
        const streakBoost = Math.min(newStreak * 0.05, 0.5);
        const cappedXP = Math.min(Math.max(Math.round((baseXP * feedbackMultiplier + prBonus) * (1 + streakBoost)), xpGain), 500);
        await base44.entities.UserProfile.update(p.id, {
          xp_points: (p.xp_points || 0) + cappedXP,
          last_workout_date: today,
          streak_days: newStreak,
        });
      }
    }

    playSound('success');
    recordSession({ exercises, feedback, weights, hour: new Date().getHours() });
    queryClient.invalidateQueries({ queryKey: ['programs'] });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    navigate('/programmes');
  };

  if (!program || !session) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{isFR ? 'Programme introuvable' : 'Program not found'}</p>
          <Button onClick={() => navigate('/programmes')} className="mt-4 text-white hulk-glow shadow-lg" style={{ background: `hsl(${themePersonality.colors.primary})` }}>{isFR ? 'Retour' : 'Back'}</Button>
        </div>
      </div>
    );
  }

  const progress = Math.round((exIdx / exercises.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#f8faff' }}>
      {/* PR Celebration */}
      <PRCelebration show={!!prExercise} exerciseName={prExercise} onClose={() => setPrExercise(null)} />
      {/* Exercise Video Modal */}
      <ExerciseVideoModal exerciseName={videoExercise} isOpen={!!videoExercise} onClose={() => setVideoExercise(null)} isFR={isFR} />

      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-blue-100" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(30,80,220,0.08)' }}>
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/programmes')} className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <X className="h-4 w-4 text-blue-600" />
          </button>
          <div className="text-center">
            <p className="font-heading text-sm text-blue-700 tracking-wider">{session.name}</p>
            <p className="text-xs text-slate-500">{session.day}</p>
          </div>
          {/* Video tutorial button */}
          {currentEx && !done && !resting && (
            <button
              onClick={() => setVideoExercise(currentEx?.name)}
              className="h-9 px-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-1.5 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
            >
              ▶ {isFR ? 'Tuto' : 'Video'}
            </button>
          )}
          <div className="text-right">
            <p className="text-xs font-semibold text-foreground">{exIdx + 1}/{exercises.length}</p>
            <p className="text-xs text-muted-foreground">exercices</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(220,90%,50%), hsl(220,90%,65%))' }}
            animate={{ width: `${done ? 100 : progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Exercise nav pills */}
      {!done && !resting && (
        <div className="shrink-0 flex gap-1.5 px-4 py-2 overflow-x-auto">
          {exercises.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setExIdx(i); setSetIndex(0); setResting(false); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === exIdx ? 'bg-blue-600 text-white' : i < exIdx ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {i < exIdx ? '✓ ' : ''}{ex.name.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
              <PostWorkoutSummary
                sessionName={session.name}
                exercises={exercises}
                setsCompleted={setsCompleted}
                prCount={prCount}
                profile={profile}
                onFeedback={handleFeedback}
                weights={weights}
                isFR={isFR}
              />
            </motion.div>
          ) : resting ? (
            <motion.div key="rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
              <RestTimer seconds={currentEx?.rest_seconds || 60} onComplete={handleRestComplete} isFR={isFR} />
            </motion.div>
          ) : (
            <motion.div key={exIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="h-full">
              {currentEx && (
                <ExerciseView
                  exercise={currentEx}
                  setIndex={setIndex}
                  totalSets={totalSets}
                  onSetDone={handleSetDone}
                  onSkip={nextExercise}
                  tipIndex={tipIdx}
                  intensity={intensity}
                  weight={weights[currentEx?.name]}
                  onWeightChange={(name, val) => setWeights(w => ({ ...w, [name]: val }))}
                  isFR={isFR}
                  AI_TIPS={AI_TIPS}
                  onSwapVariant={() => {
                    if (!currentEx?.alternative) return;
                    const updExercises = [...exercises];
                    const ex = { ...updExercises[exIdx] };
                    const tmp = ex.name;
                    ex.name = ex.alternative;
                    ex.alternative = tmp;
                    // Update in program via API (fire & forget)
                    const newSessions = JSON.parse(JSON.stringify(program.sessions));
                    newSessions[sessionIdx].exercises[exIdx] = ex;
                    base44.entities.WorkoutProgram.update(program.id, { sessions: newSessions });
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      {!done && !resting && (
        <div className="shrink-0 px-4 pb-4 pt-3 border-t border-blue-100 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.97)' }}>
          <Button variant="ghost" size="sm"
            onClick={() => { if (exIdx > 0) { setExIdx(e => e - 1); setSetIndex(0); } }}
            disabled={exIdx === 0} className="gap-1 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> {isFR ? 'Préc.' : 'Prev.'}
          </Button>
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${intensity > 70 ? 'bg-red-400' : intensity > 40 ? 'bg-orange-400' : 'bg-green-400'} animate-pulse`} />
            <span className="text-xs text-muted-foreground font-medium">{intensity}% {isFR ? 'intensité' : 'intensity'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { if (exIdx < exercises.length - 1) { setExIdx(e => e + 1); setSetIndex(0); } }} className="gap-1 text-muted-foreground">
            {isFR ? 'Suiv.' : 'Next'} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}