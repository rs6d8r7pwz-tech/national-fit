import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Clock, ChefHat, RefreshCw, ChevronDown, ChevronUp, Star } from 'lucide-react';

const RECIPE_CACHE_PREFIX = 'hulkfit_recipes_';
const RECIPE_TTL = 24 * 60 * 60 * 1000; // 24h

export default function RecipeCard({ plan, onToggleFavorite }) {
  const [recipes, setRecipes] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(RECIPE_CACHE_PREFIX + plan.id) || 'null');
      if (cached && Date.now() - cached.ts < RECIPE_TTL) return cached.data;
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const toggleFavorite = async (recipe, type) => {
    const favoriteData = {
      recipe_name: recipe.name,
      meal_type: 'custom',
      ingredients: recipe.ingredients || [],
      instructions: recipe.steps?.join('\n') || '',
      calories: recipe.calories || 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      recipe_type: type
    };
    await onToggleFavorite?.(favoriteData);
  };

  const generateRecipes = async () => {
    setLoading(true);
    const mealNames = plan.meals?.map(m => m.name || m.meal_type).join(', ') || 'repas du plan';
    const prompt = `Tu es un chef nutritionniste. Génère 2 recettes adaptées à ce plan alimentaire: ${plan.title} (${plan.daily_calories} kcal/jour, ${plan.protein_g}g protéines, préférence: ${plan.dietary_preference || 'omnivore'}).
Repas du plan: ${mealNames}.

Crée:
1. Une recette EXPRESS (15 min max)
2. Une recette COMPLÈTE (plus élaborée)

Les deux doivent correspondre aux macros du plan.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            express: {
              type: "object",
              properties: {
                name: { type: "string" },
                prep_time: { type: "string" },
                calories: { type: "number" },
                ingredients: { type: "array", items: { type: "string" } },
                steps: { type: "array", items: { type: "string" } },
                macro_note: { type: "string" }
              }
            },
            complete: {
              type: "object",
              properties: {
                name: { type: "string" },
                prep_time: { type: "string" },
                calories: { type: "number" },
                ingredients: { type: "array", items: { type: "string" } },
                steps: { type: "array", items: { type: "string" } },
                macro_note: { type: "string" }
              }
            }
          }
        }
      });
      setRecipes(result);
      try {
        localStorage.setItem(RECIPE_CACHE_PREFIX + plan.id, JSON.stringify({ ts: Date.now(), data: result }));
      } catch {}
    } catch {
      setRecipes({ error: true });
    }
    setLoading(false);
  };

  return (
    <div className="mt-3 border-t border-white/[0.08] pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-semibold text-orange-400">Recettes IA</span>
          {recipes && !recipes.error && (
            <span className="text-xs text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded-full">2 recettes générées</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {recipes && !recipes.error && (
            <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground p-1">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          <Button
            size="sm"
            variant={recipes ? "ghost" : "outline"}
            onClick={generateRecipes}
            disabled={loading}
            className={`gap-1.5 text-xs h-7 ${!recipes ? 'border-orange-300 text-orange-600 hover:bg-orange-50' : 'text-muted-foreground'}`}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : recipes ? <RefreshCw className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
            {loading ? 'Génération...' : recipes && !recipes.error ? 'Actualiser' : 'Générer recettes'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && recipes && !recipes.error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-1 gap-3">
              {[
                { recipe: recipes.express, tag: '⚡ EXPRESS', tagColor: 'bg-blue-100 text-blue-700', type: 'express' },
                { recipe: recipes.complete, tag: '👨‍🍳 COMPLÈTE', tagColor: 'bg-orange-100 text-orange-700', type: 'complete' },
              ].map(({ recipe, tag, tagColor, type }) => recipe && (
                <div key={tag} className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <span className={`text-xs font-heading tracking-wider px-2 py-0.5 rounded-full ${
                        type === 'express' 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}>{tag}</span>
                      <h4 className="font-semibold text-sm mt-1.5 text-foreground">{recipe.name}</h4>
                    </div>
                    <button
                      onClick={() => toggleFavorite(recipe, type)}
                      className="ml-2 text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      <Star className="h-5 w-5" />
                    </button>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs font-semibold text-orange-400">{recipe.calories} kcal</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {recipe.prep_time}
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="text-xs font-semibold text-orange-300 mb-1">Ingrédients :</p>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients?.map((ing, i) => (
                        <span key={i} className="text-xs bg-card border border-orange-500/30 text-orange-200 px-2 py-0.5 rounded-full">{ing}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-orange-300 mb-1">Préparation :</p>
                    <ol className="space-y-1">
                      {recipe.steps?.map((step, i) => (
                        <li key={i} className="text-xs text-foreground flex gap-2">
                          <span className="shrink-0 h-4 w-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {recipe.macro_note && (
                    <p className="text-xs text-orange-400 mt-2 italic border-t border-orange-500/20 pt-2">💡 {recipe.macro_note}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {recipes?.error && (
        <p className="text-xs text-orange-400/60 mt-2 italic">Limite IA atteinte -- réessaie plus tard.</p>
      )}
    </div>
  );
}