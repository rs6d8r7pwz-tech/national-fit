import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PhotoComparison({ entries }) {
  const photosEntries = entries.filter(e => e.photo_url).sort((a, b) => new Date(a.date) - new Date(b.date));
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(Math.max(0, photosEntries.length - 1));

  if (photosEntries.length === 0) return null;

  const leftPhoto = photosEntries[leftIdx];
  const rightPhoto = photosEntries[rightIdx];

  return (
    <Card className="p-5 bg-card border-border">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <Camera className="h-4 w-4" /> Comparaison avant / après
      </h3>

      {photosEntries.length === 1 ? (
        <div className="text-center py-4">
          <img src={photosEntries[0].photo_url} alt="progression" className="h-48 w-auto rounded-2xl mx-auto object-cover" />
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(photosEntries[0].date), 'd MMM yyyy', { locale: fr })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Ajoutez plus de photos pour la comparaison avant/après</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Left photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Avant</span>
              <div className="flex gap-1">
                <button onClick={() => setLeftIdx(i => Math.max(0, i - 1))} disabled={leftIdx === 0}
                  className="h-5 w-5 rounded-full bg-muted flex items-center justify-center disabled:opacity-40 hover:bg-muted/70">
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button onClick={() => setLeftIdx(i => Math.min(photosEntries.length - 1, i + 1))} disabled={leftIdx >= photosEntries.length - 1}
                  className="h-5 w-5 rounded-full bg-muted flex items-center justify-center disabled:opacity-40 hover:bg-muted/70">
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
            <img src={leftPhoto.photo_url} alt="avant" className="w-full aspect-[3/4] object-cover rounded-2xl border border-border" />
            <p className="text-xs text-center text-muted-foreground">{format(new Date(leftPhoto.date), 'd MMM yyyy', { locale: fr })}</p>
            {leftPhoto.weight_kg && <p className="text-xs text-center font-semibold text-muted-foreground">{leftPhoto.weight_kg} kg</p>}
          </div>

          {/* Right photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-green-600 uppercase">Après</span>
              <div className="flex gap-1">
                <button onClick={() => setRightIdx(i => Math.max(0, i - 1))} disabled={rightIdx === 0}
                  className="h-5 w-5 rounded-full bg-muted flex items-center justify-center disabled:opacity-40 hover:bg-muted/70">
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button onClick={() => setRightIdx(i => Math.min(photosEntries.length - 1, i + 1))} disabled={rightIdx >= photosEntries.length - 1}
                  className="h-5 w-5 rounded-full bg-muted flex items-center justify-center disabled:opacity-40 hover:bg-muted/70">
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
            <img src={rightPhoto.photo_url} alt="après" className="w-full aspect-[3/4] object-cover rounded-2xl border-2 border-primary/50" />
            <p className="text-xs text-center text-muted-foreground">{format(new Date(rightPhoto.date), 'd MMM yyyy', { locale: fr })}</p>
            {rightPhoto.weight_kg && <p className="text-xs text-center font-semibold text-primary">{rightPhoto.weight_kg} kg</p>}
          </div>
        </div>
      )}
    </Card>
  );
}