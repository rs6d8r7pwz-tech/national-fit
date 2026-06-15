import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  'Analyse de ton profil…',
  'Sélection des exercices adaptés…',
  'Calcul de la progression…',
  'Équilibrage des séances…',
  'Finalisation du programme…',
];

export default function GeneratingLoader({ visible }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!visible) { setStep(0); return; }
    const t = setInterval(() => setStep(s => (s + 1) % STEPS.length), 1800);
    return () => clearInterval(t);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: 'rgba(10,20,60,0.82)', backdropFilter: 'blur(16px)' }}
        >
          {/* Logo animé */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="h-20 w-20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(0,80%,52%))' }}
          >
            <span className="text-4xl font-heading text-white font-bold">N</span>
          </motion.div>

          {/* Titre */}
          <h2 className="font-heading text-3xl tracking-widest text-white mb-2">GÉNÉRATION IA</h2>
          <p className="text-blue-200 text-sm mb-8">Programme personnalisé en cours…</p>

          {/* Barre de progression infinie */}
          <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(220,90%,50%), hsl(0,80%,52%))' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Étape courante */}
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-blue-300 text-sm font-medium"
            >
              {STEPS[step]}
            </motion.p>
          </AnimatePresence>

          {/* Points clignotants */}
          <div className="flex gap-2 mt-6">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-blue-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}