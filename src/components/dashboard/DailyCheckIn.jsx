import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Moon, Smile, Droplets } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeContext';

const TODAY_KEY = 'nationalfit_checkin_' + new Date().toISOString().split('T')[0];

function calcRecoveryScore({ energy, sleep, mood, water }) {
  let score = 50;
  if (sleep) score += (sleep - 3) * 8;
  if (energy) score += (energy - 3) * 6;
  if (mood) score += (mood - 3) * 4;
  if (water) {
    if (water >= 3) score += 10;
    else if (water >= 2) score += 5;
    else score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}

const getQuestions = (isFR) => [
  {
    key: 'energy',
    icon: Zap,
    label: isFR ? "Niveau d'énergie" : 'Energy Level',
    options: [
      { value: 1, label: isFR ? '😴 Épuisé' : '😴 Exhausted', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
      { value: 2, label: isFR ? '😕 Fatigué' : '😕 Tired', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
      { value: 3, label: isFR ? '😐 Moyen' : '😐 Average', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
      { value: 4, label: isFR ? '💪 En forme' : '💪 Good', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
      { value: 5, label: isFR ? '⚡ Au top !' : '⚡ Top!', bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
    ],
  },
  {
    key: 'sleep',
    icon: Moon,
    label: isFR ? 'Sommeil cette nuit' : 'Sleep last night',
    options: [
      { value: 1, label: '😫 <5h', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
      { value: 2, label: '😪 5-6h', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
      { value: 3, label: '😴 6-7h', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
      { value: 4, label: '😊 7-8h', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
      { value: 5, label: '✨ 8h+', bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
    ],
  },
  {
    key: 'mood',
    icon: Smile,
    label: isFR ? 'Humeur générale' : 'Overall mood',
    options: [
      { value: 1, label: isFR ? '😡 Mauvaise' : '😡 Bad', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
      { value: 2, label: isFR ? '😞 Bof' : '😞 Meh', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
      { value: 3, label: isFR ? '😐 Neutre' : '😐 Neutral', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
      { value: 4, label: isFR ? '😄 Bonne' : '😄 Good', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
      { value: 5, label: '🔥 Top !', bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
    ],
  },
  {
    key: 'water',
    icon: Droplets,
    label: isFR ? 'Eau bue hier (litres)' : 'Water drank yesterday (L)',
    options: [
      { value: 1, label: '💧 <1L', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
      { value: 2, label: '💧 1-1.5L', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
      { value: 3, label: '💧 1.5-2L', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
      { value: 4, label: '💧 2-2.5L', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
      { value: 5, label: '💧 2.5L+', bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
    ],
  },
];

export default function DailyCheckIn({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const { language } = useTheme();
  const isFR = language === 'fr';
  const questions = getQuestions(isFR);

  const already = (() => { try { return !!localStorage.getItem(TODAY_KEY); } catch { return false; } })();
  if (already) return null;

  const q = questions[step];
  const isLast = step === questions.length - 1;

  const handleSelect = async (value) => {
    const newAnswers = { ...answers, [q.key]: value };
    setAnswers(newAnswers);

    if (isLast) {
      const today = new Date().toISOString().split('T')[0];
      try { localStorage.setItem(TODAY_KEY, JSON.stringify(newAnswers)); } catch {}

      try {
        const existing = await base44.entities.ProgressEntry.filter({ date: today });
        const moodMap = ['', 'fatigué', 'fatigué', 'moyen', 'bien', 'excellent'];
        const moodValue = moodMap[newAnswers.mood] || 'moyen';
        // Sleep: convertit la valeur 1-5 en heures approximatives
        const sleepHoursMap = { 1: 4.5, 2: 5.5, 3: 6.5, 4: 7.5, 5: 9 };
        const sleepHours = sleepHoursMap[newAnswers.sleep] || null;
        // Eau: convertit en litres
        const waterMap = { 1: 0.75, 2: 1.25, 3: 1.75, 4: 2.25, 5: 3 };
        const waterLitres = waterMap[newAnswers.water] || null;
        const recoveryScore = calcRecoveryScore(newAnswers);

        const entryData = {
          energy_level: newAnswers.energy,
          mood: moodValue,
          sleep_hours: sleepHours,
          water_intake_l: waterLitres,
          recovery_score: recoveryScore,
        };

        if (existing && existing.length > 0) {
          await base44.entities.ProgressEntry.update(existing[0].id, entryData);
        } else {
          await base44.entities.ProgressEntry.create({ date: today, ...entryData });
        }
      } catch {}
      onComplete(newAnswers);
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl overflow-hidden border border-blue-200"
        style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', boxShadow: '0 4px 20px rgba(30,80,220,0.10)' }}
      >
        {/* Progress dots */}
        <div className="flex gap-1.5 px-4 pt-4 justify-center">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-blue-500 w-8' : 'bg-blue-100 w-4'}`} />
          ))}
        </div>

        <div className="px-4 py-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <q.icon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-blue-500 uppercase tracking-wider font-semibold">{isFR ? 'Check-in du jour' : "Today's check-in"} · {step + 1}/{questions.length}</p>
              <p className="font-bold text-slate-800 text-sm">{q.label}</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {q.options.map(opt => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.04 }}
                onClick={() => handleSelect(opt.value)}
                className={`${opt.bg} border-2 ${opt.border} rounded-xl p-2 flex flex-col items-center gap-1 text-center cursor-pointer transition-all shadow-sm hover:shadow-md`}
              >
                <span className="text-xl leading-none">{opt.label.split(' ')[0]}</span>
                <span className={`text-[9px] ${opt.text} font-semibold leading-tight`}>{opt.label.split(' ').slice(1).join(' ')}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}