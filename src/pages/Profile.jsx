import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Save, Loader2, Camera } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import AIBodyAnalysis from '@/components/profile/AIBodyAnalysis';
import AchievementBadges from '@/components/gamification/AchievementBadges';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const GOALS_FR = [
  { value: 'seche', label: '🔥 Sèche' },
  { value: 'prise_masse', label: '💪 Prise de masse' },
  { value: 'maintien', label: '⚖️ Maintien' },
  { value: 'force', label: '🏋️ Force' },
  { value: 'cardio', label: '🏃 Gain de cardio' },
];
const GOALS_EN = [
  { value: 'seche', label: '🔥 Cut' },
  { value: 'prise_masse', label: '💪 Bulk' },
  { value: 'maintien', label: '⚖️ Maintenance' },
  { value: 'force', label: '🏋️ Strength' },
  { value: 'cardio', label: '🏃 Cardio' },
];

const WEAK_MUSCLES_FR = ['Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Abdominaux', 'Fessiers', 'Quadriceps', 'Ischio-jambiers', 'Mollets'];
const WEAK_MUSCLES_EN = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Glutes', 'Quads', 'Hamstrings', 'Calves'];

const BODY_LABELS_FR = ['', 'Très mince', 'Mince', 'Fin athlétique', 'Svelte', 'Athlétique', 'Légèrement enrobé', 'Enrobé', 'Corpulent', 'Très corpulent', 'Surpoids élevé'];
const BODY_LABELS_EN = ['', 'Very thin', 'Thin', 'Athletic thin', 'Lean', 'Athletic', 'Slightly overweight', 'Overweight', 'Stocky', 'Very stocky', 'High overweight'];

