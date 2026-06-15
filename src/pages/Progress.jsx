import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Plus, Loader2, Trash2 } from 'lucide-react';
import ProgressChart from '@/components/progress/ProgressChart';
import AddProgressForm from '@/components/progress/AddProgressForm';
import PhotoComparisonSlider from '@/components/progress/PhotoComparisonSlider';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';

const moodEmojis = { excellent: '😄', bien: '🙂', moyen: '😐', fatigué: '😴' };

export default function Progress() {
  const { t, language, getThemePersonality, getRandomMotivationalQuote } = useTheme();
  const isFR = language === 'fr';
  const dateLocale = isFR ? fr : enUS;
  const themePersonality = getThemePersonality();
  const motivationalQuote = getRandomMotivationalQuote();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => base44.entities.ProgressEntry.list('-date', 50),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProgressEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProgressEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress'] }),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-widest flex items-center gap-3" style={{ color: `hsl(${themePersonality.colors.primary})` }}>
            <TrendingUp className="h-7 w-7" style={{ color: `hsl(${themePersonality.colors.accent})` }} /> {t('progress')}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm italic">"{motivationalQuote}"</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 text-white shadow-lg" style={{ background: `hsl(${themePersonality.colors.primary})` }} disabled={showForm}>
          <Plus className="h-4 w-4" /> {t('add')}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <AddProgressForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      <ProgressChart entries={entries} />
      <PhotoComparisonSlider entries={entries} />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" style={{ color: `hsl(${themePersonality.colors.primary})` }} /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `hsla(${themePersonality.colors.primary}, 0.1)`, border: `1px solid hsla(${themePersonality.colors.primary}, 0.3)` }}>
            <TrendingUp className="h-10 w-10" style={{ color: `hsl(${themePersonality.colors.primary})` }} />
          </div>
          <h3 className="font-heading text-2xl tracking-wider" style={{ color: `hsl(${themePersonality.colors.primary})` }}>{t('emptyData')}</h3>
          <p className="text-muted-foreground mt-2 italic">"{isFR ? 'Commence à tracker ta transformation dès aujourd\'hui !' : 'Start tracking your transformation today!'}"</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-heading text-xl tracking-widest" style={{ color: `hsl(${themePersonality.colors.primary})` }}>📈 {isFR ? 'Historique' : 'History'}</h3>
          {entries.map(entry => (
            <Card key={entry.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow border-blue-100 bg-white">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{entry.weight_kg ? `${entry.weight_kg}kg` : '--'}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(entry.date), 'd MMM yyyy', { locale: dateLocale })}</p>
                </div>
                <div className="flex gap-2">
                  {entry.mood && <span className="text-lg">{moodEmojis[entry.mood]}</span>}
                  {entry.workout_completed && <Badge className="bg-accent/10 text-accent border-0 text-xs">✓ {isFR ? 'Séance' : 'Session'}</Badge>}
                  {entry.energy_level && <Badge variant="secondary" className="text-xs">{'⚡'.repeat(entry.energy_level)}</Badge>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(entry.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}