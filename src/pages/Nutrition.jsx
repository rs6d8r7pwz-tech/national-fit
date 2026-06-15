import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Sparkles, Loader2, X, Star } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import MealCard from '@/components/nutrition/MealCard';
import AIRecipes from '@/components/nutrition/AIRecipes';
import FavoriteRecipes from '@/components/nutrition/FavoriteRecipes';
import MealPhotoScan from '@/components/nutrition/MealPhotoScan';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const getMealOptions = (isFR) => [
  { key: 'breakfast', label: isFR ? 'Petit-déjeuner' : 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: isFR ? 'Déjeuner' : 'Lunch', icon: '🍽️' },
  { key: 'snack', label: isFR ? 'Goûter' : 'Snack', icon: '🍎' },
  { key: 'dinner', label: isFR ? 'Dîner' : 'Dinner', icon: '🌙' },
];

function buildNutritionPrompt(profile, selectedMeals, lang = 'fr') {
  const isFR = lang === 'fr';
  const bodyScore = profile.body_type_score || 5;
  const selectedMealLabels = selectedMeals.map(m => m.label).join(', ');

  // Calcul calorique de base
  let baseCalories = 0;
  const weight = profile.weight_kg || 70;
  
  if (profile.goal === 'seche') {
    baseCalories = weight * 30;
  } else if (profile.goal === 'prise_masse') {
    baseCalories = weight * 40;
  } else {
    baseCalories = weight * 35;
  }

  if (bodyScore >= 7) {
    baseCalories -= 300;
  } else if (bodyScore <= 3) {
    baseCalories += 200;
  }

  // Répartition
  const hasBreakfast = selectedMeals.some(m => m.key === 'breakfast');
  const hasSnack = selectedMeals.some(m => m.key === 'snack');
  
  let breakfastPct = hasBreakfast ? 0.25 : 0;
  let lunchPct = 0.35;
  let snackPct = hasSnack ? 0.15 : 0;
  let dinnerPct = hasBreakfast ? 0.25 : 0.30;
  
  if (!hasBreakfast) {
    lunchPct += 0.10;
    dinnerPct += 0.10;
  }
  if (!hasSnack) {
    lunchPct += 0.075;
    dinnerPct += 0.075;
  }

  return `${isFR ? 'Tu es un nutritionniste sportif expert. Crée un plan alimentaire avec UNIQUEMENT les MACROS par repas.' : 'You are an expert sports nutritionist. Create a meal plan with ONLY MACROS per meal. ALL text MUST be in English.'}

PROFIL:
- Poids: ${profile.weight_kg}kg, Taille: ${profile.height_cm}cm, Âge: ${profile.age}
- Objectif: ${profile.goal}${profile.target_weight ? ` → poids cible: ${profile.target_weight}kg` : ''}
- Préférence: ${profile.dietary_preference}
- Morphologie: ${bodyScore}/10
- Repas: ${selectedMealLabels}
${profile.budget_level ? `- Budget: ${profile.budget_level}` : ''}
${profile.max_cooking_time_min ? `- Temps de cuisine max: ${profile.max_cooking_time_min} minutes (recettes rapides impératives)` : ''}
${profile.favorite_foods ? `- Aliments préférés (à inclure): ${profile.favorite_foods}` : ''}
${profile.disliked_foods ? `- Aliments à ÉVITER absolument: ${profile.disliked_foods}` : ''}
${profile.allergies ? `- Allergies: ${profile.allergies}` : ''}

TOTAL: ${baseCalories} kcal/jour

RÉPARTITION:
${hasBreakfast ? `- Petit-déjeuner: ${Math.round(baseCalories * breakfastPct)} kcal` : ''}
- Déjeuner: ${Math.round(baseCalories * lunchPct)} kcal
${hasSnack ? `- Goûter: ${Math.round(baseCalories * snackPct)} kcal` : ''}
- Dîner: ${Math.round(baseCalories * dinnerPct)} kcal

RÈGLES:
1. Format UNIQUEMENT: "Xg protéines + Yg glucides + Zg lipides"
2. PAS de recettes, PAS de noms de plats
3. Ajouter 1 exemple d'aliments entre parenthèses
4. Adapter à l'objectif: sèche = moins de glucides, prise de masse = plus de glucides

FORMAT JSON OBLIGATOIRE:
{
  "title": "Plan [objectif]",
  "description": "Plan alimentaire personnalisé",
  "daily_calories": ${baseCalories},
  "protein_g": total,
  "carbs_g": total,
  "fat_g": total,
  "dietary_preference": "${profile.dietary_preference}",
  "meals": [
    {
      "meal_type": "breakfast|lunch|snack|dinner",
      "name": "Macros [repas]",
      "ingredients": ["exemple aliment 1", "exemple aliment 2"],
      "calories": nombre,
      "protein_g": nombre,
      "carbs_g": nombre,
      "fat_g": nombre,
      "instructions": "Xg protéines + Yg glucides + Zg lipides (= exemples concrets)"
    }
  ]
}`;
}

