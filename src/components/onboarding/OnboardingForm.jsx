import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, ChevronLeft, Zap, Camera, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeContext';


const getSteps = (isFR) => [
  { title: isFR ? 'Qui es-tu ?' : 'Who are you?', sub: isFR ? 'Profil de base' : 'Basic profile', emoji: '👋' },
  { title: isFR ? 'Ta morphologie' : 'Your body type', sub: isFR ? 'Silhouette actuelle' : 'Current physique', emoji: '🧬' },
  { title: isFR ? 'Ton objectif' : 'Your goal', sub: isFR ? 'Où veux-tu aller ?' : 'Where do you want to go?', emoji: '🎯' },
  { title: isFR ? 'Ton alimentation' : 'Your nutrition', sub: isFR ? 'Régime & discipline' : 'Diet & discipline', emoji: '🥗' },
  { title: isFR ? 'Ton équipement' : 'Your equipment', sub: isFR ? 'Où t\'entraînes-tu ?' : 'Where do you train?', emoji: '🏋️' },
];

const BODY_AVATARS = ['', '🧍', '🧍', '🏃', '🏊', '🧗', '🚶', '🚶‍♂️', '🐻', '🐘', '🦛'];
const getBodyLabels = (isFR) => isFR
  ? ['', 'Très mince', 'Mince', 'Fin athlétique', 'Svelte', 'Athlétique', 'Légèrement enrobé', 'Enrobé', 'Corpulent', 'Très corpulent', 'Surpoids élevé']
  : ['', 'Very thin', 'Thin', 'Athletic lean', 'Slim', 'Athletic', 'Slightly chubby', 'Chubby', 'Stocky', 'Very stocky', 'High overweight'];
const BODY_COLORS = ['', '#3b82f6','#60a5fa','#34d399','#4ade80','#22c55e','#facc15','#fb923c','#f87171','#ef4444','#dc2626'];

const getGoals = (isFR) => [
  { value: 'seche', label: isFR ? 'Sèche' : 'Cut', desc: isFR ? 'Perdre du gras, garder le muscle' : 'Lose fat, keep muscle', emoji: '🔥' },
  { value: 'prise_masse', label: isFR ? 'Prise de masse' : 'Bulk', desc: isFR ? 'Gagner du muscle et de la force' : 'Gain muscle and strength', emoji: '💪' },
  { value: 'maintien', label: isFR ? 'Maintien' : 'Maintain', desc: isFR ? 'Garder sa forme actuelle' : 'Keep current shape', emoji: '⚖️' },
  { value: 'force', label: isFR ? 'Force' : 'Strength', desc: isFR ? 'Devenir plus fort, charges lourdes' : 'Get stronger, heavy weights', emoji: '🏋️' },
  { value: 'cardio', label: isFR ? 'Gain de cardio' : 'Cardio', desc: isFR ? 'Endurance et condition physique' : 'Endurance and fitness', emoji: '🏃' },
];

const getWeakMuscles = (isFR) => isFR
  ? ['Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Abdominaux', 'Fessiers', 'Quadriceps', 'Ischio-jambiers', 'Mollets']
  : ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Glutes', 'Quadriceps', 'Hamstrings', 'Calves'];

const getEquipmentOptions = (isFR) => [
  { value: 'aucun', label: isFR ? 'Sans matériel' : 'No equipment', desc: isFR ? 'Poids du corps uniquement' : 'Bodyweight only', emoji: '🏠' },
  { value: 'essentiel', label: isFR ? 'Salle essentielle' : 'Essential gym', desc: isFR ? 'Barres, haltères, machines de base' : 'Bars, dumbbells, basic machines', emoji: '🏋️' },
  { value: 'salle_complete', label: isFR ? 'Salle complète' : 'Full gym', desc: isFR ? 'Toutes les machines disponibles' : 'All machines available', emoji: '🏟️' },
];

