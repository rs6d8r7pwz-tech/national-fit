import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePremium } from '@/hooks/usePremium';

/**
 * PremiumGate -- affiche le contenu si premium, sinon affiche un CTA de conversion.
 * Props:
 *   - children: contenu premium
 *   - message: message personnalisé (optionnel)
 *   - compact: mode compact (petite bannière, pas de carte pleine)
 */
export default function PremiumGate({ children, message, compact = false }) {
  const { isPremium } = usePremium();
  const navigate = useNavigate();

  if (isPremium) return <>{children}</>;

  if (compact) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-30 blur-[2px] select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Crown className="h-4 w-4 text-yellow-300" />
            Passer Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-6 text-center shadow-sm">
      <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
        <Lock className="h-7 w-7 text-white" />
      </div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Crown className="h-5 w-5 text-yellow-500" />
        <h3 className="font-bold text-blue-900 text-lg">Fonctionnalité Premium</h3>
      </div>
      <p className="text-slate-600 text-sm mb-5 max-w-xs mx-auto">
        {message || 'Passe au plan Premium pour débloquer cette fonctionnalité et profiter de l\'expérience complète.'}
      </p>
      <Button
        onClick={() => navigate('/pricing')}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-md"
      >
        <Sparkles className="h-4 w-4" />
        Passer Premium -- dès 5€/mois
      </Button>
    </div>
  );
}