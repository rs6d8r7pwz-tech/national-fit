import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, RefreshCw, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const TIPS = [
  "💧 L'eau est l'arme secrète de Banner. 2L/jour minimum !",
  "🥩 Les protéines = les briques de tes muscles. Pas de protéines, pas de Hulk.",
  "😴 Hulk se régénère la nuit. Dors 8h pour récupérer comme un super-héros.",
  "🔥 20 min de marche après manger, c'est plus puissant qu'une séance ratée.",
  "💪 La régularité, c'est ça la vraie force gamma. Entraîne-toi souvent.",
  "🥗 Mange lentement. Même Hulk attend 20 min pour ressentir la satiété.",
  "🧘 Le cortisol du stress = l'ennemi. Reste calme comme Bruce Banner.",
  "🏆 Chaque séance te rapproche du niveau Avengers.",
  "🍌 La banane : le pré-workout naturel de Banner avant sa transformation.",
];

const HULK_QUOTES = [
  '"HULK PAS SKIP. HULK TOUJOURS ENTRAÎNER." -- Hulk, 2024',
  '"Bruce Banner a le cerveau. Toi t\'as les deux." -- Professeur Hulk',
  '"La douleur d\'aujourd\'hui, c\'est la puissance gamma de demain."',
  '"Tu veux ressembler à Hulk ? Fais ce que Banner fait. Deux fois."',
  '"Un super-héros ne se repose que pour mieux revenir." -- Nick Fury',
  '"Avec de la discipline, même Banner devient Hulk." -- MCU Wisdom',
  '"SMASH tes limites. Chaque. Satané. Jour."',
];

export default function CoachWidget({ profile }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [type, setType] = useState('tip');
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadMessage();
    const interval = setInterval(loadMessage, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadMessage = async () => {
    setDismissed(false);
    const roll = Math.random();

    if (roll < 0.5) {
      setType('tip');
      setMessage(TIPS[Math.floor(Math.random() * TIPS.length)]);
    } else {
      setType('hulk');
      setMessage(HULK_QUOTES[Math.floor(Math.random() * HULK_QUOTES.length)]);
    }
  };

  if (dismissed) return null;

  const headerLabel = type === 'hulk'
    ? '💥 HULK PARLE'
    : type === 'ai'
      ? '🧪 Professeur Hulk'
      : '⚡ Conseil Banner';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-2rem)]"
      >
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-green-200/40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-500 to-green-600">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-black/20 flex items-center justify-center">
                <span className="text-sm font-heading text-white font-bold">H</span>
              </div>
              <span className="text-background font-heading tracking-widest text-sm">
                {headerLabel}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={loadMessage}
                className="text-background/70 hover:text-background p-1 rounded transition-colors"
                title="Nouveau message"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-background/70 hover:text-background p-1 rounded transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-3 min-h-[60px] flex items-center">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs italic">Banner réfléchit...</span>
              </div>
            ) : (
              <p className={`text-sm leading-relaxed ${type === 'hulk' ? 'text-green-700 font-heading tracking-wide text-base' : 'text-foreground'}`}>
                {message}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 flex items-center justify-between border-t border-gray-100">
            <Link
              to="/coach"
              className="text-xs text-green-600 font-heading tracking-wider flex items-center gap-1 hover:gap-2 transition-all"
            >
              PARLER AU COACH <ChevronRight className="h-3 w-3" />
            </Link>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}