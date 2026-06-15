import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Feather, Dumbbell, X, Check, Target, AlertTriangle, Shield, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/lib/ThemeContext';

export default function ProgramQuestionnaire({ answers, onChange, onNext, onBack }) {
  const { t, language, getThemePersonality } = useTheme();
  const themePersonality = getThemePersonality();
  
  const isFR = language === 'fr';
  
  const DURATION_OPTIONS = [
    { value: 'express', label: 'Express', icon: Zap, desc: isFR ? '15-30 min -- Séances courtes et intenses' : '15-30 min -- Short and intense sessions', intensity: 'high' },
    { value: 'standard', label: 'Standard', icon: Clock, desc: isFR ? '45-60 min -- Équilibre volume/intensité' : '45-60 min -- Balanced volume/intensity', intensity: 'medium' },
    { value: 'complet', label: isFR ? 'Complet' : 'Complete', icon: Dumbbell, desc: isFR ? '1h30-2h -- Volume maximal' : '1h30-2h -- Maximum volume', intensity: 'very_high' },
  ];

  const INTENSITY_OPTIONS = [
    { value: 'relax', label: isFR ? 'Relax / Récupération' : 'Relax / Recovery', icon: Feather, desc: isFR ? 'Étirements, mobilité, récupération active' : 'Stretching, mobility, active recovery', color: 'from-blue-400 to-blue-600' },
    { value: 'modere', label: isFR ? 'Modéré' : 'Moderate', icon: Clock, desc: isFR ? 'Séances équilibrées, progressif' : 'Balanced sessions, progressive', color: 'from-green-400 to-green-600' },
    { value: 'intense', label: isFR ? 'Intense' : 'Intense', icon: Zap, desc: isFR ? 'Les muscles souffrent ! Charges lourdes' : 'Muscles burn! Heavy weights', color: 'from-orange-400 to-orange-600' },
    { value: 'extreme', label: isFR ? 'Extrême' : 'Extreme', icon: AlertTriangle, desc: isFR ? 'Programme de beast -- volume max' : 'Beast mode -- max volume', color: 'from-red-500 to-red-700' },
  ];

  const SESSION_MODE_OPTIONS = [
    { value: 'musculation', label: isFR ? 'Musculation' : 'Bodybuilding', icon: Dumbbell, desc: isFR ? 'Force & volume musculaire' : 'Strength & muscle mass', color: 'from-purple-400 to-purple-600' },
    { value: 'force', label: isFR ? 'Force Pure' : 'Pure Strength', icon: Shield, desc: isFR ? 'Charges lourdes, peu de reps' : 'Heavy weights, low reps', color: 'from-slate-400 to-slate-600' },
    { value: 'cardio', label: isFR ? 'Cardio' : 'Cardio', icon: Heart, desc: isFR ? 'Endurance, brûler des calories' : 'Endurance, burn calories', color: 'from-red-400 to-red-600' },
    { value: 'mixte', label: isFR ? 'Mixte' : 'Mixed', icon: Zap, desc: isFR ? 'Force + Cardio' : 'Strength + Cardio', color: 'from-blue-400 to-blue-600' },
  ];

  const FOCUS_OPTIONS = [
    { value: 'fullbody', label: 'Full Body', desc: isFR ? 'Tout le corps à chaque séance' : 'Full body every session' },
    { value: 'split_standard', label: 'Split Standard', desc: isFR ? '1-2 groupes musculaires par séance (ex: Dos+Bras, Pec+Épaules)' : '1-2 muscle groups per session (e.g., Back+Arms, Chest+Shoulders)' },
    { value: 'push_pull', label: 'Push/Pull', desc: isFR ? 'Pousser (Pec/Épaules/Tri) vs Tirer (Dos/Bi)' : 'Push (Chest/Shoulders/Tri) vs Pull (Back/Bi)' },
    { value: 'upper', label: isFR ? 'Upper Body' : 'Upper Body', desc: isFR ? 'Haut du corps uniquement' : 'Upper body only' },
    { value: 'lower', label: isFR ? 'Lower Body' : 'Lower Body', desc: isFR ? 'Bas du corps uniquement' : 'Lower body only' },
  ];

  const MUSCLE_GROUPS = [
    { key: 'chest', label: isFR ? 'Pectoraux' : 'Chest', icon: '🏋️' },
    { key: 'back', label: isFR ? 'Dos' : 'Back', icon: '🦾' },
    { key: 'legs', label: isFR ? 'Jambes' : 'Legs', icon: '🦵' },
    { key: 'shoulders', label: isFR ? 'Épaules' : 'Shoulders', icon: '💪' },
    { key: 'arms', label: isFR ? 'Bras' : 'Arms', icon: '💪' },
    { key: 'core', label: isFR ? 'Abdos / Core' : 'Abs / Core', icon: '🔥' },
  ];

  const EQUIPMENT_OPTIONS = [
    { value: 'aucun', label: isFR ? 'Poids du corps' : 'Bodyweight', desc: isFR ? 'Aucun matériel' : 'No equipment' },
    { value: 'essentiel', label: isFR ? 'Essentiel' : 'Essential', desc: isFR ? 'Haltères + barre + banc' : 'Dumbbells + barbell + bench' },
    { value: 'salle_complete', label: isFR ? 'Salle complète' : 'Full Gym', desc: isFR ? 'Toutes les machines disponibles' : 'All machines available' },
  ];
  
  const updateAnswer = (key, value) => {
    onChange({ ...answers, [key]: value });
  };

  const toggleArrayValue = (key, value) => {
    const current = answers[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange({ ...answers, [key]: updated });
  };

  const canProceed = answers.duration && answers.intensity && answers.sessionMode;
  
  // Textes traduits pour les options
  const durationLabels = {
    express: language === 'fr' ? 'Express' : 'Express',
    standard: language === 'fr' ? 'Standard' : 'Standard',
    complet: language === 'fr' ? 'Complet' : 'Complete',
  };
  
  const intensityLabels = {
    relax: language === 'fr' ? 'Relax / Récupération' : 'Relax / Recovery',
    modere: language === 'fr' ? 'Modéré' : 'Moderate',
    intense: language === 'fr' ? 'Intense' : 'Intense',
    extreme: language === 'fr' ? 'Extrême' : 'Extreme',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Duration */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
          <Clock className="h-4 w-4" />
          {isFR ? 'Durée des séances' : 'Session duration'}
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {DURATION_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = answers.duration === opt.value;
            return (
              <button
              key={opt.value}
              onClick={() => updateAnswer('duration', opt.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                selected
                  ? 'border-[color] bg-[color]/10'
                  : 'border-white/[0.08] hover:border-[color]/30 bg-white/[0.03]'
              }`.replace(/\[color\]/g, `hsl(${themePersonality.colors.primary})`)}
              >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                selected ? 'bg-[color]' : 'bg-white/[0.08]'
              }`.replace(/\[color\]/g, `hsl(${themePersonality.colors.primary})`)}>
                <Icon className={`h-5 w-5 ${selected ? 'text-black' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                <p className={`text-sm font-semibold ${selected ? 'text-[color]' : 'text-foreground'}`.replace('[color]', `hsl(${themePersonality.colors.primary})`)}>
                  {durationLabels[opt.value] || opt.label}
                </p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                {selected && <Check className="h-5 w-5" style={{ color: `hsl(${themePersonality.colors.primary})` }} />}
                </button>
            );
          })}
        </div>
      </div>

      {/* Session Mode */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
          <Dumbbell className="h-4 w-4" />
          {isFR ? 'Type de séance' : 'Session type'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {SESSION_MODE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = answers.sessionMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateAnswer('sessionMode', opt.value)}
                className={`w-full flex flex-col items-center gap-2 px-3 py-3 rounded-xl border text-center transition-all ${
                  selected
                    ? `border-transparent bg-gradient-to-br ${opt.color}`
                    : 'border-white/[0.08] hover:border-white/20 bg-white/[0.03]'
                }`}
              >
                <Icon className={`h-5 w-5 ${selected ? 'text-white' : 'text-muted-foreground'}`} />
                <p className={`text-xs font-semibold ${selected ? 'text-white' : 'text-foreground'}`}>
                  {opt.label}
                </p>
                <p className={`text-[10px] ${selected ? 'text-white/90' : 'text-muted-foreground'}`}>
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Intensity */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
          <Zap className="h-4 w-4" />
          {isFR ? 'Intensité du programme' : 'Program intensity'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {INTENSITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = answers.intensity === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateAnswer('intensity', opt.value)}
                className={`w-full flex flex-col items-center gap-2 px-3 py-3 rounded-xl border text-center transition-all ${
                  selected
                    ? `border-transparent bg-gradient-to-br ${opt.color}`
                    : 'border-white/[0.08] hover:border-white/20 bg-white/[0.03]'
                }`}
              >
                <Icon className={`h-5 w-5 ${selected ? 'text-white' : 'text-muted-foreground'}`} />
                <p className={`text-xs font-semibold ${selected ? 'text-white' : 'text-foreground'}`}>
                  {opt.label}
                </p>
                <p className={`text-[10px] ${selected ? 'text-white/90' : 'text-muted-foreground'}`}>
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Focus */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
          <Target className="h-4 w-4" />
          {isFR ? 'Focus principal' : 'Main focus'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_OPTIONS.map((opt) => {
            const selected = answers.focus === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateAnswer('focus', opt.value)}
                className={`w-full flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 bg-muted/30'
                }`}
              >
                <p className={`text-xs font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>
                  {opt.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Muscles à cibler en priorité */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
          🎯 {isFR ? 'Muscles prioritaires (optionnel)' : 'Priority muscles (optional)'}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {isFR ? 'Sélectionne les muscles que tu veux travailler en priorité' : 'Select muscles you want to prioritize'}
        </p>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((muscle) => {
            const selected = (answers.priorityMuscles || []).includes(muscle.key);
            return (
              <button
                key={muscle.key}
                onClick={() => toggleArrayValue('priorityMuscles', muscle.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  selected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/50'
                }`}
              >
                {muscle.icon} {muscle.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Muscles à exclure */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
          ❌ {isFR ? 'Muscles à exclure (optionnel)' : 'Muscles to exclude (optional)'}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {isFR ? 'Si tu as des blessures ou veux éviter certains groupes' : 'If you have injuries or want to avoid certain groups'}
        </p>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((muscle) => {
            const selected = (answers.excludeMuscles || []).includes(muscle.key);
            return (
              <button
                key={muscle.key}
                onClick={() => toggleArrayValue('excludeMuscles', muscle.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  selected
                    ? 'bg-destructive text-destructive-foreground border-destructive'
                    : 'bg-muted/30 text-muted-foreground border-border hover:border-destructive/50'
                }`}
              >
                {muscle.icon} {muscle.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Équipement */}
      <div>
        <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
          <Dumbbell className="h-4 w-4" />
          {isFR ? 'Équipement disponible' : 'Available equipment'}
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {EQUIPMENT_OPTIONS.map((opt) => {
            const selected = answers.equipment === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateAnswer('equipment', opt.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 bg-muted/30'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  selected ? 'bg-primary' : 'bg-muted/50'
                }`}>
                  <Dumbbell className={`h-4 w-4 ${selected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                {selected && <Check className="h-5 w-5" style={{ color: `hsl(${themePersonality.colors.primary})` }} />}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}