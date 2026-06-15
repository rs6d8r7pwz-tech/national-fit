import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Flame, Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RecipeCard from './RecipeCard';
import ShoppingListModal from './ShoppingListModal';

const mealTypeIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  snack: '🍎',
  dinner: '🌙',
};

export default function MealCard({ plan, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [showShopping, setShowShopping] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg text-foreground">{plan.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold text-orange-500">
            <Flame className="h-4 w-4" />
            {plan.daily_calories} kcal
          </div>
        </div>

        <div className="flex gap-3 mt-3">
          <Badge variant="secondary" className="text-xs">P: {plan.protein_g}g</Badge>
          <Badge variant="secondary" className="text-xs">G: {plan.carbs_g}g</Badge>
          <Badge variant="secondary" className="text-xs">L: {plan.fat_g}g</Badge>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            {expanded ? 'Masquer' : 'Voir les repas'}
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 gap-1.5 text-xs" onClick={() => setShowShopping(true)}>
              <ShoppingCart className="h-3.5 w-3.5" /> Courses
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(plan.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showShopping && <ShoppingListModal plan={plan} onClose={() => setShowShopping(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-border p-5 space-y-4 bg-muted/30">
              {plan.meals?.map((meal, i) => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{mealTypeIcons[meal.meal_type] || '🍽️'}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-foreground capitalize">{meal.meal_type}</h4>
                      <p className="text-xs text-muted-foreground font-medium">{meal.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-orange-500">{meal.calories} kcal</span>
                      <div className="flex gap-1 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">P: {meal.protein_g}g</span>
                        <span className="text-[10px] text-muted-foreground">G: {meal.carbs_g}g</span>
                        <span className="text-[10px] text-muted-foreground">L: {meal.fat_g}g</span>
                      </div>
                    </div>
                  </div>
                  
                  {meal.instructions && (
                    <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                      <p className="text-xs font-bold text-primary mb-1">📊 MACROS :</p>
                      <p className="text-sm font-semibold text-foreground">{meal.instructions}</p>
                    </div>
                  )}
                </div>
              ))}
              <RecipeCard plan={plan} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}