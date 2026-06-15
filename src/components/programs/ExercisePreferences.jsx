import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Star, Zap, Bike, Footprints, Timer } from 'lucide-react';

// EXERCICES CARDIO (pour sessionMode=cardio)
const CARDIO_EXERCISES = [
  {
    key: 'cardio_main',
    label: '🏃 Cardio Principal',
    exercises: [
      {
        slot: 'Cardio steady-state',
        options: [
          { value: 'cardio_steady_1', label: 'Vélo elliptique', desc: '30-45min, intensité modérée', target_areas: ['Cardiovasculaire', 'Jambes', 'Endurance'], recommended_for: ['cardio', 'seche'] },
          { value: 'cardio_steady_2', label: 'Tapis de course', desc: 'Course ou marche inclinée', target_areas: ['Cardio complet', 'Mollets', 'Quadriceps'], recommended_for: ['cardio', 'seche'] },
          { value: 'cardio_steady_3', label: 'Rameur', desc: 'Cardio + haut du corps', target_areas: ['Cardio', 'Dos', 'Bras', 'Core'], recommended_for: ['cardio', 'maintien'] },
        ]
      },
      {
        slot: 'HIIT / Intensif',
        options: [
          { value: 'cardio_hiit_1', label: 'Burpees', desc: 'Full body explosif', target_areas: ['Cardio maximal', 'Pecs', 'Jambes', 'Core'], recommended_for: ['cardio', 'seche'] },
          { value: 'cardio_hiit_2', label: 'Mountain Climbers', desc: 'Gainage dynamique', target_areas: ['Core', 'Épaules', 'Cardio'], recommended_for: ['cardio', 'seche'] },
          { value: 'cardio_hiit_3', label: 'Jumping Jacks', desc: 'Échauffement ou cardio', target_areas: ['Cardio', 'Épaules', 'Jambes'], recommended_for: ['cardio', 'maintien'] },
        ]
      },
      {
        slot: 'Agilité / Coordination',
        options: [
          { value: 'cardio_agi_1', label: 'Corde à sauter', desc: 'Endurance + coordination', target_areas: ['Mollets', 'Cardio', 'Agilité'], recommended_for: ['cardio', 'seche'] },
          { value: 'cardio_agi_2', label: 'High Knees', desc: 'Montées de genoux', target_areas: ['Cardio', 'Fléchisseurs hanche', 'Core'], recommended_for: ['cardio', 'seche'] },
          { value: 'cardio_agi_3', label: 'Escalier / Step-ups', desc: 'Puissance jambes + cardio', target_areas: ['Quadriceps', 'Fessiers', 'Cardio'], recommended_for: ['cardio', 'maintien'] },
        ]
      },
    ]
  },
];

