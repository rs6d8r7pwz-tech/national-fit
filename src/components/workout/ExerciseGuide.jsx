import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeContext';
import { matchGuide, youtubeSearchUrl } from '@/lib/exerciseGuide';
import { poseFor } from '@/lib/bonhomme';

// Dessine le « bonhomme » (même personnage) dans la pose de l'exercice.
function Bonhomme({ type, color }) {
  const pose = poseFor(type);
  const [hx, hy, hr] = pose.head;
  return (
    <svg viewBox="0 0 100 100" width="132" height="132" aria-hidden="true">
      <circle cx={hx} cy={hy} r={hr} fill="none" stroke={color} strokeWidth={4.5} />
      {pose.lines.map((pl, i) => (
        <polyline
          key={i}
          points={pl.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

const CUES_CACHE = 'nfit_exo_cues_';

export default function ExerciseGuide({ exerciseName, isOpen, onClose, isFR = true }) {
  const { getThemePersonality } = useTheme();
  const primary = `hsl(${getThemePersonality().colors.primary})`;
  const guide = matchGuide(exerciseName);
  const [cues, setCues] = useState(guide?.cues || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !exerciseName) return;
    // Exercice connu → consignes fiables et instantanées.
    if (guide) { setCues(guide.cues); return; }
    // Sinon : consignes générées par l'IA, mises en cache pour ne pas rappeler l'IA.
    const key = CUES_CACHE + exerciseName.toLowerCase();
    try {
      const cached = JSON.parse(localStorage.getItem(key) || 'null');
      if (Array.isArray(cached) && cached.length) { setCues(cached); return; }
    } catch {}
    let cancelled = false;
    setLoading(true);
    setCues(null);
    base44.integrations.Core.InvokeLLM({
      prompt: `Donne 3 consignes TRÈS courtes (max 12 mots chacune) pour bien exécuter l'exercice de musculation "${exerciseName}", pour un débutant. Ordre : 1) position de départ, 2) mouvement, 3) erreur à éviter. Réponds en français, une consigne par ligne, sans numéro ni tiret.`,
    }).then((txt) => {
      if (cancelled) return;
      const lines = String(txt || '')
        .split('\n')
        .map((l) => l.replace(/^\s*[-•\d.)]+\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3);
      const finalCues = lines.length ? lines : [
        'Garde le dos droit et gainé.',
        'Contrôle le mouvement, sans à-coups.',
        'Respire et ne bloque pas ta respiration.',
      ];
      setCues(finalCues);
      try { localStorage.setItem(key, JSON.stringify(finalCues)); } catch {}
    }).catch(() => {
      if (!cancelled) setCues([
        'Garde le dos droit et gainé.',
        'Contrôle le mouvement, sans à-coups.',
        'Respire et ne bloque pas ta respiration.',
      ]);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, exerciseName]);

  if (!isOpen) return null;
  const type = guide?.type || 'standing';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* En-tête : bonhomme + nom */}
          <div className="flex items-center gap-4 px-5 pt-5 pb-4" style={{ background: `hsl(${getThemePersonality().colors.primary} / 0.06)` }}>
            <div className="shrink-0 rounded-2xl bg-white shadow-sm p-1">
              <Bonhomme type={type} color={primary} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: primary }}>
                {isFR ? 'Comment faire' : 'How to'}
              </p>
              <h3 className="font-heading text-xl leading-tight text-foreground break-words">{exerciseName}</h3>
            </div>
            <button onClick={onClose} className="shrink-0 h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center" aria-label="Fermer">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Consignes */}
          <div className="px-5 py-4 space-y-2.5">
            {loading || !cues ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> {isFR ? 'Préparation des consignes…' : 'Loading tips…'}
              </div>
            ) : (
              cues.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <span className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: primary }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground leading-snug pt-0.5">{c}</p>
                </div>
              ))
            )}
          </div>

          {/* Vidéo fiable */}
          <div className="px-5 pb-5 pt-1">
            <a
              href={youtubeSearchUrl(exerciseName)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <Youtube className="h-4 w-4" /> {isFR ? 'Voir une vidéo de démonstration' : 'Watch a demo video'}
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
