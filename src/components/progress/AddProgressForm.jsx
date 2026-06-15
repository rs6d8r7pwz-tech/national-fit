import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Camera, Loader2, Moon, Droplets, Heart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function AddProgressForm({ onSubmit, onCancel }) {
  const [data, setData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight_kg: '', body_fat_pct: '',
    chest_cm: '', waist_cm: '', hips_cm: '', arms_cm: '', thighs_cm: '',
    energy_level: '', mood: '',
    sleep_hours: '', stress_level: '', water_intake_l: '', steps: '',
    workout_completed: false, notes: '', photo_url: ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef();

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update('photo_url', file_url);
    setUploadingPhoto(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(k => {
    if (cleaned[k] === '') delete cleaned[k];
    else if (['weight_kg', 'body_fat_pct', 'chest_cm', 'waist_cm', 'hips_cm', 'arms_cm', 'thighs_cm', 'energy_level', 'sleep_hours', 'stress_level', 'water_intake_l', 'steps'].includes(k) && cleaned[k]) {
    cleaned[k] = Number(cleaned[k]);
    }
    });
    onSubmit(cleaned);
  };

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg">Nouvelle entrée</h3>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={data.date} onChange={e => update('date', e.target.value)} />
            </div>
            <div>
              <Label>Poids (kg)</Label>
              <Input type="number" step="0.1" placeholder="70.5" value={data.weight_kg} onChange={e => update('weight_kg', e.target.value)} />
            </div>
            <div>
              <Label>% Graisse</Label>
              <Input type="number" step="0.1" placeholder="15" value={data.body_fat_pct} onChange={e => update('body_fat_pct', e.target.value)} />
            </div>
            <div>
              <Label>Tour de poitrine (cm)</Label>
              <Input type="number" value={data.chest_cm} onChange={e => update('chest_cm', e.target.value)} />
            </div>
            <div>
              <Label>Tour de taille (cm)</Label>
              <Input type="number" value={data.waist_cm} onChange={e => update('waist_cm', e.target.value)} />
            </div>
            <div>
              <Label>Tour de hanches (cm)</Label>
              <Input type="number" value={data.hips_cm} onChange={e => update('hips_cm', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Niveau d'énergie (1-5)</Label>
              <Select value={data.energy_level} onValueChange={v => update('energy_level', v)}>
                <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} {'⚡'.repeat(n)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Humeur</Label>
              <Select value={data.mood} onValueChange={v => update('mood', v)}>
                <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">😄 Excellent</SelectItem>
                  <SelectItem value="bien">🙂 Bien</SelectItem>
                  <SelectItem value="moyen">😐 Moyen</SelectItem>
                  <SelectItem value="fatigué">😴 Fatigué</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={data.workout_completed} onCheckedChange={v => update('workout_completed', v)} />
              <Label>Séance effectuée</Label>
            </div>
          </div>

          {/* Récupération */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-400" /> Récupération & Bien-être
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1.5"><Moon className="h-3.5 w-3.5 text-indigo-400" /> Sommeil (h)</Label>
                <Input type="number" step="0.5" min="0" max="24" placeholder="7.5" value={data.sleep_hours} onChange={e => update('sleep_hours', e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-400" /> Stress (1-5)</Label>
                <Input type="number" min="1" max="5" placeholder="2" value={data.stress_level} onChange={e => update('stress_level', e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-blue-400" /> Eau (litres)</Label>
                <Input type="number" step="0.25" min="0" max="10" placeholder="2" value={data.water_intake_l} onChange={e => update('water_intake_l', e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-green-500" /> Pas</Label>
                <Input type="number" step="100" min="0" placeholder="8000" value={data.steps} onChange={e => update('steps', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea placeholder="Comment s'est passée ta journée ?" value={data.notes} onChange={e => update('notes', e.target.value)} />
          </div>

          {/* Photo upload */}
          <div>
            <Label className="mb-2 block flex items-center gap-2"><Camera className="h-4 w-4" /> Photo de suivi (optionnel)</Label>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e.target.files?.[0])} />
            {data.photo_url ? (
              <div className="relative w-24 h-32 rounded-xl overflow-hidden border border-gray-200">
                <img src={data.photo_url} alt="suivi" className="w-full h-full object-cover" />
                <button onClick={() => update('photo_url', '')} className="absolute top-1 right-1 h-5 w-5 bg-black/50 rounded-full flex items-center justify-center">
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => photoRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 text-sm text-muted-foreground hover:text-purple-600 transition-all">
                {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {uploadingPhoto ? 'Envoi...' : 'Ajouter une photo'}
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
            <Button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white">
              <Plus className="h-4 w-4 mr-1" /> Enregistrer
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}