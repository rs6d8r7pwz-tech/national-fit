import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Star, X } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';


export default function FavoritePrograms({ onToggleFavorite }) {
  const { t, language, getThemePersonality } = useTheme();
  const themePersonality = getThemePersonality();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favoritePrograms'],
    queryFn: () => base44.entities.FavoriteProgram.list('-created_at'),
    initialData: [],
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FavoriteProgram.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoritePrograms'] }),
  });

  const handleDelete = async (id) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg text-primary tracking-wider">PROGRAMMES FAVORIS</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `hsla(${themePersonality.colors.primary}, 0.1)`, border: `1px solid hsla(${themePersonality.colors.primary}, 0.3)` }}>
            <Star className="h-8 w-8" style={{ color: `hsl(${themePersonality.colors.primary})` }} />
          </div>
          <h3 className="font-heading text-xl tracking-wider" style={{ color: `hsl(${themePersonality.colors.primary})` }}>Aucun programme favori</h3>
          <p className="text-muted-foreground mt-2 text-sm italic">
            "{language === 'fr' ? "Sauvegarde tes meilleurs programmes pour y accéder rapidement." : "Save your best programs for quick access."}"
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((fav, idx) => (
            <div key={fav.id || idx} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{fav.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">{fav.level}</Badge>
                      <span className="text-xs text-muted-foreground">{fav.sessions?.length || 0} séances</span>
                      <span className="text-xs text-muted-foreground">{fav.goal}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(fav.id)}
                  className="ml-3 p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors shrink-0"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}