export default function Profile() {
  const { t, language, getThemePersonality } = useTheme();
  const themePersonality = getThemePersonality();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(null);
  const [uploading, setUploading] = useState({});
  const isFR = language === 'fr';

  const GOALS = isFR ? GOALS_FR : GOALS_EN;
  const WEAK_MUSCLES = isFR ? WEAK_MUSCLES_FR : WEAK_MUSCLES_EN;
  const BODY_LABELS = isFR ? BODY_LABELS_FR : BODY_LABELS_EN;

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });
  const profile = profiles?.[0];

  useEffect(() => {
    if (profile && !formData) setFormData({ ...profile });
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success(isFR ? 'Profil mis à jour !' : 'Profile updated!');
    },
  });

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const toggleMuscle = (m) => setFormData(prev => ({
    ...prev,
    weak_muscles: (prev.weak_muscles || []).includes(m)
      ? prev.weak_muscles.filter(x => x !== m)
      : [...(prev.weak_muscles || []), m],
  }));

  const handlePhotoUpload = async (field, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [field]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update(field, file_url);
    setUploading(prev => ({ ...prev, [field]: false }));
  };

  if (isLoading || !formData) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" style={{ color: `hsl(${themePersonality.colors.primary})` }} /></div>;
  }

  const handleSave = () => {
    const cleaned = { ...formData };
    delete cleaned.id; delete cleaned.created_date; delete cleaned.updated_date; delete cleaned.created_by; delete cleaned.created_at; delete cleaned.updated_at;
    updateMutation.mutate(cleaned);
  };

  const score = Number(formData.body_type_score) || 5;
  const rangeStyle = { '--range-pct': `${((score - 1) / 9) * 100}%` };

  const photoLabels = isFR
    ? ['Face décontracté', 'Face contracté', 'Dos décontracté', 'Dos contracté']
    : ['Front relaxed', 'Front flexed', 'Back relaxed', 'Back flexed'];

  const photoFields = [
    { field: 'photo_front_relaxed', label: photoLabels[0] },
    { field: 'photo_front_flexed', label: photoLabels[1] },
    { field: 'photo_back_relaxed', label: photoLabels[2] },
    { field: 'photo_back_flexed', label: photoLabels[3] },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-3xl tracking-widest flex items-center gap-3" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
          <User className="h-7 w-7" style={{ color: `hsl(${themePersonality.colors.accent})` }} /> {t('profil')}
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm italic">"{isFR ? 'Ton profil, ta progression, tes résultats.' : 'Your profile, your progress, your results.'}"</p>
      </div>

      {/* Personal info */}
      <Card className="p-5 border-blue-100 shadow-sm bg-white">
        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider mb-4">{t('personalInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('firstName')}</Label>
            <Input value={formData.first_name || ''} onChange={e => update('first_name', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>{t('age')}</Label>
            <Input type="number" value={formData.age || ''} onChange={e => update('age', Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label>{t('gender')}</Label>
            <Select value={formData.gender || ''} onValueChange={v => update('gender', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homme">{isFR ? 'Homme' : 'Male'}</SelectItem>
                <SelectItem value="femme">{isFR ? 'Femme' : 'Female'}</SelectItem>
                <SelectItem value="autre">{isFR ? 'Autre' : 'Other'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('height')} (cm)</Label>
            <Input type="number" value={formData.height_cm || ''} onChange={e => update('height_cm', Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label>{t('weight')} (kg)</Label>
            <Input type="number" value={formData.weight_kg || ''} onChange={e => update('weight_kg', Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label>{t('fitnessLevel')}</Label>
            <Select value={formData.fitness_level || ''} onValueChange={v => update('fitness_level', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="debutant">🌱 {isFR ? 'Débutant' : 'Beginner'}</SelectItem>
                <SelectItem value="intermediaire">💪 {isFR ? 'Intermédiaire' : 'Intermediate'}</SelectItem>
                <SelectItem value="avance">🔥 {isFR ? 'Avancé' : 'Advanced'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Goal & behaviour */}
      <Card className="p-5 border-blue-100 shadow-sm bg-white">
        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider mb-4">
          {isFR ? 'Objectif & comportement' : 'Goal & Behaviour'}
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">{t('goal')}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GOALS.map(g => (
                <button key={g.value} onClick={() => update('goal', g.value)}
                  className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left ${formData.goal === g.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">{t('foodMode')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => update('food_mode', 'flexible')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${formData.food_mode === 'flexible' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
                <p className="font-semibold text-sm">😋 {isFR ? 'Flexible' : 'Flexible'}</p>
                <p className="text-xs text-muted-foreground">{isFR ? 'Cheat meals ok' : 'Cheat meals ok'}</p>
              </button>
              <button onClick={() => update('food_mode', 'strict')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${formData.food_mode === 'strict' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border hover:border-secondary/50'}`}>
                <p className="font-semibold text-sm">⚔️ {isFR ? 'Strict' : 'Strict'}</p>
                <p className="text-xs text-muted-foreground">{isFR ? 'Zéro écart' : 'Zero deviation'}</p>
              </button>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">{isFR ? "Jours d'entraînement / semaine" : 'Training days / week'}</Label>
            <div className="flex gap-2">
              {[2,3,4,5,6].map(n => (
                <button key={n} onClick={() => update('available_days', n)}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${Number(formData.available_days) === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}>
                  {n}{isFR ? 'j' : 'd'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Body type */}
      <Card className="p-5 border-blue-100 shadow-sm bg-white">
        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider mb-4">{t('bodyType')}</h3>
        <p className="text-xs text-muted-foreground mb-3">{isFR ? "Positionne-toi sur l'échelle" : 'Position yourself on the scale'}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">1</span>
            <input type="range" min="1" max="10" value={score} onChange={(e) => update('body_type_score', Number(e.target.value))} className="flex-1" style={rangeStyle} />
            <span className="text-xs text-muted-foreground">10</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{BODY_LABELS[1]}</span>
            <span className="text-lg">🧍</span>
            <span className="text-xs font-medium text-muted-foreground">{BODY_LABELS[10]}</span>
          </div>
          <p className="text-center text-sm font-semibold" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
            {BODY_LABELS[score] || (isFR ? 'Sélectionne ta morphologie' : 'Select your body type')}
          </p>
        </div>
        {formData.ai_morphology_note && (
          <div className="mt-3 bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm text-foreground">
            <p className="text-xs font-semibold text-primary mb-1">🧬 {isFR ? 'Analyse IA' : 'AI Analysis'}</p>
            {formData.ai_morphology_note}
          </div>
        )}
        <div className="mt-4">
          <Label className="mb-2 block">{t('weakMuscles')}</Label>
          <div className="flex flex-wrap gap-2">
            {WEAK_MUSCLES.map(m => (
              <button key={m} onClick={() => toggleMuscle(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${(formData.weak_muscles || []).includes(m) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Nutrition */}
      <Card className="p-5 border-blue-100 shadow-sm bg-white">
        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider mb-4">{isFR ? 'Alimentation' : 'Nutrition'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('dietaryPreference')}</Label>
            <Select value={formData.dietary_preference || ''} onValueChange={v => update('dietary_preference', v)}>
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
            <Label>{t('equipment')}</Label>
            <Select value={formData.equipment || ''} onValueChange={v => update('equipment', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aucun">🏠 {isFR ? 'Sans matériel' : 'No equipment'}</SelectItem>
                <SelectItem value="essentiel">🏋️ {isFR ? 'Salle essentielle' : 'Basic gym'}</SelectItem>
                <SelectItem value="salle_complete">🏟️ {isFR ? 'Salle complète' : 'Full gym'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Label>{t('allergies')}</Label>
          <Input value={formData.allergies || ''} onChange={e => update('allergies', e.target.value)} placeholder={isFR ? 'Lactose, noix...' : 'Lactose, nuts...'} className="mt-1" />
        </div>
        <div className="mt-4">
          <Label>{isFR ? 'Aliments préférés' : 'Favourite foods'}</Label>
          <Input value={formData.favorite_foods || ''} onChange={e => update('favorite_foods', e.target.value)} placeholder={isFR ? 'Poulet, riz, avocat...' : 'Chicken, rice, avocado...'} className="mt-1" />
        </div>
        <div className="mt-4">
          <Label>{isFR ? 'Aliments à éviter' : 'Foods to avoid'}</Label>
          <Input value={formData.disliked_foods || ''} onChange={e => update('disliked_foods', e.target.value)} placeholder={isFR ? 'Brocolis, foie gras...' : 'Broccoli, liver...'} className="mt-1" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label>{isFR ? 'Budget alimentaire' : 'Food budget'}</Label>
            <Select value={formData.budget_level || ''} onValueChange={v => update('budget_level', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={isFR ? 'Budget' : 'Budget'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="petit">💰 {isFR ? 'Petit budget' : 'Low budget'}</SelectItem>
                <SelectItem value="moyen">💳 {isFR ? 'Budget moyen' : 'Mid budget'}</SelectItem>
                <SelectItem value="confortable">💎 {isFR ? 'Confortable' : 'Comfortable'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{isFR ? 'Temps max cuisine (min)' : 'Max cooking time (min)'}</Label>
            <Input type="number" value={formData.max_cooking_time_min || ''} onChange={e => update('max_cooking_time_min', Number(e.target.value))} placeholder="30" className="mt-1" />
          </div>
        </div>
        <div className="mt-4">
          <Label>{isFR ? 'Poids cible (kg)' : 'Target weight (kg)'}</Label>
          <Input type="number" value={formData.target_weight || ''} onChange={e => update('target_weight', Number(e.target.value))} placeholder={isFR ? 'ex: 75' : 'e.g. 75'} className="mt-1" />
        </div>
        <div className="mt-4">
          <Label>{t('injuries')}</Label>
          <Textarea value={formData.injuries || ''} onChange={e => update('injuries', e.target.value)} placeholder={isFR ? 'Douleur au genou...' : 'Knee pain...'} className="mt-1 text-sm" />
        </div>
      </Card>

      {/* Badges */}
      <Card className="p-5 border-blue-100 shadow-sm bg-white">
        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider mb-4">🏆 Badges & Achievements</h3>
        <AchievementBadges profile={formData} />
      </Card>

      {/* Photos + AI */}
      <Card className="p-5 border-blue-100 shadow-sm bg-white">
        <h3 className="font-semibold text-sm text-blue-600 uppercase tracking-wider mb-1">
          {isFR ? 'Photos de suivi' : 'Progress Photos'}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {isFR ? 'Suivi avant/après -- privé et sécurisé' : 'Before/after tracking -- private & secure'}
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {photoFields.map(({ field, label }) => (
            <ProfilePhotoBox key={field} label={label} url={formData[field]} loading={uploading[field]}
              onFile={f => handlePhotoUpload(field, f)} themePersonality={themePersonality} language={language} />
          ))}
        </div>
        <div className="border-t border-slate-100 pt-4">
          <AIBodyAnalysis
            profile={formData}
            onSaveNote={(note) => {
              update('ai_morphology_note', note);
              updateMutation.mutate({ ai_morphology_note: note });
            }}
          />
        </div>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 text-white shadow-lg" style={{ background: `hsl(${themePersonality.colors.primary})` }}>
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t('save')}
        </Button>
      </div>
    </motion.div>
  );
}

function ProfilePhotoBox({ label, url, loading, onFile, themePersonality, language }) {
  const ref = useRef();
  return (
    <div onClick={() => ref.current?.click()}
      className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
      {loading ? (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: `hsl(${themePersonality?.colors.primary || '142 70% 48%'})` }} />
          <span className="text-xs">{language === 'fr' ? 'Envoi...' : 'Uploading...'}</span>
        </div>
      ) : url ? (
        <>
          <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 backdrop-blur-sm">
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
