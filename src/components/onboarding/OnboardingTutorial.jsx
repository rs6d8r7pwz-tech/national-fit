import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    id: 'welcome',
    title: '🎉 Bienvenue sur NATIONAL FIT !',
    description: 'En 30 secondes, on te montre comment tirer le max de l\'app. C\'est parti !',
    target: null,
  },
  {
    id: 'dashboard',
    title: '🏠 Ton tableau de bord',
    description: 'Ici tu vois tes stats, ton niveau XP, ta série de jours et ta prochaine séance d\'un coup d\'œil.',
    target: 'nav-dashboard',
  },
  {
    id: 'programmes',
    title: '💪 Crée ton programme',
    description: 'Appuie ici pour générer un programme IA en 30 secondes. Adapté à ton niveau, ton équipement et tes objectifs.',
    target: 'nav-programmes',
  },
  {
    id: 'nutrition',
    title: '🥗 Plan nutrition IA',
    description: 'L\'IA calcule tes macros et génère un plan repas complet adapté à ton objectif (sèche, prise de masse…).',
    target: 'nav-nutrition',
  },
  {
    id: 'progres',
    title: '📈 Suis ta transformation',
    description: 'Ajoute tes mesures, poids et photos. Vois ta progression semaine après semaine.',
    target: 'nav-progres',
  },
  {
    id: 'xp',
    title: '⚡ Gagne des XP & monte de niveau',
    description: 'Chaque séance terminée te rapporte des XP. Monte de niveau pour débloquer des récompenses !',
    target: 'level-badge',
  },
  {
    id: 'coach',
    title: '🤖 Ton coach IA',
    description: 'Le bouton en bas à droite ouvre ton coach personnel. Pose-lui toutes tes questions : nutrition, récupération, technique…',
    target: 'floating-chat-btn',
  },
  {
    id: 'done',
    title: '🚀 Tu es prêt !',
    description: 'Commence par créer ton premier programme. L\'IA s\'occupe de tout en quelques secondes. À toi de jouer !',
    target: null,
    isDone: true,
    cta: 'Créer mon programme',
  },
];

export default function OnboardingTutorial({ onDone }) {
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const navigate = useNavigate();

  const current = STEPS[step];

  useEffect(() => {
    if (!current.target) {
      setSpotlightRect(null);
      return;
    }
    const el = document.getElementById(current.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Petit délai pour laisser le scroll finir
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setSpotlightRect({ ...rect.toJSON() });
      }, 200);
    } else {
      setSpotlightRect(null);
    }
  }, [step]);

  const handleNext = () => {
    if (current.isDone) {
      onDone();
      navigate('/programmes');
      return;
    }
    setStep(s => s + 1);
  };

  const handleSkip = () => {
    onDone();
  };

  const PAD = 8;

  // Détermine si le tooltip doit être en haut ou en bas selon la position du spotlight
  const tooltipAtBottom = spotlightRect
    ? (spotlightRect.top + spotlightRect.height / 2) < window.innerHeight * 0.5
    : false;

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'none' }}>

      {/* Overlay sombre avec découpe spotlight */}
      {spotlightRect ? (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'auto' }}
          onClick={handleSkip}
        >
          <defs>
            <mask id="hole">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={spotlightRect.left - PAD}
                y={spotlightRect.top - PAD}
                width={spotlightRect.width + PAD * 2}
                height={spotlightRect.height + PAD * 2}
                rx="14"
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#hole)" />
        </svg>
      ) : (
        <div
          className="absolute inset-0 bg-black/75"
          style={{ pointerEvents: 'auto' }}
          onClick={handleSkip}
        />
      )}

      {/* Bordure bleue autour du spotlight */}
      {spotlightRect && (
        <div
          className="absolute rounded-2xl pointer-events-none"
          style={{
            left: spotlightRect.left - PAD,
            top: spotlightRect.top - PAD,
            width: spotlightRect.width + PAD * 2,
            height: spotlightRect.height + PAD * 2,
            boxShadow: '0 0 0 3px #3b82f6, 0 0 24px rgba(59,130,246,0.5)',
          }}
        />
      )}

      {/* Tooltip card -- toujours centré, positionné haut ou bas */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute left-4 right-4"
          style={{
            pointerEvents: 'auto',
            zIndex: 10001,
            ...(tooltipAtBottom
              ? { bottom: 100 }    // élément en haut → card en bas (au-dessus nav)
              : { top: 60 }        // élément en bas ou center → card en haut
            ),
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
            {/* Barre de progression */}
            <div className="h-1 bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-red-500 transition-all duration-400"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-800 text-base leading-snug pr-2 flex-1">
                  {current.title}
                </h3>
                <button
                  onClick={handleSkip}
                  className="shrink-0 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {current.description}
              </p>

              <div className="flex items-center justify-between">
                {/* Dots */}
                <div className="flex gap-1 items-center">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === step
                          ? 'w-5 bg-blue-500'
                          : i < step
                          ? 'w-2 bg-blue-300'
                          : 'w-2 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Bouton suivant */}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #dc2626)' }}
                >
                  {current.cta || 'Suivant'}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {!current.isDone && (
                <button
                  onClick={handleSkip}
                  className="mt-3 text-xs text-slate-400 w-full text-center"
                >
                  Passer le tutoriel
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}