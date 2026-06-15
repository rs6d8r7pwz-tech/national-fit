import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Sparkles, Loader2, AlertTriangle, X, ChevronRight, ChevronLeft, Star } from 'lucide-react';
import ProgramPDFExport from '@/components/programs/ProgramPDFExport';
import WorkoutCardEnhanced from '@/components/programs/WorkoutCardEnhanced';
import ExercisePreferences from '@/components/programs/ExercisePreferences';
import ProgramSummaryModal from '@/components/programs/ProgramSummaryModal';
import ProgramEditor from '@/components/programs/ProgramEditor';
import ProgramQuestionnaire from '@/components/programs/ProgramQuestionnaire';
import FavoritePrograms from '@/components/programs/FavoritePrograms';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GeneratingLoader from '@/components/ui/GeneratingLoader';
import { usePremium } from '@/hooks/usePremium';
import SmartPaywall from '@/components/premium/SmartPaywall';

export default function Programs() {
  const { t, language, getRandomMotivationalQuote, getThemePersonality } = useTheme();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  const [preferences, setPreferences] = useState({});
  const [generating, setGenerating] = useState(false);
  const [warning, setWarning] = useState(null);
  const [pendingProgram, setPendingProgram] = useState(null);
  const [pendingAiSummary, setPendingAiSummary] = useState('');
  const [pendingMuscleSummary, setPendingMuscleSummary] = useState('');
  const [editingProgram, setEditingProgram] = useState(null);
  const [activeTab, setActiveTab] = useState('programs');
  const [showPaywall, setShowPaywall] = useState(false);
  const queryClient = useQueryClient();
  
  const themePersonality = getThemePersonality();
  const motivationalQuote = getRandomMotivationalQuote();
  const { isPremium } = usePremium();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list('-created_at'),
    initialData: [],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  const profile = profiles?.[0];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutProgram.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkoutProgram.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });

  const openWizard = () => {
    // Limite FREE : 1 programme maximum
    if (!isPremium && programs.length >= 1) {
      setShowPaywall(true);
      return;
    }
    const activeUnfinished = programs.find(p => p.is_active && !p.completed && (p.sessions_done || 0) < (p.total_sessions || 1));
    if (activeUnfinished) {
      const done = activeUnfinished.sessions_done || 0;
      const total = activeUnfinished.total_sessions || activeUnfinished.sessions?.length || 1;
      setWarning({ program: activeUnfinished, remaining: total - done });
      return;
    }
    setWizardOpen(true);
    setWizardStep(0);
    setQuestionnaireAnswers({});
    setPreferences({});
  };

  const generateProgram = async () => {
    if (!profile) return;
    setGenerating(true);

    const muscleLabels = language === 'fr'
      ? { chest: 'Pectoraux', back: 'Dos', legs: 'Jambes', shoulders: 'Épaules', arms: 'Bras', core: 'Abdos/Core' }
      : { chest: 'Chest', back: 'Back', legs: 'Legs', shoulders: 'Shoulders', arms: 'Arms', core: 'Abs/Core' };
    const prefDesc = Object.entries(preferences)
      .filter(([, slots]) => slots && typeof slots === 'object')
      .map(([muscle, slots]) => {
        const exNames = Object.values(slots).filter(Boolean).join(', ');
        return `${muscleLabels[muscle] || muscle}: ${exNames}`;
      }).join(' | ');
    const totalSessions = (profile.available_days || 3) * 4;

    const equipmentMap = {
      aucun: 'POIDS DU CORPS UNIQUEMENT -- ZÉRO matériel (aucune barre, aucun haltère, aucune machine)',
      essentiel: 'matériel basique accessible à domicile : haltères, barre de traction murale, bande élastique, banc simple -- AUCUNE machine de salle de sport',
      salle_complete: 'salle de sport complète : toutes les machines, câbles, presses, rack, haltères, barres olympiques',
    };

    // Intensité → volume/repos
    const intensityConfig = {
      relax: { sets: 2, reps: '12-15', rest: 60, cardio: true },
      modere: { sets: 3, reps: '10-12', rest: 90, cardio: false },
      intense: { sets: 4, reps: '6-10', rest: 120, cardio: false },
      extreme: { sets: 5, reps: '4-8', rest: 150, cardio: false },
    };

    const intensityData = intensityConfig[questionnaireAnswers.intensity] || intensityConfig.modere;

    const sessionModeInstructions = {
      musculation: 'Focus hypertrophie : temps sous tension, 8-12 reps, volume modéré à élevé',
      force: 'Focus force maximale : charges lourdes, 3-6 reps, longs repos (180-240s)',
      cardio: 'Focus endurance : circuits, peu de repos, 15-20 reps, cardio intégré',
      mixte: 'Combinaison force + cardio : alterne blocs de force et blocs cardio',
    };

    const sessionModeData = sessionModeInstructions[questionnaireAnswers.sessionMode] || sessionModeInstructions.musculation;

    const goalInstructions = {
      seche: 'Privilégier circuits + cardio. Volume : 3×15-20 reps. Inclure 1 bloc cardio/HIIT par séance.',
      prise_masse: 'Exercices composés lourds priorité. Volume : 4×6-10 reps. Peu de cardio.',
      maintien: 'Équilibre force/cardio. Volume : 3×10-12 reps.',
      force: 'Focus charges lourdes. Volume : 5×3-5 reps. Longs temps de repos (120-180s).',
      cardio: 'Circuits dynamiques, endurance. Peu de repos. Cardio mixte.',
    };

    const sessionModeExercises = {
      musculation: 'Exercices de musculation traditionnels avec charges (haltères, barres, machines)',
      cardio: 'Exercices cardiovasculaires UNIQUEMENT : vélo, tapis de course, escalier, corde à sauter, jumping jacks, burpees, mountain climbers, high knees, etc. AUCUN exercice de musculation avec charges.',
      force: 'Exercices de force pure avec charges très lourdes',
      mixte: 'Alterner blocs de musculation et blocs cardio',
    };

    const weakMusclesText = (profile.weak_muscles || []).length > 0
      ? `Muscles prioritaires à cibler : ${profile.weak_muscles.join(', ')}`
      : 'Pas de priorité musculaire spécifique';

    const focusInstructions = {
      fullbody: 'Répartition équilibrée sur tous les groupes musculaires',
      split_standard: 'SPLIT : chaque séance cible 1-2 groupes musculaires spécifiques (ex: Pec+Triceps, Dos+Biceps, Épaules+Jambes)',
      push_pull: 'PUSH/PULL : alterne séances Pousser (Pec/Épaules/Triceps) et Tirer (Dos/Biceps)',
      lower_body: 'FOCUS BAS DU CORPS UNIQUEMENT : squats, fentes, presse, mollets, ischio-jambiers, quadriceps. AUCUN exercice haut du corps.',
      upper_body: 'FOCUS HAUT DU CORPS UNIQUEMENT : pec, dos, épaules, bras. AUCUN exercice jambes.',
      core: 'FOCUS ABDOS/CORE UNIQUEMENT : planche, crunch, russian twist, leg raise. AUCUN autre groupe musculaire.',
    };

    const lang = language === 'fr' ? 'French' : 'English';
    const prompt = language === 'fr'
      ? `Tu es un coach sportif expert certifié. Crée un programme d'entraînement COMPLET, PERSONNALISÉ et PROGRESSIF en français.`
      : `You are a certified expert sports coach. Create a COMPLETE, PERSONALIZED and PROGRESSIVE training program in English.`;

    const fullPrompt = `${prompt}

${language === 'fr' ? 'PROFIL UTILISATEUR' : 'USER PROFILE'}:
- ${language === 'fr' ? 'Prénom' : 'Name'}: ${profile.first_name}
- ${language === 'fr' ? 'Niveau' : 'Level'}: ${profile.fitness_level}
- ${language === 'fr' ? 'Objectif' : 'Goal'}: ${profile.goal}
- ${language === 'fr' ? 'Jours/semaine' : 'Days/week'}: ${profile.available_days}
- ${language === 'fr' ? 'Équipement' : 'Equipment'}: ${equipmentMap[profile.equipment] || profile.equipment}
- ${language === 'fr' ? 'Morphologie (1=mince/10=corpulent)' : 'Body type (1=lean/10=heavy)'}: ${profile.body_type_score || 5}/10
- ${language === 'fr' ? 'Genre' : 'Gender'}: ${profile.gender}, ${language === 'fr' ? 'Âge' : 'Age'}: ${profile.age}, ${language === 'fr' ? 'Poids' : 'Weight'}: ${profile.weight_kg}kg, ${language === 'fr' ? 'Taille' : 'Height'}: ${profile.height_cm}cm
- ${language === 'fr' ? 'Blessures' : 'Injuries'}: ${profile.injuries || (language === 'fr' ? 'Aucune' : 'None')}
- ${weakMusclesText}
- ${language === 'fr' ? 'Mode alimentaire' : 'Diet mode'}: ${profile.food_mode || 'flexible'}

${language === 'fr' ? 'INSTRUCTIONS OBJECTIF' : 'GOAL INSTRUCTIONS'}: ${goalInstructions[profile.goal] || '3×10-12 reps balanced'}

${language === 'fr' ? 'PRÉFÉRENCES EXERCICES' : 'EXERCISE PREFERENCES'}: ${prefDesc || (language === 'fr' ? 'Libre choix optimal' : 'Free optimal choice')}

${language === 'fr' ? 'TYPE DE SÉANCE' : 'SESSION TYPE'}: ${questionnaireAnswers.sessionMode || 'musculation'}
${sessionModeExercises[questionnaireAnswers.sessionMode] || (language === 'fr' ? 'Exercices standards' : 'Standard exercises')}

${language === 'fr' ? 'QUESTIONNAIRE UTILISATEUR' : 'USER QUESTIONNAIRE'}:
- ${language === 'fr' ? 'Durée' : 'Duration'}: ${questionnaireAnswers.duration || 'standard'} (${questionnaireAnswers.duration === 'express' ? '15-30min' : questionnaireAnswers.duration === 'complet' ? '1h30-2h' : '45-60min'})
- ${language === 'fr' ? 'Type de séance' : 'Session type'}: ${questionnaireAnswers.sessionMode || 'musculation'} (${sessionModeData})
- ${language === 'fr' ? 'Intensité' : 'Intensity'}: ${questionnaireAnswers.intensity || 'modere'}
- Focus: ${questionnaireAnswers.focus || 'fullbody'}
- ${language === 'fr' ? 'Muscles prioritaires' : 'Priority muscles'}: ${(questionnaireAnswers.priorityMuscles || []).join(', ') || (language === 'fr' ? 'aucun' : 'none')}
- ${language === 'fr' ? 'Muscles à exclure' : 'Exclude muscles'}: ${(questionnaireAnswers.excludeMuscles || []).join(', ') || (language === 'fr' ? 'aucun' : 'none')}
- ${language === 'fr' ? 'Équipement' : 'Equipment'}: ${equipmentMap[questionnaireAnswers.equipment] || questionnaireAnswers.equipment || profile.equipment}

${language === 'fr' ? 'RÈGLES OBLIGATOIRES' : 'MANDATORY RULES'}:
 1. Exactly ${profile.available_days} sessions per week spread over days (Monday/Wednesday/etc.)
 2. Total ${totalSessions} sessions (4 weeks)
 3. Each session: 5-7 well-structured exercises
 4. For each exercise: propose an ALTERNATIVE (same muscle group)
 5. ⚠️ STRICT EQUIPMENT -- ${equipmentMap[questionnaireAnswers.equipment || profile.equipment]}
 6. SESSION MODE: ${sessionModeData}
 7. Rest time: ${intensityData.rest}s between sets, ${intensityData.sets} sets of ${intensityData.reps} reps
 8. ${questionnaireAnswers.intensity === 'relax' ? 'Include stretching and mobility' : questionnaireAnswers.intensity === 'extreme' ? 'Maximum volume, heavy weights' : 'Progressive and balanced'}
 9. Focus: ${questionnaireAnswers.focus || 'fullbody'}
10. ${questionnaireAnswers.priorityMuscles?.length ? `REINFORCE: ${questionnaireAnswers.priorityMuscles.join(', ')} -- more volume on these muscles` : ''}
11. ${questionnaireAnswers.excludeMuscles?.length ? `EXCLUDE: ${questionnaireAnswers.excludeMuscles.join(', ')} -- no exercises targeting these muscles` : ''}
12. ⚠️ STRICTLY FOLLOW session mode: if cardio = cardio exercises ONLY, if bodybuilding = bodybuilding exercises
13. Useful technical notes for each exercise
14. ALL text (exercise names, session names, notes, descriptions) MUST be in ${lang}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          level: { type: "string" },
          goal: { type: "string" },
          ai_summary: { type: "string" },
          muscle_focus_summary: { type: "string", description: language === 'fr' ? "Résumé détaillé des zones musculaires ciblées par groupe (ex: pec = haut/medio/bas, dos = largeur/épaisseur, etc.)" : "Detailed summary of targeted muscle areas by group (e.g., pec = upper/mid/lower, back = width/thickness, etc.)" },
          sessions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                name: { type: "string" },
                exercises: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      alternative: { type: "string" },
                      sets: { type: "number" },
                      reps: { type: "string" },
                      rest_seconds: { type: "number" },
                      notes: { type: "string" },
                      muscle_group: { type: "string" },
                      target_areas: { type: "string", description: language === 'fr' ? "Zones musculaires précises ciblées (ex: haut du pec, vaste externe, etc.)" : "Specific targeted muscle areas (e.g., upper pec, vastus lateralis, etc.)" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const { ai_summary, muscle_focus_summary, ...programData } = result;
    
    // Nettoyer et valider la structure des sessions
    const cleanSessions = (programData.sessions || []).map((session, idx) => {
      if (!session || typeof session !== 'object') {
        return {
          day: `Jour ${idx + 1}`,
          name: `Séance ${idx + 1}`,
          exercises: []
        };
      }
      return {
        day: session.day || (language === 'fr' ? `Jour ${idx + 1}` : `Day ${idx + 1}`),
        name: session.name || (language === 'fr' ? `Séance ${idx + 1}` : `Session ${idx + 1}`),
        exercises: (session.exercises || []).map(ex => ({
          name: ex.name || (language === 'fr' ? 'Exercice' : 'Exercise'),
          alternative: ex.alternative || (language === 'fr' ? 'Variante' : 'Alternative'),
          sets: ex.sets || intensityData.sets,
          reps: ex.reps || intensityData.reps,
          rest_seconds: ex.rest_seconds || intensityData.rest,
          notes: ex.notes || '',
          muscle_group: ex.muscle_group || 'general',
          target_areas: ex.target_areas || ''
        }))
      };
    });
    
    setPendingProgram({
      ...programData,
      sessions: cleanSessions,
      total_sessions: totalSessions,
      sessions_done: 0,
      completed: false,
      is_active: true,
      exercise_preferences: preferences,
      body_type_score: profile.body_type_score,
      weak_muscles: profile.weak_muscles || [],
    });
    setPendingAiSummary(ai_summary || '');
    setPendingMuscleSummary(muscle_focus_summary || '');
    setGenerating(false);
    setWizardOpen(false);
  };

  const confirmProgram = async () => {
    await createMutation.mutateAsync(pendingProgram);
    setPendingProgram(null);
    setPendingAiSummary('');
    setPreferences({});
  };

  const hasPrefs = Object.values(preferences).some(v => (Array.isArray(v) ? v.length > 0 : !!v));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-6">
      <SmartPaywall trigger={showPaywall} reason="program_limit" onClose={() => setShowPaywall(false)} />
      <GeneratingLoader visible={generating} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-widest flex items-center gap-3" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
            <Dumbbell className="h-7 w-7" style={{ color: `hsl(${themePersonality.colors.accent})` }} /> {t('myPrograms')}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm italic">"{motivationalQuote}"</p>
        </div>
        <Button onClick={openWizard} disabled={!profile} className="gap-2 font-heading tracking-wider shadow-lg hulk-glow" style={{ background: `hsl(${themePersonality.colors.primary})` }}>
          <Sparkles className="h-4 w-4" />
          {t('newProgram')}
        </Button>
      </div>

      <AnimatePresence>
        {warning && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-orange-400 text-sm">{language === 'fr' ? 'Programme en cours non terminé' : 'Ongoing program not finished'}</p>
              <p className="text-orange-300 text-sm mt-1">
                {language === 'fr' ? `Il reste` : `There are`} <strong>{warning.remaining} {language === 'fr' ? `séance${warning.remaining > 1 ? 's' : ''}` : `session${warning.remaining > 1 ? 's' : ''}`}</strong> {language === 'fr' ? 'sur' : 'left in'} "<em>{warning.program.title}</em>".
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  onClick={() => { setWarning(null); setWizardOpen(true); setWizardStep(0); setPreferences({}); }}>
                  {language === 'fr' ? 'Créer quand même' : 'Create anyway'}
                </Button>
                <Button size="sm" className="text-xs bg-orange-500/80 hover:bg-orange-500 text-white" onClick={() => setWarning(null)}>
                  {language === 'fr' ? 'Continuer' : 'Continue'}
                </Button>
              </div>
            </div>
            <button onClick={() => setWarning(null)}><X className="h-4 w-4 text-orange-300 hover:text-orange-200" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wizardOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
            className="rounded-2xl p-6 shadow-lg border border-blue-200"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-2xl tracking-widest" style={{ color: `hsl(${themePersonality.colors.primary})` }}>⚡ {t('createProgram')}</h2>
              <button onClick={() => setWizardOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            {wizardStep === 0 && (
              <ProgramQuestionnaire
                answers={questionnaireAnswers}
                onChange={setQuestionnaireAnswers}
                onNext={() => setWizardStep(1)}
              />
            )}

            {wizardStep === 1 && (
              <ExercisePreferences 
                preferences={preferences} 
                onChange={setPreferences} 
                profile={{...profile, sessionMode: questionnaireAnswers.sessionMode}}
                onAutoGenerate={async () => {
                  // Appel IA pour générer les préférences auto
                  setGenerating(true);
                  const sessionMode = questionnaireAnswers.sessionMode || 'musculation';
                  const isCardio = sessionMode === 'cardio';
                  const prompt = `Profil: ${profile.first_name}, objectif=${profile.goal}, morphologie=${profile.body_type_score}/10, niveau=${profile.fitness_level}, équipement=${profile.equipment}, muscles faibles=${(profile.weak_muscles||[]).join(',') || 'aucun'}.
Mode de séance: ${sessionMode}
${isCardio ? 'MODE CARDIO : Recommande UNIQUEMENT des exercices cardio (vélo, tapis, rameur, burpees, mountain climbers, jumping jacks, corde à sauter, high knees, etc.). AUCUN exercice de musculation.' : 'Recommande UN exercice par slot (3 slots) pour chaque groupe musculaire (chest, back, legs, shoulders, arms, core).'}
Réponds UNIQUEMENT au format JSON:
${isCardio ? `{
  "cardio_main": {
    "0": "valeur_exo_cardio_steady",
    "1": "valeur_exo_hiit",
    "2": "valeur_exo_agilite"
  }
}` : `{
  "chest": {"0": "valeur_exo_principal", "1": "valeur_exo_incline", "2": "valeur_exo_iso"},
  "back": {"0": "...", "1": "...", "2": "..."},
  "legs": {"0": "...", "1": "...", "2": "..."},
  "shoulders": {"0": "...", "1": "...", "2": "..."},
  "arms": {"0": "...", "1": "...", "2": "..."},
  "core": {"0": "...", "1": "...", "2": "..."}
}`}
`;
                  try {
                    const recs = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: { type: "object" } });
                    setPreferences(recs || {});
                  } catch (e) {
                    console.error('Auto-génération échouée', e);
                  }
                  setGenerating(false);
                }}
              />
            )}

            {wizardStep === 1 && (
              <div className="text-center py-6 space-y-4">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl" style={{ background: `linear-gradient(135deg, hsl(${themePersonality.colors.primary}), hsl(${themePersonality.colors.accent}))`, boxShadow: `0 0 30px hsla(${themePersonality.colors.primary}, 0.4)` }}>
                  <span className="text-3xl font-heading text-white font-bold">{themePersonality.name[0]}</span>
                </div>
                <h3 className="font-heading text-2xl tracking-wider" style={{ color: `hsl(${themePersonality.colors.primary})` }}>{t('personnalisation') || 'PERSONNALISATION'}</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  {language === 'fr' ? 'Choisis tes exercices préférés pour chaque groupe musculaire, ou utilise la génération auto.' : 'Choose your favorite exercises for each muscle group, or use auto-generation.'}
                </p>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="text-center py-6 space-y-4">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl" style={{ background: `linear-gradient(135deg, hsl(${themePersonality.colors.primary}), hsl(${themePersonality.colors.accent}))`, boxShadow: `0 0 30px hsla(${themePersonality.colors.primary}, 0.4)` }}>
                  <span className="text-3xl font-heading text-white font-bold">{themePersonality.name[0]}</span>
                </div>
                <h3 className="font-heading text-2xl tracking-wider" style={{ color: `hsl(${themePersonality.colors.primary})` }}>{language === 'fr' ? 'PRÊT À DÉMARRER !' : 'READY TO START!'}</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  {language === 'fr' ? 'Programme IA adapté à :' : 'AI program customized for:'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge className="bg-green-500/15 text-green-400 border border-green-500/30">
                    {questionnaireAnswers.duration || 'standard'}
                  </Badge>
                  <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {questionnaireAnswers.sessionMode || 'musculation'}
                  </Badge>
                  <Badge className="bg-green-500/15 text-green-400 border border-green-500/30">
                    {questionnaireAnswers.intensity || 'modere'}
                  </Badge>
                  <Badge className="bg-green-500/15 text-green-400 border border-green-500/30">
                    {questionnaireAnswers.focus || 'fullbody'}
                  </Badge>
                  {questionnaireAnswers.priorityMuscles?.length > 0 && (
                    <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/30">
                      Focus: {questionnaireAnswers.priorityMuscles.join(', ')}
                    </Badge>
                  )}
                  {questionnaireAnswers.excludeMuscles?.length > 0 && (
                    <Badge className="bg-red-500/15 text-red-400 border border-red-500/30">
                      Exclut: {questionnaireAnswers.excludeMuscles.join(', ')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr' ? "L'IA va générer un programme avec alternatives d'exercices et résumé explicatif." : 'AI will generate a program with exercise alternatives and explanatory summary.'}
                </p>
                {Object.entries(preferences).length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Object.entries(preferences).flatMap(([muscle, slots]) =>
                      Object.values(slots || {}).filter(Boolean).map((val, i) => (
                        <span key={`${muscle}-${i}`} className="bg-green-500/15 text-green-400 text-xs px-3 py-1 rounded-full font-medium">{val.split('_').slice(2).join(' ') || val}</span>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <Button variant="ghost" onClick={() => wizardStep === 0 ? setWizardOpen(false) : setWizardStep(wizardStep - 1)} className="text-muted-foreground">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {wizardStep === 0 ? t('annuler') : t('retour')}
              </Button>
              {wizardStep === 0 ? (
                <Button onClick={() => setWizardStep(1)} disabled={!questionnaireAnswers.duration || !questionnaireAnswers.intensity} className="gap-1 text-white" style={{ background: `hsl(${themePersonality.colors.primary})` }}>
                  {t('suivant')} <ChevronRight className="h-4 w-4" />
                </Button>
              ) : wizardStep === 1 ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setWizardStep(2)} className="text-muted-foreground text-sm gap-1">
                    {language === 'fr' ? 'Passer' : 'Skip'} <ChevronRight className="h-4 w-4" />
                  </Button>
                  {hasPrefs && (
                    <Button onClick={() => setWizardStep(2)} className="gap-1 text-white" style={{ background: `hsl(${themePersonality.colors.primary})` }}>
                      {t('suivant')} <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <Button onClick={generateProgram} disabled={generating} className="gap-2 text-white hulk-glow" style={{ background: `hsl(${themePersonality.colors.primary})` }}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? t('iaGenere') : t('generer')}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingProgram && (
          <ProgramSummaryModal
            program={pendingProgram}
            profile={profile}
            aiSummary={pendingAiSummary}
            muscleFocusSummary={pendingMuscleSummary}
            onConfirm={confirmProgram}
            onModify={() => { setEditingProgram(pendingProgram); setPendingProgram(null); }}
            onClose={() => { setPendingProgram(null); setPendingMuscleSummary(''); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingProgram && (
          <ProgramEditor
            program={editingProgram}
            onSave={(updated) => { setPendingProgram(updated); setEditingProgram(null); }}
            onClose={() => { setPendingProgram(editingProgram); setEditingProgram(null); }}
          />
        )}
      </AnimatePresence>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/[0.05] border border-white/[0.08]">
          <TabsTrigger value="programs" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Dumbbell className="h-4 w-4 mr-1.5" />
            {t('myPrograms')}
          </TabsTrigger>
          <TabsTrigger value="favorites" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Star className="h-4 w-4 mr-1.5" />
            {language === 'fr' ? 'Favoris' : 'Favorites'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" style={{ color: `hsl(${themePersonality.colors.primary})` }} /></div>
          ) : programs.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `hsla(${themePersonality.colors.primary}, 0.1)`, border: `1px solid hsla(${themePersonality.colors.primary}, 0.3)` }}>
                <Dumbbell className="h-10 w-10" style={{ color: `hsl(${themePersonality.colors.primary})` }} />
              </div>
              <h3 className="font-heading text-2xl tracking-wider" style={{ color: `hsl(${themePersonality.colors.primary})` }}>{t('noPrograms')}</h3>
              <p className="text-muted-foreground mt-2 italic">"{language === 'fr' ? "Chaque champion a commencé par sa première séance. Lance-toi !" : "Every champion started with their first session. Let's go!"}"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {programs.map(p => (
                    <WorkoutCardEnhanced
                      key={p.id}
                      program={p}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onUpdate={() => queryClient.invalidateQueries({ queryKey: ['programs'] })}
                      onToggleFavorite={async (data) => {
                        await base44.entities.FavoriteProgram.create(data);
                      }}
                    />
                  ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-4">
          <FavoritePrograms 
            onToggleFavorite={async (data) => {
              await base44.entities.FavoriteProgram.create(data);
            }}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}