import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ChefHat, Sparkles, Loader2, Clock, Zap, ChevronDown, ChevronUp, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTheme } from '@/lib/ThemeContext';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Petit-déjeuner', icon: '🌅' },
  { key: 'lunch', label: 'Déjeuner', icon: '☀️' },
  { key: 'snack', label: 'Goûter', icon: '🍎' },
  { key: 'dinner', label: 'Dîner', icon: '🌙' },
];

function RecipeCard({ recipe, onToggleFavorite, onRemoveFavorite }) {
  const [open, setOpen] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const handleFavorite = (e) => {
    e.stopPropagation();
    if (favorited) {
      setFavorited(false);
      onRemoveFavorite?.();
      return;
    }
    setFavorited(true);
    const favoriteData = {
      recipe_name: recipe.name,
      meal_type: recipe.meal_type || 'custom',
      ingredients: recipe.ingredients || [],
      instructions: recipe.preparation || '',
      calories: recipe.calories || 0,
      protein_g: recipe.protein_g || 0,
      carbs_g: recipe.carbs_g || 0,
      fat_g: recipe.fat_g || 0,
      recipe_type: recipe.type
    };
    onToggleFavorite?.(favoriteData);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{recipe.name}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {recipe.prep_time_min} min
              </span>
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <Zap className="h-3 w-3" /> {recipe.calories} kcal
              </span>
              <span className="text-xs text-muted-foreground">P:{recipe.protein_g}g · G:{recipe.carbs_g}g · L:{recipe.fat_g}g</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className="transition-all transform hover:scale-110 active:scale-95"
            title={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star className={`h-5 w-5 ${favorited ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-400'}`} />
          </button>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-primary/10 pt-3">
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Ingrédients</p>
                <ul className="space-y-0.5">
                  {recipe.ingredients?.map((ing, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Préparation</p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{recipe.preparation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AIRecipes({ profile, activePlan, onToggleFavorite }) {
  const { t, language, getThemePersonality } = useTheme();
  const themePersonality = getThemePersonality();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);

  const generate = async () => {
    if (!profile) return;
    setLoading(true);
    
    const mealContext = selectedMealType ? `Type de repas: ${selectedMealType}. ` : '';
    const planContext = activePlan
      ? `Plan actif: ${activePlan.daily_calories} kcal/j, ${activePlan.protein_g}g protéines, ${activePlan.carbs_g}g glucides, ${activePlan.fat_g}g lipides.`
      : '';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un nutritionniste sportif. Génère 2 recettes fitness adaptées.
Profil: objectif ${profile.goal}, ${profile.weight_kg}kg, ${profile.fitness_level}, préférence ${profile.dietary_preference}.
${mealContext}${planContext}
Génère 1 recette EXPRESS (≤10 min) et 1 recette COMPLÈTE (20-30 min) pour ${selectedMealType || 'ce repas'}.
Recettes savoureuses, simples et adaptées à l'objectif.`,
      response_json_schema: {
        type: "object",
        properties: {
          recipes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: ["express", "complete"] },
                prep_time_min: { type: "number" },
                calories: { type: "number" },
                protein_g: { type: "number" },
                carbs_g: { type: "number" },
                fat_g: { type: "number" },
                ingredients: { type: "array", items: { type: "string" } },
                preparation: { type: "string" }
              }
            }
          }
        }
      }
    });

    setRecipes(result.recipes || []);
    setGenerated(true);
    setLoading(false);
    setShowMealSelector(false);
    setSelectedMealType(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg text-primary tracking-wider">RECETTES IA</h2>
        </div>
        <Button
          onClick={() => setShowMealSelector(true)}
          disabled={loading || !profile}
          size="sm"
          className="gap-1.5 text-primary border border-primary/30 hover:bg-primary/10"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {generated ? 'Nouvelles recettes' : 'Générer'}
        </Button>
      </div>

      <AnimatePresence>
        {showMealSelector && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl p-6 shadow-lg border border-blue-200 mb-4"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
                🍽️ Pour quel repas ?
              </h3>
              <button onClick={() => { setShowMealSelector(false); setSelectedMealType(null); }}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <CardDescription className="mb-4">
              Choisis le type de repas pour générer des recettes adaptées
            </CardDescription>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {MEAL_TYPES.map((meal) => (
                <button
                  key={meal.key}
                  onClick={() => setSelectedMealType(meal.label)}
                  className={`p-3 rounded-xl border transition-all ${
                    selectedMealType === meal.label
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedMealType === meal.label}
                      className="border-2 border-primary data-[state=checked]:bg-primary"
                    />
                    <div className="text-left">
                      <p className="text-xl">{meal.icon}</p>
                      <p className="text-sm font-semibold text-foreground">{meal.label}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button 
                onClick={generate} 
                disabled={loading || !selectedMealType}
                size="sm"
                className="gap-2 text-primary border border-primary/30 hover:bg-primary/10"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Générer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Génération en cours...</p>
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {recipes.map((r, i) => (
            <RecipeCard 
              key={`${r.name}-${i}`}
              recipe={r}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </motion.div>
      )}

      {!loading && !generated && (
        <div className="text-center py-6 text-primary/60 text-sm italic">
          "Génère tes recettes personnalisées selon ton objectif."
        </div>
      )}
    </div>
  );
}