export default function OnboardingForm({ onComplete }) {
  const { getThemePersonality, language } = useTheme();
  const themePersonality = getThemePersonality();
  const isFR = language === 'fr';
  const STEPS = getSteps(isFR);
  const BODY_LABELS = getBodyLabels(isFR);
  const GOALS = getGoals(isFR);
  const WEAK_MUSCLES_OPTIONS = getWeakMuscles(isFR);
  const EQUIPMENT_OPTIONS = getEquipmentOptions(isFR);
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState({});
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [data, setData] = useState({
    first_name: '', age: '', gender: '',
    height_cm: '', weight_kg: '',
    body_type_score: 5,
    photo_front_relaxed: '', photo_front_flexed: '',
    photo_back_relaxed: '', photo_back_flexed: '',
    ai_morphology_note: '',
    goal: '',
    fitness_level: '',
    injuries: '',
    weak_muscles: [],
    dietary_preference: 'omnivore',
    allergies: '',
    food_mode: 'flexible',
    meals_per_day: 3,
    equipment: '',
    available_days: '',
  });

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const toggleWeakMuscle = (m) => {
    setData(prev => ({
      ...prev,
      weak_muscles: prev.weak_muscles.includes(m)
        ? prev.weak_muscles.filter(x => x !== m)
        : [...prev.weak_muscles, m],
    }));
  };

  const handlePhotoUpload = async (field, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [field]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update(field, file_url);
    setUploading(prev => ({ ...prev, [field]: false }));
  };

  const analyzeWithAI = async () => {
    const hasPhoto = data.photo_front_relaxed || data.photo_front_flexed;
    setAiAnalyzing(true);
    const prompt = isFR
      ? `Tu es un coach sportif expert en analyse morphologique. L'utilisateur a ${data.weight_kg || '?'}kg pour ${data.height_cm || '?'}cm et se positionne à ${data.body_type_score}/10 sur l'échelle de morphologie (1=très mince, 10=surpoids élevé).${hasPhoto ? ' Des photos ont été fournies.' : ''}
Donne une analyse courte (2-3 phrases max) de leur morphologie et une recommandation d'objectif adaptée. Sois direct, motivant, style coach sportif professionnel français.`
      : `You are an expert sports coach specializing in body analysis. The user weighs ${data.weight_kg || '?'}kg and is ${data.height_cm || '?'}cm tall, with a body type score of ${data.body_type_score}/10 (1=very lean, 10=obese).${hasPhoto ? ' Photos have been provided.' : ''}
Give a short analysis (2-3 sentences max) of their body type and a suitable goal recommendation. Be direct and motivating, like a professional sports coach.`;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: hasPhoto ? [data.photo_front_relaxed || data.photo_front_flexed].filter(Boolean) : undefined,
    });
    update('ai_morphology_note', result);
    setAiAnalyzing(false);
  };

  const canProceed = () => {
    if (step === 0) return data.first_name && data.age && data.gender && data.height_cm && data.weight_kg;
    if (step === 1) return true; // morphologie optionnelle
    if (step === 2) return data.goal && data.fitness_level;
    if (step === 3) return data.dietary_preference && data.food_mode;
    if (step === 4) return data.equipment && data.available_days;
    return true;
  };

  const handleFinish = () => {
    onComplete({
      ...data,
      age: Number(data.age),
      height_cm: Number(data.height_cm),
      weight_kg: Number(data.weight_kg),
      available_days: Number(data.available_days),
      body_type_score: Number(data.body_type_score),
      meals_per_day: Number(data.meals_per_day),
      onboarding_complete: true,
      xp_points: 0,
      streak_days: 0,
    });
  };

  const score = Number(data.body_type_score);
  const rangeStyle = { '--range-pct': `${((score - 1) / 9) * 100}%` };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, hsl(${themePersonality.colors.background}) 0%, hsl(222, 28%, 8%) 100%)` }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl" style={{ background: 'linear-gradient(135deg, hsl(220,90%,56%), hsl(0,80%,55%))' }}>
            <span className="text-3xl font-heading text-white font-bold">N</span>
          </div>
          <h1 className="font-heading text-3xl text-foreground">NATIONAL FIT</h1>
          <p className="text-muted-foreground text-sm mt-1">{isFR ? 'Ton coach sportif IA personnel' : 'Your personal AI fitness coach'}</p>
        </div>

        {/* Step progress */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${i < step ? 'bg-primary' : i === step ? 'bg-primary/70' : 'bg-muted'}`} />
          ))}
        </div>

        <Card className="p-6 shadow-xl border-0 bg-card">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">{STEPS[step].emoji}</span>
            <div>
              <h2 className="font-heading text-xl text-foreground">{STEPS[step].title}</h2>
              <p className="text-xs text-muted-foreground">{STEPS[step].sub}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }} className="space-y-4">

              {/* STEP 0 -- Identité + Physique fusionnés */}
              {step === 0 && (
                <>
                  <div>
                    <Label>{isFR ? 'Prénom *' : 'First name *'}</Label>
                    <Input placeholder={isFR ? 'Ton prénom' : 'Your first name'} value={data.first_name} onChange={e => update('first_name', e.target.value)} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{isFR ? 'Âge *' : 'Age *'}</Label>
                      <Input type="number" placeholder="25" value={data.age} onChange={e => update('age', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>{isFR ? 'Genre *' : 'Gender *'}</Label>
                      <Select value={data.gender} onValueChange={v => update('gender', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder={isFR ? 'Sélectionner' : 'Select'} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homme">{isFR ? 'Homme' : 'Male'}</SelectItem>
                          <SelectItem value="femme">{isFR ? 'Femme' : 'Female'}</SelectItem>
                          <SelectItem value="autre">{isFR ? 'Autre' : 'Other'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{isFR ? 'Taille (cm) *' : 'Height (cm) *'}</Label>
                      <Input type="number" placeholder="175" value={data.height_cm} onChange={e => update('height_cm', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>{isFR ? 'Poids (kg) *' : 'Weight (kg) *'}</Label>
                      <Input type="number" placeholder="70" value={data.weight_kg} onChange={e => update('weight_kg', e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </>
              )}

              {/* STEP 1 -- Morphologie */}
              {step === 1 && (
                <>
                  <div>
                    <Label className="text-sm font-semibold">{isFR ? 'Morphologie actuelle' : 'Current body type'}</Label>
                    <p className="text-xs text-muted-foreground mb-3">{isFR ? 'Positionne-toi sur l\'échelle' : 'Position yourself on the scale'}</p>
                    <div className="space-y-3">
                      {/* Body type selector */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">1</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={score}
                          onChange={(e) => update('body_type_score', Number(e.target.value))}
                          className="flex-1"
                          style={rangeStyle}
                        />
                        <span className="text-xs text-muted-foreground">10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{BODY_LABELS[1]}</span>
                        <span className="text-lg">{BODY_AVATARS[score] || '🧍'}</span>
                        <span className="text-xs font-medium text-muted-foreground">{BODY_LABELS[10]}</span>
                      </div>
                      <p className="text-center text-sm font-semibold" style={{ color: BODY_COLORS[score] || '#3b82f6' }}>
                        {BODY_LABELS[score] || (isFR ? 'Sélectionne ta morphologie' : 'Select your body type')}
                      </p>
                    </div>
                  </div>

                  {/* Photos */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Camera className="h-4 w-4" /> {isFR ? 'Photos de suivi' : 'Progress photos'} <span className="text-muted-foreground text-xs font-normal">({isFR ? 'optionnelles' : 'optional'})</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">{isFR ? 'L\'IA peut analyser ta morphologie depuis les photos' : 'AI can analyze your body type from photos'}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { field: 'photo_front_relaxed', label: isFR ? 'Face décontracté' : 'Front relaxed' },
                        { field: 'photo_front_flexed', label: isFR ? 'Face contracté' : 'Front flexed' },
                        { field: 'photo_back_relaxed', label: isFR ? 'Dos décontracté' : 'Back relaxed' },
                        { field: 'photo_back_flexed', label: isFR ? 'Dos contracté' : 'Back flexed' },
                      ].map(({ field, label }) => (
                        <PhotoBox key={field} label={label} url={data[field]} loading={uploading[field]}
                          onFile={f => handlePhotoUpload(field, f)} />
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2 border-green-300 text-green-700 hover:bg-green-50"
                    onClick={analyzeWithAI} disabled={aiAnalyzing || (!data.weight_kg && !data.height_cm && !data.photo_front_relaxed)}>
                    {aiAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : '🤖'}
                    {aiAnalyzing ? (isFR ? 'Analyse en cours...' : 'Analyzing...') : (isFR ? 'Analyser ma morphologie (IA)' : 'Analyze my body type (AI)')}
                  </Button>
                  {data.ai_morphology_note && (
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm text-foreground">
                      <p className="font-semibold text-xs text-primary mb-1">🧬 {isFR ? 'ANALYSE IA' : 'AI ANALYSIS'}</p>
                      {data.ai_morphology_note}
                    </div>
                  )}
                </>
              )}

              {/* STEP 2 -- Objectif */}
              {step === 2 && (
                <>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">{isFR ? 'Objectif principal *' : 'Main goal *'}</Label>
                    <div className="space-y-2">
                      {GOALS.map(g => (
                        <button key={g.value} onClick={() => update('goal', g.value)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${data.goal === g.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
                          <span className="text-xl">{g.emoji}</span>
                          <div>
                            <p className="font-semibold text-sm">{g.label}</p>
                            <p className="text-xs text-muted-foreground">{g.desc}</p>
                          </div>
                          {data.goal === g.value && <Check className="h-4 w-4 text-primary ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>{isFR ? 'Niveau sportif *' : 'Fitness level *'}</Label>
                    <Select value={data.fitness_level} onValueChange={v => update('fitness_level', v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder={isFR ? 'Ton niveau' : 'Your level'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debutant">🌱 {isFR ? 'Débutant (moins de 6 mois)' : 'Beginner (less than 6 months)'}</SelectItem>
                        <SelectItem value="intermediaire">💪 {isFR ? 'Intermédiaire (6 mois – 3 ans)' : 'Intermediate (6 months – 3 years)'}</SelectItem>
                        <SelectItem value="avance">🔥 {isFR ? 'Avancé (3 ans+)' : 'Advanced (3+ years)'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">{isFR ? 'Points faibles (muscles)' : 'Weak points (muscles)'} <span className="text-muted-foreground font-normal text-xs">({isFR ? 'optionnel' : 'optional'})</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {WEAK_MUSCLES_OPTIONS.map(m => (
                        <button key={m} onClick={() => toggleWeakMuscle(m)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${data.weak_muscles.includes(m) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>{isFR ? 'Blessures / limitations' : 'Injuries / limitations'} <span className="text-muted-foreground font-normal text-xs">({isFR ? 'optionnel' : 'optional'})</span></Label>
                    <Textarea placeholder={isFR ? 'Ex: douleur au genou droit...' : 'E.g.: right knee pain...'} value={data.injuries} onChange={e => update('injuries', e.target.value)} className="mt-1 text-sm" />
                  </div>
                </>
              )}

              {/* STEP 3 -- Alimentation */}
              {step === 3 && (
                <>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">{isFR ? 'Mode alimentaire *' : 'Diet mode *'}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => update('food_mode', 'flexible')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${data.food_mode === 'flexible' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
                        <p className="text-xl mb-1">😋</p>
                        <p className="font-semibold text-sm">{isFR ? 'Mode Flexible' : 'Flexible Mode'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{isFR ? 'Écarts autorisés, résultats progressifs' : 'Cheats allowed, progressive results'}</p>
                      </button>
                      <button onClick={() => update('food_mode', 'strict')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${data.food_mode === 'strict' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border hover:border-secondary/50'}`}>
                        <p className="text-xl mb-1">⚔️</p>
                        <p className="font-semibold text-sm">{isFR ? 'Mode Strict' : 'Strict Mode'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{isFR ? 'Aucun écart, résultats rapides' : 'No cheats, fast results'}</p>
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>{isFR ? 'Préférence alimentaire *' : 'Dietary preference *'}</Label>
                    <Select value={data.dietary_preference} onValueChange={v => update('dietary_preference', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="omnivore">🥩 {isFR ? 'Omnivore' : 'Omnivore'}</SelectItem>
                        <SelectItem value="vegetarien">🥦 {isFR ? 'Végétarien' : 'Vegetarian'}</SelectItem>
                        <SelectItem value="vegan">🌱 Vegan</SelectItem>
                        <SelectItem value="sans_gluten">🌾 {isFR ? 'Sans gluten' : 'Gluten-free'}</SelectItem>
                        <SelectItem value="halal">✅ Halal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isFR ? 'Allergies / intolérances' : 'Allergies / intolerances'} <span className="text-muted-foreground font-normal text-xs">({isFR ? 'optionnel' : 'optional'})</span></Label>
                    <Input placeholder={isFR ? 'Ex: lactose, noix...' : 'E.g.: lactose, nuts...'} value={data.allergies} onChange={e => update('allergies', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="mb-2 block">{isFR ? 'Repas / jour' : 'Meals / day'}</Label>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => update('meals_per_day', n)}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${Number(data.meals_per_day) === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* STEP 4 -- Équipement */}
              {step === 4 && (
                <>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">{isFR ? 'Lieu d\'entraînement *' : 'Training location *'}</Label>
                    <div className="space-y-2">
                      {EQUIPMENT_OPTIONS.map(eq => (
                        <button key={eq.value} onClick={() => update('equipment', eq.value)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${data.equipment === eq.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
                          <span className="text-2xl">{eq.emoji}</span>
                          <div>
                            <p className="font-semibold text-sm">{eq.label}</p>
                            <p className="text-xs text-muted-foreground">{eq.desc}</p>
                          </div>
                          {data.equipment === eq.value && <Check className="h-4 w-4 text-primary ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">{isFR ? 'Jours / semaine *' : 'Days / week *'}</Label>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5, 6].map(n => (
                        <button key={n} onClick={() => update('available_days', String(n))}
                          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${Number(data.available_days) === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}>
                          {n}{isFR ? 'j' : 'd'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Legal notice on last step */}
          {step === STEPS.length - 1 && (
            <div className="space-y-2">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <p className="font-semibold mb-1">⚠️ {isFR ? 'Important :' : 'Important:'}</p>
                <p>{isFR ? 'Les programmes sportifs et nutritionnels ne remplacent pas un avis médical. Consulte ton médecin avant de commencer, surtout si tu as des problèmes de santé, blessures ou si tu es enceinte.' : 'Sports and nutrition programs do not replace medical advice. Consult your doctor before starting, especially if you have health issues, injuries, or are pregnant.'}</p>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                {isFR ? 'En continuant, tu acceptes nos' : 'By continuing, you agree to our'}{' '}
                <a href="/legal?tab=cgu" target="_blank" rel="noopener noreferrer" className="underline text-primary">{isFR ? 'CGU' : 'Terms'}</a>
                {' '}{isFR ? 'et notre' : 'and our'}{' '}
                <a href="/legal?tab=privacy" target="_blank" rel="noopener noreferrer" className="underline text-primary">{isFR ? 'Politique de confidentialité' : 'Privacy Policy'}</a>.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="text-muted-foreground">
              <ChevronLeft className="h-4 w-4 mr-1" /> {isFR ? 'Préc.' : 'Prev.'}
            </Button>
            <div className="flex items-center gap-2">
              {step === 1 && (
                <Button variant="ghost" onClick={() => setStep(s => s + 1)} className="text-muted-foreground text-sm">
                  {isFR ? 'Passer' : 'Skip'}
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="text-white gap-1" style={{ background: `hsl(${themePersonality.colors.primary})` }}>
                  {isFR ? 'Suiv.' : 'Next'} <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={!canProceed()} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-heading tracking-wider">
                  <Zap className="h-4 w-4" /> {isFR ? 'COMMENCER !' : 'START!'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function PhotoBox({ label, url, loading, onFile }) {
  const ref = useRef();
  return (
    <div onClick={() => ref.current?.click()}
      className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
      {loading ? (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-green-500" />
          <span className="text-xs">Envoi...</span>
        </div>
      ) : url ? (
        <>
          <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute bottom-0 inset-x-0 bg-black/50 p-1">
            <span className="text-white text-xs font-medium block text-center">{label}</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground p-2 text-center">
          <Camera className="h-5 w-5" />
          <span className="text-xs leading-tight">{label}</span>
        </div>
      )}
    </div>
  );
}