// Par muscle : liste d'exercices, chacun avec plusieurs variantes au choix
// Chaque option a : value, label, desc, target_areas (zones ciblées), recommended_for (profils recommandés)
const MUSCLE_GROUPS = [
  {
    key: 'chest',
    label: '🏋️ Pectoraux',
    summary_focus: {
      seche: "Pectoraux complets avec accent haut — définition et séparation",
      prise_masse: "Masse pectorale globale — priorité haut et milieu pour épaisseur",
      maintien: "Équilibre haut/bas — entretien force et volume",
      force: "Force maximale — milieu du pec et triceps",
      cardio: "Endurance musculaire — pec complet + cardio intégré",
    },
    exercises: [
      {
        slot: 'Exercice principal',
        options: [
          { value: 'chest_main_1', label: 'Développé couché barre', desc: 'Force brute, charges max', target_areas: ['Milieu du pectoral', 'Triceps'], recommended_for: ['prise_masse', 'force'] },
          { value: 'chest_main_2', label: 'Développé couché haltères', desc: 'Amplitude complète, équilibre', target_areas: ['Pectoral complet', 'Milieu et intérieur'], recommended_for: ['maintien', 'seche'] },
          { value: 'chest_main_3', label: 'Pompes lestées', desc: 'Poids du corps + intensité', target_areas: ['Pec complet', 'Core stabilisateur'], recommended_for: ['seche', 'cardio'] },
        ]
      },
      {
        slot: 'Exercice incliné',
        options: [
          { value: 'chest_incline_1', label: 'Développé incliné barre', desc: 'Haut du pec', target_areas: ['Haut du pectoral', 'Deltoïde antérieur'], recommended_for: ['prise_masse', 'force'] },
          { value: 'chest_incline_2', label: 'Développé incliné haltères', desc: 'Isolation haut pec', target_areas: ['Haut du pectoral', 'Détaillage supérieur'], recommended_for: ['seche', 'maintien'] },
          { value: 'chest_incline_3', label: 'Push-up incliné', desc: 'Version poids du corps', target_areas: ['Haut du pec', 'Endurance'], recommended_for: ['cardio', 'seche'] },
        ]
      },
      {
        slot: 'Isolation / finition',
        options: [
          { value: 'chest_iso_1', label: 'Pec deck (machine)', desc: 'Contraction maximale', target_areas: ['Milieu du pec', 'Isolation pure'], recommended_for: ['maintien', 'seche'] },
          { value: 'chest_iso_2', label: 'Écartés câbles croisés', desc: 'Stretch et contraction', target_areas: ['Pec complet', 'Étirements fasciaux'], recommended_for: ['maintien', 'prise_masse'] },
          { value: 'chest_iso_3', label: 'Dips pectoraux', desc: 'Bas du pec, polyarticulaire', target_areas: ['Bas du pectoral', 'Triceps'], recommended_for: ['force', 'prise_masse'] },
        ]
      },
    ]
  },
  {
    key: 'back',
    label: '🦾 Dos',
    summary_focus: {
      seche: "Dos large et défini — accent grand dorsal et détails",
      prise_masse: "Épaisseur dorsale totale — trapèzes et grand dorsal",
      maintien: "Dos équilibré — largeur et épaisseur",
      force: "Force de tirage — dos complet + lombaires",
      cardio: "Endurance dorsale — volume modéré + cardio",
    },
    exercises: [
      {
        slot: 'Exercice vertical (largeur)',
        options: [
          { value: 'back_pull_1', label: 'Tractions pronation', desc: 'Pull-up — roi du dos large', target_areas: ['Grand dorsal (largeur)', 'Dos supérieur'], recommended_for: ['force', 'prise_masse'] },
          { value: 'back_pull_2', label: 'Lat pulldown barre', desc: 'Machine — grand dorsal', target_areas: ['Grand dorsal', 'Largeur maximale'], recommended_for: ['maintien', 'seche'] },
          { value: 'back_pull_3', label: 'Tirage poulie haute', desc: 'Câble — amplitude contrôlée', target_areas: ['Dos large', 'Contrôle temporel'], recommended_for: ['seche', 'cardio'] },
        ]
      },
      {
        slot: 'Exercice horizontal (épaisseur)',
        options: [
          { value: 'back_row_1', label: 'Rowing barre', desc: 'Masse dorsale lourde', target_areas: ['Épaisseur dorsale', 'Trapèzes moyens'], recommended_for: ['prise_masse', 'force'] },
          { value: 'back_row_2', label: 'Rowing haltère unilatéral', desc: 'Travail unilatéral', target_areas: ['Grand dorsal', 'Correction asymétrie'], recommended_for: ['maintien', 'seche'] },
          { value: 'back_row_3', label: 'Rowing machine/câble', desc: 'Guidé, sécurisé', target_areas: ['Dos milieu', 'Sécurité lombaire'], recommended_for: ['seche', 'cardio'] },
        ]
      },
      {
        slot: 'Finition / trapèzes',
        options: [
          { value: 'back_fin_1', label: 'Face pull câble', desc: 'Arrière épaules + trapèzes', target_areas: ['Trapèzes', 'Arrière d\'épaule'], recommended_for: ['maintien', 'force'] },
          { value: 'back_fin_2', label: 'Tirage bas câble', desc: 'Lombaires + grand dorsal', target_areas: ['Bas du dos', 'Grand dorsal inférieur'], recommended_for: ['prise_masse', 'force'] },
          { value: 'back_fin_3', label: 'Hyperextensions', desc: 'Lombaires et érecteurs', target_areas: ['Lombaires', 'Érecteurs du rachis'], recommended_for: ['force', 'maintien'] },
        ]
      },
    ]
  },
  {
    key: 'legs',
    label: '🦵 Jambes',
    summary_focus: {
      seche: "Jambes définies — quadriceps et ischios séparés",
      prise_masse: "Masse globale — quadriceps et fessiers volumineux",
      maintien: "Équilibre quad/ischio — force et proportion",
      force: "Force maximale — squat et chaîne postérieure",
      cardio: "Endurance jambière — circuits + peu de repos",
    },
    exercises: [
      {
        slot: 'Exercice quadriceps (compound)',
        options: [
          { value: 'legs_quad_1', label: 'Squat barre', desc: 'Roi des polyarticulaires', target_areas: ['Quadriceps complet', 'Fessiers', 'Core'], recommended_for: ['force', 'prise_masse'] },
          { value: 'legs_quad_2', label: 'Presse à cuisses', desc: 'Volume + sécurité lombaires', target_areas: ['Quadriceps', 'Vaste externe'], recommended_for: ['prise_masse', 'maintien'] },
          { value: 'legs_quad_3', label: 'Hack squat machine', desc: 'Quadriceps ciblés', target_areas: ['Quadriceps isolé', 'Vaste médial'], recommended_for: ['seche', 'maintien'] },
        ]
      },
      {
        slot: 'Ischios / fessiers',
        options: [
          { value: 'legs_post_1', label: 'Soulevé de terre roumain (RDL)', desc: 'Ischios + fessiers', target_areas: ['Ischio-jambiers', 'Fessiers', 'Lombaires'], recommended_for: ['force', 'prise_masse'] },
          { value: 'legs_post_2', label: 'Leg curl couché', desc: 'Isolation ischios', target_areas: ['Ischio-jambiers', 'Isolation pure'], recommended_for: ['seche', 'maintien'] },
          { value: 'legs_post_3', label: 'Hip thrust barre', desc: 'Fessiers — activation maximale', target_areas: ['Fessiers', 'Chaîne postérieure'], recommended_for: ['prise_masse', 'force'] },
        ]
      },
      {
        slot: 'Unilatéral / fonctionnel',
        options: [
          { value: 'legs_uni_1', label: 'Fentes marchées', desc: 'Équilibre et stabilité', target_areas: ['Quadriceps', 'Fessiers', 'Stabilisateurs'], recommended_for: ['cardio', 'seche'] },
          { value: 'legs_uni_2', label: 'Bulgarian split squat', desc: 'Fesse arrière — intensif', target_areas: ['Fessiers', 'Quadriceps unilatéral'], recommended_for: ['seche', 'maintien'] },
          { value: 'legs_uni_3', label: 'Step-up haltères', desc: 'Fonctionnel, genou protégé', target_areas: ['Quadriceps', 'Fessiers', 'Équilibre'], recommended_for: ['maintien', 'cardio'] },
        ]
      },
    ]
  },
  {
    key: 'shoulders',
    label: '💪 Épaules',
    summary_focus: {
      seche: "Épaules détaillées — faisceau médial et arrière",
      prise_masse: "Masse deltoïdienne — presse lourde + élévations",
      maintien: "Épaules complètes — avant/arrière/médial",
      force: "Force overhead — deltoïdes et trapèzes",
      cardio: "Endurance épaules — circuits + haut volume",
    },
    exercises: [
      {
        slot: 'Exercice de presse',
        options: [
          { value: 'shoul_press_1', label: 'Développé militaire barre', desc: 'Overhead press — force', target_areas: ['Deltoïde antérieur', 'Trapèzes'], recommended_for: ['force', 'prise_masse'] },
          { value: 'shoul_press_2', label: 'Développé épaules haltères', desc: 'Amplitude et contrôle', target_areas: ['Épaules complètes', 'Deltoïdes'], recommended_for: ['maintien', 'prise_masse'] },
          { value: 'shoul_press_3', label: 'Presse épaules machine', desc: 'Guidé, sécurisé', target_areas: ['Deltoïdes', 'Sécurité articulaire'], recommended_for: ['seche', 'maintien'] },
        ]
      },
      {
        slot: 'Élévations latérales',
        options: [
          { value: 'shoul_lat_1', label: 'Élévations latérales haltères', desc: 'Faisceau médial', target_areas: ['Deltoïde médial', 'Largeur d\'épaule'], recommended_for: ['seche', 'maintien'] },
          { value: 'shoul_lat_2', label: 'Élévations câble bas', desc: 'Tension constante', target_areas: ['Deltoïde médial', 'Tension continue'], recommended_for: ['seche', 'prise_masse'] },
          { value: 'shoul_lat_3', label: 'Élévations machine', desc: 'Isolation guidée', target_areas: ['Faisceau médial', 'Isolation pure'], recommended_for: ['maintien', 'cardio'] },
        ]
      },
      {
        slot: 'Arrière de l\'épaule',
        options: [
          { value: 'shoul_rear_1', label: 'Oiseau haltères (incliné)', desc: 'Deltoïde postérieur', target_areas: ['Deltoïde postérieur', 'Coiffe des rotateurs'], recommended_for: ['maintien', 'seche'] },
          { value: 'shoul_rear_2', label: 'Face pull câble', desc: 'Épaule arrière + coiffe', target_areas: ['Arrière d\'épaule', 'Trapèzes inférieurs'], recommended_for: ['force', 'maintien'] },
          { value: 'shoul_rear_3', label: 'Élévation 45° haltères', desc: 'Arrière + trapèze', target_areas: ['Deltoïde postérieur', 'Trapèzes'], recommended_for: ['prise_masse', 'force'] },
        ]
      },
    ]
  },
  {
    key: 'arms',
    label: '💪 Bras',
    summary_focus: {
      seche: "Bras définis — biceps pic et triceps fer à cheval",
      prise_masse: "Masse brachiale — biceps et triceps volumineux",
      maintien: "Bras équilibrés — biceps/triceps proportionnés",
      force: "Force des bras — triceps lourds + biceps",
      cardio: "Endurance des bras — circuits + pompes",
    },
    exercises: [
      {
        slot: 'Biceps principal',
        options: [
          { value: 'arms_bi_1', label: 'Curl barre droite', desc: 'Charges lourdes — masse', target_areas: ['Biceps (masse globale)', 'Brachial'], recommended_for: ['prise_masse', 'force'] },
          { value: 'arms_bi_2', label: 'Curl haltères alterné', desc: 'Amplitude + supination', target_areas: ['Biceps (pic)', 'Longue portion'], recommended_for: ['seche', 'maintien'] },
          { value: 'arms_bi_3', label: 'Curl marteau', desc: 'Brachial et brachioradial', target_areas: ['Brachial', 'Brachio-radial', 'Avant-bras'], recommended_for: ['maintien', 'force'] },
        ]
      },
      {
        slot: 'Triceps principal',
        options: [
          { value: 'arms_tri_1', label: 'Dips (barres parallèles)', desc: 'Masse triceps', target_areas: ['Triceps (masse)', 'Pec inférieur'], recommended_for: ['prise_masse', 'force'] },
          { value: 'arms_tri_2', label: 'Développé couché prise serrée', desc: 'Triceps + pec', target_areas: ['Triceps', 'Milieu du pec'], recommended_for: ['force', 'prise_masse'] },
          { value: 'arms_tri_3', label: 'Barre au front (skullcrusher)', desc: 'Isolation triceps lourds', target_areas: ['Triceps (longue portion)', 'Isolation'], recommended_for: ['seche', 'maintien'] },
        ]
      },
      {
        slot: 'Isolation finition',
        options: [
          { value: 'arms_iso_1', label: 'Curl incliné haltères', desc: 'Biceps en étirement', target_areas: ['Biceps (longue portion)', 'Étirement fascial'], recommended_for: ['seche', 'prise_masse'] },
          { value: 'arms_iso_2', label: 'Extensions triceps câble', desc: 'Contraction maximale', target_areas: ['Triceps (contraction)', 'Vaste externe'], recommended_for: ['seche', 'maintien'] },
          { value: 'arms_iso_3', label: 'Curl concentré', desc: 'Pic biceps — isolation', target_areas: ['Biceps (pic)', 'Isolation maximale'], recommended_for: ['seche', 'maintien'] },
        ]
      },
    ]
  },
  {
    key: 'core',
    label: '🔥 Abdos / Core',
    summary_focus: {
      seche: "Abdos ciselés — droite du ventre et obliques",
      prise_masse: "Core blindé — abdominaux + stabilisateurs",
      maintien: "Core fonctionnel — force et stabilité",
      force: "Force du tronc — transfert compound",
      cardio: "Endurance abdominale — circuits gainage",
    },
    exercises: [
      {
        slot: 'Gainage / stabilité',
        options: [
          { value: 'core_stab_1', label: 'Planche frontale', desc: 'Gainage isométrique', target_areas: ['Transverse', 'Droit de l\'abdomen'], recommended_for: ['maintien', 'force'] },
          { value: 'core_stab_2', label: 'Planche latérale', desc: 'Obliques + stabilité', target_areas: ['Obliques', 'Stabilisateurs latéraux'], recommended_for: ['seche', 'maintien'] },
          { value: 'core_stab_3', label: 'Dead bug', desc: 'Coordination + transverse', target_areas: ['Transverse', 'Contrôle moteur'], recommended_for: ['force', 'maintien'] },
        ]
      },
      {
        slot: 'Flexion abdominale',
        options: [
          { value: 'core_flex_1', label: 'Crunch classique', desc: 'Droit de l\'abdomen', target_areas: ['Droit de l\'abdomen (haut)'], recommended_for: ['seche', 'maintien'] },
          { value: 'core_flex_2', label: 'Crunch câble / machine', desc: 'Résistance ajustable', target_areas: ['Droit de l\'abdomen', 'Hypertrophie'], recommended_for: ['prise_masse', 'force'] },
          { value: 'core_flex_3', label: 'Sit-up lesté', desc: 'Amplitude complète', target_areas: ['Droit de l\'abdomen complet', 'Fléchisseurs hanche'], recommended_for: ['force', 'prise_masse'] },
        ]
      },
      {
        slot: 'Bas du ventre',
        options: [
          { value: 'core_low_1', label: 'Leg raise suspendu', desc: 'Bas du ventre — intensif', target_areas: ['Bas du droit de l\'abdomen', 'Fléchisseurs hanche'], recommended_for: ['seche', 'force'] },
          { value: 'core_low_2', label: 'Relevé de genoux', desc: 'Version accessible', target_areas: ['Bas du ventre', 'Contrôle lombaire'], recommended_for: ['maintien', 'seche'] },
          { value: 'core_low_3', label: 'Roue abdominale (ab wheel)', desc: 'Core complet — avancé', target_areas: ['Core complet', 'Érecteurs', 'Épaules'], recommended_for: ['force', 'maintien'] },
        ]
      },
    ]
  },
];

