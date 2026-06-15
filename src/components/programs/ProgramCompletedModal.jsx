import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export default function ProgramCompletedModal({ program, onClose }) {
  const navigate = useNavigate();
  const { language } = useTheme();
  const isFR = language === 'fr';

  useEffect(() => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#1e50dc', '#dc2626', '#ffffff', '#fbbf24'] });
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header gradient */}
          <div className="p-8 text-center" style={{ background: 'linear-gradient(135deg, #1e50dc 0%, #7c3aed 100%)' }}>
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-10 w-10 text-yellow-300" />
            </div>
            <h2 className="font-heading text-3xl text-white tracking-wider">
              {isFR ? 'PROGRAMME TERMINÉ !' : 'PROGRAM COMPLETE!'}
            </h2>
            <p className="text-white/80 text-sm mt-2">
              {isFR ? `Tu as terminé "${program?.title}" 🎉` : `You completed "${program?.title}" 🎉`}
            </p>
          </div>

          {/* Stats */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-2xl p-3 text-center border border-blue-100">
                <p className="font-heading text-2xl text-blue-700">{program?.total_sessions || 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">{isFR ? 'Séances réalisées' : 'Sessions done'}</p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-3 text-center border border-purple-100">
                <p className="font-heading text-2xl text-purple-700">💪</p>
                <p className="text-xs text-slate-500 mt-0.5">{isFR ? 'Objectif atteint' : 'Goal reached'}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 text-center leading-relaxed">
              {isFR
                ? 'Félicitations ! Tu as tenu jusqu\'au bout. C\'est maintenant le moment de passer au niveau supérieur.'
                : 'Congratulations! You made it to the end. Now it\'s time to level up.'}
            </p>

            <Button
              onClick={() => { onClose(); navigate('/programmes'); }}
              className="w-full h-12 gap-2 text-white font-heading tracking-wider text-base"
              style={{ background: 'linear-gradient(135deg, #1e50dc, #7c3aed)' }}
            >
              <Sparkles className="h-5 w-5" />
              {isFR ? 'NOUVEAU PROGRAMME' : 'NEW PROGRAM'}
              <ChevronRight className="h-4 w-4" />
            </Button>

            <button
              onClick={onClose}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 py-1"
            >
              {isFR ? 'Fermer' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}