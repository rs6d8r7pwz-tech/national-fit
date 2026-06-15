import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Flame, ChevronRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { buildMemoryContext } from '@/lib/aiMemory';
import ReactMarkdown from 'react-markdown';
import WorkoutShareCard from '@/components/workout/WorkoutShareCard';

const FEEDBACK_OPTIONS = [
  { value: 'easy', label: 'Trop facile 😎', color: 'bg-blue-500', xp: 100 },
  { value: 'normal', label: 'Parfait 💪', color: 'bg-green-500', xp: 150 },
  { value: 'hard', label: 'Difficile 🔥', color: 'bg-orange-500', xp: 200 },
];

export default function PostWorkoutSummary({ sessionName, exercises, setsCompleted, prCount, profile, onFeedback, weights, isFR = true }) {
  const [aiSummary, setAiSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [earnedXP, setEarnedXP] = useState(150);

  useEffect(() => {
    generateSummary();
  }, []);

  const generateSummary = async () => {
    setLoadingAI(true);
    const memCtx = buildMemoryContext();
    const exNames = exercises.map(e => e.name).join(', ');
    const prompt = `Tu es le Professeur Hulk, coach IA de HULK FIT.
Profil: ${profile?.first_name || 'Athlète'}, objectif=${profile?.goal || 'fitness'}, streak=${profile?.streak_days || 0}j.
${memCtx}
Séance terminée: "${sessionName}" -- ${exercises.length} exercices (${exNames}).
${prCount > 0 ? `${prCount} NOUVEAU(X) RECORD(S) BATTU(S) !` : ''}
Génère un bilan post-séance motivant en 2-3 phrases max. Style coach MCU, en français. 
Inclus une observation personnalisée sur la progression.`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setAiSummary(res);
    } catch {
      setAiSummary(`Séance **${sessionName}** terminée avec brio ! ${prCount > 0 ? `${prCount} record battu 🏆` : ''} Tu progresses séance après séance -- continue à SMASH ! 💚`);
    }
    setLoadingAI(false);
  };

  // XP dynamique calculé ici aussi pour affichage (avec boost streak)
  const computeXP = (feedback) => {
    const base = setsCompleted * 10 + exercises.length * 5;
    const mult = feedback === 'hard' ? 1.5 : feedback === 'normal' ? 1.2 : 1.0;
    const prBonus = prCount * 25;
    const streak = profile?.streak_days || 0;
    const streakBoost = Math.min(streak * 0.05, 0.5);
    const raw = Math.round((base * mult + prBonus) * (1 + streakBoost));
    return Math.min(raw, 500); // plafond 500 XP/jour
  };

  const handleFeedback = (value) => {
    const xp = computeXP(value);
    setSelectedFeedback(value);
    setEarnedXP(xp);
    // Show share card before navigating
    setTimeout(() => setShowShare(true), 400);
    onFeedback(value, xp);
  };

  return (
    <>
    <AnimatePresence>
      {showShare && (
        <WorkoutShareCard
          sessionName={sessionName}
          exercises={exercises}
          setsCompleted={setsCompleted}
          prCount={prCount}
          profile={profile}
          xpEarned={earnedXP}
          onClose={() => setShowShare(false)}
          isFR={isFR}
        />
      )}
    </AnimatePresence>
    <div className="flex flex-col items-center h-full py-6 px-5 space-y-5 overflow-y-auto">
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 15 }}
        className="h-24 w-24 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-300/50"
      >
        <Trophy className="h-12 w-12 text-white" />
      </motion.div>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
        <h2 className="font-heading text-4xl tracking-widest" style={{ background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(0,80%,52%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BRAVO !</h2>
        <p className="text-foreground font-semibold mt-1 text-lg">{sessionName}</p>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="flex gap-3 w-full">
        {[
          { icon: Zap, label: 'Exercices', value: exercises.length, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-200' },
          { icon: Flame, label: 'Séries', value: setsCompleted, color: 'text-orange-600', bg: 'bg-orange-50 border border-orange-200' },
          { icon: Trophy, label: 'PRs', value: prCount, color: 'text-yellow-600', bg: 'bg-yellow-50 border border-yellow-200' },
        ].map(stat => (
          <div key={stat.label} className={`flex-1 rounded-2xl ${stat.bg} p-3 text-center`}>
            <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
            <p className={`font-heading text-2xl leading-none ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* AI Summary */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="w-full rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg, #eff6ff, #f0f4ff)', border: '1px solid rgba(30,80,220,0.15)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-lg flex items-center justify-center shadow"
            style={{ background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(220,90%,40%))' }}>
            <span className="text-xs font-heading text-white font-bold">N</span>
          </div>
          <span className="text-xs font-heading tracking-wider text-blue-700">BILAN COACH IA</span>
        </div>
        {loadingAI ? (
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
          </div>
        ) : (
          <ReactMarkdown className="text-sm text-blue-900 prose prose-sm prose-blue max-w-none [&>*:first-child]:mt-0">
            {aiSummary}
          </ReactMarkdown>
        )}
      </motion.div>

      {/* Share button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="w-full">
        <Button variant="outline" onClick={() => setShowShare(true)} className="w-full gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
          <Share2 className="h-4 w-4" />
          {isFR ? 'Partager ma séance' : 'Share my session'}
        </Button>
      </motion.div>

      {/* Feedback */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full space-y-2.5">
        <p className="font-semibold text-sm text-center text-foreground">{isFR ? 'Comment était la séance ?' : 'How was the session?'}</p>
        {FEEDBACK_OPTIONS.map(f => (
          <motion.button
            key={f.value}
            whileTap={{ scale: 0.97 }}
            disabled={!!selectedFeedback}
            onClick={() => handleFeedback(f.value)}
            className={`w-full p-4 rounded-2xl ${f.color} text-white font-semibold flex items-center justify-between transition-opacity ${selectedFeedback && selectedFeedback !== f.value ? 'opacity-40' : ''}`}
          >
            <span>{f.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-normal opacity-80">+{computeXP(f.value)} XP</span>
              <ChevronRight className="h-4 w-4 opacity-70" />
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
    </>
  );
}