// Exercices nécessitant une salle complète (machines, barres guidées, câbles)
const REQUIRES_GYM = [
  'chest_main_1', 'chest_main_2', 'chest_incline_1', 'chest_incline_2', 'chest_iso_1', 'chest_iso_2',
  'back_pull_2', 'back_pull_3', 'back_row_1', 'back_row_3', 'back_fin_1', 'back_fin_2',
  'legs_quad_2', 'legs_quad_3', 'legs_post_2',
  'shoul_press_1', 'shoul_press_3', 'shoul_lat_1', 'shoul_lat_2', 'shoul_lat_3', 'shoul_rear_2',
  'arms_bi_1', 'arms_bi_2', 'arms_tri_1', 'arms_tri_2', 'arms_tri_3', 'arms_iso_1', 'arms_iso_2', 'arms_iso_3',
  'core_flex_2', 'core_flex_3', 'core_low_1', 'core_low_3',
];

// Exercices nécessitant au moins équipement essentiel (haltères, barre de traction)
const REQUIRES_ESSENTIAL = [
  'chest_main_2', 'chest_incline_2', 'chest_iso_3',
  'back_pull_1', 'back_row_2', 'back_fin_3',
  'legs_post_1', 'legs_post_3', 'legs_uni_3',
  'shoul_press_2', 'shoul_rear_1', 'shoul_rear_3',
  'arms_bi_1', 'arms_bi_2', 'arms_bi_3', 'arms_iso_1',
  'arms_tri_3',
  'core_low_3',
];