export default function Nutrition() {
  const { t, language, getThemePersonality, getRandomMotivationalQuote } = useTheme();
  const themePersonality = getThemePersonality();
  const motivationalQuote = getRandomMotivationalQuote();
  const isFR = language === 'fr';
  const MEAL_OPTIONS = getMealOptions(isFR);
  const [generating, setGenerating] = useState(false);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState(['breakfast', 'lunch', 'snack', 'dinner']);
  const [activeTab, setActiveTab] = useState('plans');
  const queryClient = useQueryClient();

  const { data: favorites } = useQuery({
    queryKey: ['favoriteRecipes'],
    queryFn: () => base44.entities.FavoriteRecipe.list('-created_at'),
    initialData: [],
  });

  const createFavoriteMutation = useMutation({
    mutationFn: (data) => base44.entities.FavoriteRecipe.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoriteRecipes'] }),
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: (id) => base44.entities.FavoriteRecipe.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoriteRecipes'] }),
  });

  const handleToggleFavorite = async (recipeData) => {
    try {
      await createFavoriteMutation.mutateAsync(recipeData);
    } catch (error) {
      console.error('Erreur ajout favori:', error);
    }
  };

  const { data: plans, isLoading } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_at'),
    initialData: [],
  });

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  const profile = profiles?.[0];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MealPlan.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mealPlans'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MealPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mealPlans'] }),
  });

  const generatePlan = async () => {
    if (!profile || generating) return;
    
    setGenerating(true);

    try {
      const mealsToGenerate = MEAL_OPTIONS.filter(m => selectedMeals.includes(m.key));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildNutritionPrompt(profile, mealsToGenerate, language),
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            daily_calories: { type: "number" },
            protein_g: { type: "number" },
            carbs_g: { type: "number" },
            fat_g: { type: "number" },
            dietary_preference: { type: "string" },
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  meal_type: { type: "string" },
                  name: { type: "string" },
                  ingredients: { type: "array", items: { type: "string" } },
                  calories: { type: "number" },
                  protein_g: { type: "number" },
                  carbs_g: { type: "number" },
                  fat_g: { type: "number" },
                  instructions: { type: "string" }
                },
                required: ["meal_type", "name", "calories", "protein_g", "carbs_g", "fat_g", "instructions"]
              }
            }
          },
          required: ["title", "meals"]
        }
      });

      if (result && result.meals && result.meals.length > 0) {
        const planData = {
          title: result.title || `Plan ${profile.goal}`,
          description: result.description || 'Plan alimentaire personnalisé',
          daily_calories: result.daily_calories,
          protein_g: result.protein_g,
          carbs_g: result.carbs_g,
          fat_g: result.fat_g,
          dietary_preference: result.dietary_preference || profile.dietary_preference,
          meals: result.meals
        };
        
        // Attendre que la mutation soit complète avant de fermer
        await createMutation.mutateAsync(planData);
        
        // Reset immédiat pour éviter double appel
        setGenerating(false);
        setShowMealSelector(false);
        setSelectedMeals(['breakfast', 'lunch', 'snack', 'dinner']);
        return; // Sortie explicite
      } else {
        console.error('Résultat invalide:', result);
      }
    } catch (error) {
      console.error('Erreur génération plan:', error);
    } finally {
      if (generating) setGenerating(false);
    }
  };

  const toggleMeal = (mealKey) => {
    setSelectedMeals(prev => {
      if (prev.includes(mealKey)) {
        // Cannot deselect last meal
        if (prev.length === 1) return prev;
        return prev.filter(m => m !== mealKey);
      }
      return [...prev, mealKey];
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-widest flex items-center gap-3" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
            <UtensilsCrossed className="h-7 w-7" style={{ color: `hsl(${themePersonality.colors.accent})` }} /> {t('nutrition')}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm italic">
            "{motivationalQuote}"
            {profile?.meals_per_day && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full not-italic font-heading tracking-wider" style={{ background: `hsla(${themePersonality.colors.accent}, 0.1)`, color: `hsl(${themePersonality.colors.accent})` }}>
                {profile.meals_per_day} {t('mealsPerDay')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MealPhotoScan isFR={isFR} />
          <Button onClick={() => { 
            if (!profile?.weight_kg || !profile?.height_cm) {
              alert(isFR ? '⚠️ Complète ton profil (poids et taille) avant de générer un plan alimentaire.' : '⚠️ Please complete your profile (weight and height) before generating a meal plan.');
              return;
            }
            setShowMealSelector(true); setSelectedMeals(['breakfast', 'lunch', 'snack', 'dinner']); 
          }} disabled={!profile || generating} className="gap-2 text-white shadow-lg" style={{ background: `hsl(${themePersonality.colors.primary})` }}>
            <Sparkles className="h-4 w-4" />
            {t('newPlan')}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showMealSelector && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl p-6 shadow-lg border border-blue-200"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-2xl tracking-widest" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
                🍽️ {language === 'fr' ? 'Choisis tes repas' : 'Choose your meals'}
              </h2>
              <button onClick={() => setShowMealSelector(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <CardDescription className="mb-4">
              {language === 'fr' 
                ? 'Sélectionne les repas que tu souhaites inclure dans ton plan alimentaire. Les quantités seront ajustées selon ton objectif.'
                : 'Select the meals you want to include in your meal plan. Quantities will be adjusted based on your goal.'}
            </CardDescription>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {MEAL_OPTIONS.map((meal) => (
                <button
                  key={meal.key}
                  onClick={() => toggleMeal(meal.key)}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedMeals.includes(meal.key)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/30 bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedMeals.includes(meal.key)}
                      className="border-2 border-primary data-[state=checked]:bg-primary"
                    />
                    <div className="text-left">
                      <p className="text-2xl">{meal.icon}</p>
                      <p className="text-sm font-semibold mt-1">{meal.label}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Badge variant="outline" className="text-xs">
                {selectedMeals.length} {language === 'fr' ? 'repas sélectionnés' : 'meals selected'}
              </Badge>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  generatePlan();
                }} 
                disabled={generating || selectedMeals.length === 0}
                className="gap-2 text-white"
                style={{ background: `hsl(${themePersonality.colors.primary})` }}
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? t('generating') : t('generer')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" style={{ color: `hsl(${themePersonality.colors.primary})` }} /></div>
      ) : null}

      {/* Tabs for Plans, Recipes, Favorites */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">{t('mealPlan')}</TabsTrigger>
          <TabsTrigger value="recipes">{isFR ? 'Recettes IA' : 'AI Recipes'}</TabsTrigger>
          <TabsTrigger value="favorites">
            <Star className="h-4 w-4 mr-1" />
            {language === 'fr' ? 'Favoris' : 'Favorites'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          {plans.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `hsla(${themePersonality.colors.primary}, 0.1)`, border: `1px solid hsla(${themePersonality.colors.primary}, 0.3)` }}>
                <UtensilsCrossed className="h-10 w-10" style={{ color: `hsl(${themePersonality.colors.primary})` }} />
              </div>
              <h3 className="font-heading text-2xl tracking-wider" style={{ color: `hsl(${themePersonality.colors.primary})` }}>{t('emptyPlate')}</h3>
              <p className="text-muted-foreground mt-2 italic">"{language === 'fr' ? 'Génère ton plan alimentaire personnalisé.' : 'Generate your personalized meal plan.'}"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map(p => (
                <MealCard key={p.id} plan={p} onDelete={(id) => deleteMutation.mutate(id)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recipes" className="mt-4">
          <AIRecipes profile={profile} activePlan={plans?.[0]} onToggleFavorite={handleToggleFavorite} />
        </TabsContent>

        <TabsContent value="favorites" className="mt-4">
          <FavoriteRecipes favorites={favorites} onRemove={(id) => deleteFavoriteMutation.mutate(id)} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}