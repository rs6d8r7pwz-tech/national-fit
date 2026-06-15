import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ShoppingCart, X, Loader2, Sparkles, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const CATEGORIES = ['🥩 Protéines', '🥦 Légumes', '🍚 Féculents', '🥑 Matières grasses', '🥛 Produits laitiers', '🍎 Fruits', '🧂 Épices & condiments', '🧴 Autres'];

export default function ShoppingListModal({ plan, onClose }) {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['shoppingList', plan.id],
    queryFn: () => base44.entities.ShoppingList.filter({ meal_plan_id: plan.id }),
    initialData: [],
  });

  const currentList = lists[0];

  const updateMutation = useMutation({
    mutationFn: ({ id, items }) => base44.entities.ShoppingList.update(id, { items }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingList', plan.id] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShoppingList.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shoppingList', plan.id] }),
  });

  const generateList = async () => {
    setGenerating(true);
    const allIngredients = (plan.meals || []).flatMap(m => m.ingredients || []);
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un assistant nutrition. À partir de ces ingrédients d'un plan alimentaire, génère une liste de courses structurée et consolidée (regroupe les doublons, estime les quantités pour 1 semaine, classe par catégorie).

Ingrédients bruts: ${allIngredients.join(', ')}
Plan: ${plan.title} (${plan.daily_calories} kcal/jour, objectif: ${plan.dietary_preference})

Génère une liste de courses pratique avec quantités réalistes pour 1 semaine. Chaque item doit avoir: name (nom de l'aliment), quantity (ex: "500g", "1 kg", "x6"), category (parmi: Protéines, Légumes, Féculents, Matières grasses, Produits laitiers, Fruits, Épices & condiments, Autres).`,
      response_json_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                quantity: { type: 'string' },
                category: { type: 'string' },
                checked: { type: 'boolean' }
              }
            }
          }
        }
      }
    });

    const items = (result?.items || allIngredients.map(i => ({ name: i, quantity: '', category: 'Autres', checked: false })))
      .map(item => ({ ...item, checked: false }));

    if (currentList) {
      await updateMutation.mutateAsync({ id: currentList.id, items });
    } else {
      await createMutation.mutateAsync({
        meal_plan_id: plan.id,
        meal_plan_title: plan.title,
        items,
        generated_date: new Date().toISOString().split('T')[0],
      });
    }
    setGenerating(false);
    toast.success('Liste de courses générée !');
  };

  const toggleItem = async (idx) => {
    if (!currentList) return;
    const newItems = currentList.items.map((item, i) =>
      i === idx ? { ...item, checked: !item.checked } : item
    );
    await updateMutation.mutateAsync({ id: currentList.id, items: newItems });
  };

  // Group by category
  const grouped = {};
  if (currentList?.items) {
    currentList.items.forEach((item, idx) => {
      const cat = item.category || 'Autres';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ ...item, _idx: idx });
    });
  }

  const totalItems = currentList?.items?.length || 0;
  const checkedItems = currentList?.items?.filter(i => i.checked).length || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden"
        style={{ maxHeight: '85dvh' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)' }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">Liste de courses</p>
              <p className="text-xs text-slate-500">{plan.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentList && (
              <Button size="sm" variant="outline" onClick={generateList} disabled={generating} className="gap-1.5 text-xs h-7">
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Regénérer
              </Button>
            )}
            <button onClick={onClose} className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Progress */}
        {totalItems > 0 && (
          <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                animate={{ width: `${(checkedItems / totalItems) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500">{checkedItems}/{totalItems}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-green-500" /></div>
          ) : !currentList ? (
            <div className="text-center py-10">
              <ShoppingCart className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-4">Génère ta liste de courses automatiquement depuis ce plan alimentaire.</p>
              <Button onClick={generateList} disabled={generating} className="gap-2 text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? 'Génération IA...' : 'Générer la liste'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{cat}</p>
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <button
                        key={item._idx}
                        onClick={() => toggleItem(item._idx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                          item.checked
                            ? 'bg-green-50 border-green-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-green-300'
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          item.checked ? 'bg-green-500 border-green-500' : 'border-slate-300'
                        }`}>
                          {item.checked && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className={`flex-1 text-sm font-medium ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {item.name}
                        </span>
                        {item.quantity && (
                          <span className="text-xs text-slate-400 shrink-0">{item.quantity}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer -- reset */}
        {currentList && checkedItems > 0 && (
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={async () => {
                const reset = currentList.items.map(i => ({ ...i, checked: false }));
                await updateMutation.mutateAsync({ id: currentList.id, items: reset });
              }}
              className="w-full text-xs text-slate-400 hover:text-slate-600 py-1"
            >
              Tout décocher
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}