function isAvailableForEquipment(optionValue, equipment) {
  if (equipment === 'salle_complete') return true;
  if (equipment === 'essentiel') return !REQUIRES_GYM.includes(optionValue);
  // aucun = poids du corps uniquement
  return !REQUIRES_GYM.includes(optionValue) && !REQUIRES_ESSENTIAL.includes(optionValue);
}

// Fonction pour obtenir la recommandation IA pour une option
function getRecommendation(option, profile) {
  if (!profile) return null;
  const { goal, body_type_score, weak_muscles, fitness_level, equipment } = profile;
  
  const recommendedForGoal = option.recommended_for?.includes(goal);
  let levelBonus = 0;
  if (fitness_level === 'debutant' && option.value.includes('machine')) levelBonus = 1;
  if (fitness_level === 'avance' && option.value.includes('lourd')) levelBonus = 1;
  
  const score = (recommendedForGoal ? 3 : 0) + levelBonus;
  return score >= 3 ? 'high' : score >= 2 ? 'medium' : null;
}

export default function ExercisePreferences({ preferences, onChange, profile, onAutoGenerate }) {
  const [openGroups, setOpenGroups] = useState({ chest: true });
  const [generatingAuto, setGeneratingAuto] = useState(false);
  
  // Déterminer quels groupes afficher selon le mode de séance (si disponible via profile ou context)
  // Par défaut, on affiche tout, mais l'IA filtrera selon sessionMode
  const sessionMode = profile?.sessionMode || 'musculation';
  const groupsToShow = sessionMode === 'cardio' 
    ? CARDIO_EXERCISES 
    : MUSCLE_GROUPS;

  const toggleGroup = (key) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectOption = (muscleKey, slotIdx, value) => {
    const currentSlots = preferences[muscleKey] || {};
    const currentVal = currentSlots[slotIdx];
    const newVal = currentVal === value ? null : value;
    const newSlots = { ...currentSlots, [slotIdx]: newVal };
    Object.keys(newSlots).forEach(k => { if (!newSlots[k]) delete newSlots[k]; });
    onChange({ ...preferences, [muscleKey]: Object.keys(newSlots).length > 0 ? newSlots : undefined });
  };

  const isSelected = (muscleKey, slotIdx, value) => {
    return (preferences[muscleKey] || {})[slotIdx] === value;
  };

  const getGroupSelectionCount = (muscleKey) => {
    const slots = preferences[muscleKey] || {};
    return Object.keys(slots).length;
  };

  const handleAutoGenerate = async () => {
    if (!profile || !onAutoGenerate) return;
    setGeneratingAuto(true);
    await onAutoGenerate();
    setGeneratingAuto(false);
  };

  return (
    <div className="space-y-3">
      {/* Header avec auto-génération */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-base text-foreground">Personnalise tes exercices</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Pour chaque groupe musculaire, choisis ta variante préférée ou laisse l'IA recommander.
          </p>
        </div>
        {profile && (
          <button
            onClick={handleAutoGenerate}
            disabled={generatingAuto}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold hover:from-orange-400 hover:to-orange-500 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            {generatingAuto ? 'IA réfléchit...' : 'Génération auto via recommandations IA'}
          </button>
        )}
      </div>

      {groupsToShow.map((group) => {
        const count = getGroupSelectionCount(group.key);
        const isOpen = openGroups[group.key];

        return (
          <div key={group.key} className="rounded-xl border border-white/[0.08] overflow-hidden">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
              style={{ background: 'rgba(255,255,255,255,0.03)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{group.label}</span>
                {count > 0 && (
                  <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-green-500 flex items-center justify-center text-[10px] font-bold text-black">
                    {count}
                  </span>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {/* Exercises */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-1 space-y-4 border-t border-white/[0.06]">
                    {group.exercises.map((exSlot, slotIdx) => {
                      const selectedHere = (preferences[group.key] || {})[slotIdx];
                      return (
                        <div key={slotIdx}>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {exSlot.slot}
                          </p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {exSlot.options.map((opt, optIdx) => {
                              const equipment = profile?.equipment || 'salle_complete';
                              const available = isAvailableForEquipment(opt.value, equipment);
                              if (!available) return null;
                              const sel = isSelected(group.key, slotIdx, opt.value);
                              const recLevel = getRecommendation(opt, profile);
                              const isRecommended = recLevel === 'high';
                              
                              return (
                                <div key={opt.value} className="relative">
                                  <button
                                    onClick={() => selectOption(group.key, slotIdx, opt.value)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                                      sel
                                        ? 'border-green-500 text-foreground'
                                        : isRecommended
                                          ? 'border-orange-500/60 text-foreground'
                                          : 'border-white/[0.08] hover:border-green-500/30 text-muted-foreground'
                                    }`}
                                    style={{ 
                                      background: sel 
                                        ? 'rgba(74,222,128,0.1)' 
                                        : isRecommended 
                                          ? 'rgba(249,115,22,0.08)' 
                                          : 'rgba(255,255,255,0.03)' 
                                    }}
                                  >
                                    {/* Option badge A/B/C */}
                                    <span className={`shrink-0 h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                                      sel ? 'bg-green-500 text-black' : isRecommended ? 'bg-orange-500 text-white' : 'bg-white/[0.08] text-muted-foreground'
                                    }`}>
                                      {sel ? <Check className="h-3 w-3" /> : isRecommended ? <Star className="h-3 w-3" /> : String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <span className={`text-xs font-semibold block ${sel ? 'text-green-400' : isRecommended ? 'text-orange-400' : ''}`}>{opt.label}</span>
                                      <span className="text-[10px] opacity-60 leading-tight block">{opt.desc}</span>
                                    </div>
                                  </button>
                                  {isRecommended && (
                                    <div className="absolute -top-2.5 left-8 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center gap-1 shadow-lg shadow-orange-500/40">
                                      <Star className="h-2.5 w-2.5" />
                                      Recommandé pour toi
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}