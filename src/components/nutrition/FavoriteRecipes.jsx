import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ChefHat, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/lib/ThemeContext';

export default function FavoriteRecipes({ favorites, onRemove }) {
  const { t, language, getThemePersonality } = useTheme();
  const themePersonality = getThemePersonality();

  if (!favorites || favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4" 
          style={{ background: `hsla(${themePersonality.colors.primary}, 0.1)`, border: `1px solid hsla(${themePersonality.colors.primary}, 0.3)` }}>
          <Star className="h-8 w-8" style={{ color: `hsl(${themePersonality.colors.primary})` }} />
        </div>
        <h3 className="font-heading text-xl tracking-wider" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
          {language === 'fr' ? 'Aucun favori' : 'No favorites'}
        </h3>
        <p className="text-muted-foreground mt-2 text-sm">
          {language === 'fr' 
            ? 'Clique sur l\'étoile des recettes pour les sauvegarder ici' 
            : 'Click the star on recipes to save them here'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {favorites?.map((fav, idx) => (
        <motion.div
          key={`${fav.id || idx}-${idx}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-orange-500/20 rounded-xl p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                <span className={`text-xs font-heading tracking-wider px-2 py-0.5 rounded-full ${
                  fav.recipe_type === 'express' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  {fav.recipe_type === 'express' ? '⚡ EXPRESS' : '👨‍🍳 COMPLÈTE'}
                </span>
              </div>
              <h4 className="font-semibold text-foreground text-sm">{fav.recipe_name}</h4>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="font-semibold text-orange-400">{fav.calories} kcal</span>
                {fav.ingredients?.length > 0 && (
                  <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-200">
                    {fav.ingredients.length} {language === 'fr' ? 'ingrédients' : 'ingredients'}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove?.(fav.id)}
              className="text-muted-foreground hover:text-red-400 h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {fav.ingredients?.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-orange-400 mb-1">
                {language === 'fr' ? 'Ingrédients :' : 'Ingredients:'}
              </p>
              <div className="flex flex-wrap gap-1">
                {fav.ingredients.slice(0, 5).map((ing, i) => (
                  <span key={i} className="text-xs bg-card border border-orange-500/30 text-orange-100 px-2 py-0.5 rounded-full">
                    {ing}
                  </span>
                ))}
                {fav.ingredients.length > 5 && (
                  <span className="text-xs text-orange-400/60">+{fav.ingredients.length - 5}...</span>
                )}
              </div>
            </div>
          )}

          {fav.instructions && (
            <div>
              <p className="text-xs font-semibold text-orange-400 mb-1">
                {language === 'fr' ? 'Préparation :' : 'Preparation:'}
              </p>
              <div className="text-xs text-foreground space-y-1">
                {fav.instructions.split('\n').slice(0, 3).map((step, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="shrink-0 h-4 w-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-foreground">{step}</span>
                  </div>
                ))}
                {fav.instructions.split('\n').length > 3 && (
                  <p className="text-xs text-orange-400/60 italic">
                    {language === 'fr' ? 'Voir plus...' : 'See more...'}
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}