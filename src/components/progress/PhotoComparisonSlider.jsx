import React, { useState, useRef, useCallback } from 'react';
import { Camera, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PhotoComparisonSlider({ entries }) {
  const photosEntries = entries.filter(e => e.photo_url).sort((a, b) => new Date(a.date) - new Date(b.date));
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(Math.max(0, photosEntries.length - 1));
  const [sliderPct, setSliderPct] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  const updateSlider = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setSliderPct(pct);
  }, []);

  const onMouseDown = (e) => { setDragging(true); updateSlider(e.clientX); };
  const onMouseMove = (e) => { if (dragging) updateSlider(e.clientX); };
  const onMouseUp = () => setDragging(false);
  const onTouchMove = (e) => { e.preventDefault(); updateSlider(e.touches[0].clientX); };

  if (photosEntries.length === 0) return null;

  const leftPhoto = photosEntries[leftIdx];
  const rightPhoto = photosEntries[rightIdx];

  const weightDiff = leftPhoto.weight_kg && rightPhoto.weight_kg
    ? (rightPhoto.weight_kg - leftPhoto.weight_kg).toFixed(1)
    : null;

  return (
    <div className="rounded-2xl overflow-hidden border border-blue-100 bg-white shadow-md">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <Camera className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <p className="text-sm font-bold text-slate-800">Comparaison avant / après</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <ArrowLeftRight className="h-3 w-3" />
          <span>Glisse pour comparer</span>
        </div>
      </div>

      {photosEntries.length === 1 ? (
        <div className="p-4 text-center">
          <img src={photosEntries[0].photo_url} alt="progression" className="h-48 w-auto rounded-2xl mx-auto object-cover" />
          <p className="text-xs text-slate-400 mt-2">{format(new Date(photosEntries[0].date), 'd MMM yyyy', { locale: fr })}</p>
          <p className="text-xs text-slate-400 mt-1">Ajoute d'autres photos pour la comparaison</p>
        </div>
      ) : (
        <>
          {/* Photo selectors */}
          <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-2">
            {/* Avant */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avant</p>
                <p className="text-xs text-slate-700 font-medium">{format(new Date(leftPhoto.date), 'd MMM yy', { locale: fr })}</p>
                {leftPhoto.weight_kg && <p className="text-xs text-slate-500">{leftPhoto.weight_kg} kg</p>}
              </div>
              <div className="flex gap-0.5">
                <button onClick={() => setLeftIdx(i => Math.max(0, i - 1))} disabled={leftIdx === 0}
                  className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30 shadow-sm">
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button onClick={() => setLeftIdx(i => Math.min(photosEntries.length - 1, i + 1))} disabled={leftIdx >= photosEntries.length - 1}
                  className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center disabled:opacity-30 shadow-sm">
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
            {/* Après */}
            <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2">
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Après</p>
                <p className="text-xs text-blue-800 font-medium">{format(new Date(rightPhoto.date), 'd MMM yy', { locale: fr })}</p>
                {rightPhoto.weight_kg && <p className="text-xs text-blue-600">{rightPhoto.weight_kg} kg</p>}
              </div>
              <div className="flex gap-0.5">
                <button onClick={() => setRightIdx(i => Math.max(0, i - 1))} disabled={rightIdx === 0}
                  className="h-6 w-6 rounded-full bg-white border border-blue-200 flex items-center justify-center disabled:opacity-30 shadow-sm">
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button onClick={() => setRightIdx(i => Math.min(photosEntries.length - 1, i + 1))} disabled={rightIdx >= photosEntries.length - 1}
                  className="h-6 w-6 rounded-full bg-white border border-blue-200 flex items-center justify-center disabled:opacity-30 shadow-sm">
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Slider comparator */}
          <div
            ref={containerRef}
            className="relative mx-4 mb-4 rounded-2xl overflow-hidden select-none cursor-col-resize"
            style={{ aspectRatio: '3/4' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={(e) => updateSlider(e.touches[0].clientX)}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
          >
            {/* Right photo (base) */}
            <img src={rightPhoto.photo_url} alt="après" className="absolute inset-0 w-full h-full object-cover" />

            {/* Left photo (clipped) */}
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPct}%` }}>
              <img src={leftPhoto.photo_url} alt="avant" className="absolute inset-0 h-full object-cover" style={{ width: containerRef.current?.offsetWidth + 'px' || '100%' }} />
            </div>

            {/* Divider line */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none" style={{ left: `${sliderPct}%` }} />

            {/* Handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-blue-200 pointer-events-none"
              style={{ left: `${sliderPct}%` }}
            >
              <ArrowLeftRight className="h-4 w-4 text-blue-600" />
            </div>

            {/* Labels overlay */}
            <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
              AVANT
            </div>
            <div className="absolute top-2 right-2 bg-blue-600/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
              APRÈS
            </div>
          </div>

          {/* Weight diff */}
          {weightDiff && (
            <div className="mx-4 mb-4 flex items-center justify-center gap-2 bg-slate-50 rounded-xl py-2.5">
              <span className="text-xs text-slate-500">Différence de poids :</span>
              <span className={`text-sm font-bold ${parseFloat(weightDiff) < 0 ? 'text-green-600' : parseFloat(weightDiff) > 0 ? 'text-red-500' : 'text-slate-600'}`}>
                {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} kg
              </span>
              <span className="text-base">{parseFloat(weightDiff) < 0 ? '📉' : parseFloat(weightDiff) > 0 ? '📈' : '⚖️'}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}