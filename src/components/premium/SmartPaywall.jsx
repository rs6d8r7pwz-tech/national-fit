import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';

const PAYWALL_KEY = 'nfit_paywall_shown';

export default function SmartPaywall({ trigger, reason, onClose }) {
  const navigate = useNavigate();
  const { language } = useTheme();
  const isFR = language === 'fr';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    // Don't spam -- show once per session
    try {
      const shown = sessionStorage.getItem(PAYWALL_KEY);
      if (shown) return;
      sessionStorage.setItem(PAYWALL_KEY, '1');
    } catch {}
    setVisible(true);
  }, [trigger]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  const messages = {
    program_limit: {
      title: isFR ? '🚀 Tu as créé ton 1er programme !' : '🚀 You created your 1st program!',
      sub: isFR ? 'Avec Premium, génère autant de programmes que tu veux, adapte-les et garde ta progression.' : 'With Premium, generate unlimited programs, adapt them and track your progress.',
    },
    nutrition_limit: {
      title: isFR ? '🥗 Débloque les plans illimités' : '🥗 Unlock unlimited plans',
      sub: isFR ? 'Tu as atteint la limite hebdomadaire. Premium = plans alimentaires illimités.' : 'You reached the weekly limit. Premium = unlimited meal plans.',
    },
    default: {
      title: isFR ? '⚡ Passe au niveau supérieur' : '⚡ Level up',
      sub: isFR ? 'Débloque toutes les fonctionnalités pour atteindre tes objectifs plus vite.' : 'Unlock all features to reach your goals faster.',
    },
  };

  const msg = messages[reason] || messages.default;

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6" style={{ background: 'linear-gradient(135deg, #1e50dc 0%, #7c3aed 100%)' }}>
              <div className="flex items-start justify-between">
                <Crown className="h-8 w-8 text-yellow-300" />
                <button onClick={handleClose} className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
              <h3 className="font-heading text-2xl text-white mt-3 tracking-wider">{msg.title}</h3>
              <p className="text-white/80 text-sm mt-2 leading-relaxed">{msg.sub}</p>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['🤖', isFR ? 'Programmes illimités' : 'Unlimited programs'],
                  ['🥗', isFR ? 'Plans alim. illimités' : 'Unlimited meal plans'],
                  ['📊', isFR ? 'Stats avancées' : 'Advanced stats'],
                  ['⚡', isFR ? 'Accès prioritaire IA' : 'Priority AI access'],
                ].map(([icon, label]) => (
                  <div key={label} className="flex items-center gap-1.5 bg-blue-50 rounded-xl p-2.5">
                    <span>{icon}</span>
                    <span className="text-slate-700 font-medium leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => { handleClose(); navigate('/pricing'); }}
                className="w-full h-12 gap-2 text-white font-heading tracking-wider"
                style={{ background: 'linear-gradient(135deg, #1e50dc, #7c3aed)' }}
              >
                <Sparkles className="h-4 w-4" />
                {isFR ? 'VOIR LES OFFRES -- dès 5€/mois' : 'SEE PLANS -- from €5/month'}
              </Button>

              <button onClick={handleClose} className="w-full text-center text-xs text-slate-400 py-1">
                {isFR ? 'Pas maintenant' : 'Not now'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}