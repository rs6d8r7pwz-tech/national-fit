import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';

export default function EmptyProgramCTA() {
  const navigate = useNavigate();
  const { language } = useTheme();
  const isFR = language === 'fr';

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/programmes')}
      className="w-full rounded-2xl p-5 text-left shadow-lg overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #1e50dc 0%, #dc2626 100%)',
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 right-4 text-8xl font-heading text-white select-none">NF</div>
      </div>

      <div className="relative flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
          <Dumbbell className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <p className="text-xs font-bold text-yellow-300 uppercase tracking-wider">
              {isFR ? 'Prêt à commencer ?' : 'Ready to start?'}
            </p>
          </div>
          <p className="text-lg font-heading text-white tracking-wide">
            {isFR ? 'Crée ton premier programme IA' : 'Create your first AI program'}
          </p>
          <p className="text-xs text-white/70 mt-0.5">
            {isFR ? 'Personnalisé selon ton profil en 30 secondes' : 'Personalized to your profile in 30 seconds'}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-white/70 shrink-0" />
      </div>
    </motion.button>
  );
}