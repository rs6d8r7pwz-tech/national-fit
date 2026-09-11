// Bibliothèque de guidage d'exercices pour débutants.
// Pour les mouvements fondamentaux : consignes fiables et instantanées (0 appel IA).
// Chaque entrée : keys (mots-clés FR/EN pour matcher le nom), type (pour l'illustration),
// et 3 consignes courtes (Départ / Mouvement / Erreur à éviter).

export const EXERCISE_GUIDES = [
  {
    type: 'squat',
    keys: ['squat', 'accroupi', 'flexion jambe'],
    cues: [
      'Départ : pieds largeur d\'épaules, pointes légèrement vers l\'extérieur, dos droit.',
      'Mouvement : descends comme pour t\'asseoir, genoux dans l\'axe des pieds, jusqu\'aux cuisses parallèles au sol.',
      'À éviter : les genoux qui rentrent vers l\'intérieur et le dos qui s\'arrondit.',
    ],
  },
  {
    type: 'pushup',
    keys: ['pompe', 'push', 'push-up', 'pushup'],
    cues: [
      'Départ : mains un peu plus larges que les épaules, corps gainé en ligne droite (tête-bassin-talons).',
      'Mouvement : descends la poitrine vers le sol en pliant les coudes (~45°), puis repousse.',
      'À éviter : les hanches qui s\'affaissent ou qui remontent en pont.',
    ],
  },
  {
    type: 'plank',
    keys: ['gainage', 'planche', 'plank', 'gaina'],
    cues: [
      'Départ : sur les avant-bras, coudes sous les épaules, corps en ligne droite.',
      'Mouvement : tiens la position en serrant les abdos et les fessiers, respire calmement.',
      'À éviter : le bassin qui tombe (cambrure) ou qui monte trop haut.',
    ],
  },
  {
    type: 'lunge',
    keys: ['fente', 'lunge', 'split squat', 'bulgarian'],
    cues: [
      'Départ : debout, un grand pas en avant, buste droit.',
      'Mouvement : descends le genou arrière vers le sol, genou avant au-dessus de la cheville.',
      'À éviter : le genou avant qui dépasse largement la pointe du pied.',
    ],
  },
  {
    type: 'benchpress',
    keys: ['développé couché', 'developpe couche', 'bench', 'couché barre', 'couché haltère'],
    cues: [
      'Départ : allongé, pieds au sol, omoplates serrées, barre au-dessus de la poitrine.',
      'Mouvement : descends la barre vers le milieu de la poitrine, coudes ~45°, puis pousse.',
      'À éviter : rebondir la barre sur la poitrine ou décoller les fessiers.',
    ],
  },
  {
    type: 'overheadpress',
    keys: ['développé militaire', 'militaire', 'overhead', 'épaules barre', 'shoulder press', 'développé épaule'],
    cues: [
      'Départ : debout gainé, barre/haltères au niveau des épaules, coudes sous les poignets.',
      'Mouvement : pousse au-dessus de la tête sans cambrer, verrouille les bras en haut.',
      'À éviter : cambrer le bas du dos pour tricher.',
    ],
  },
  {
    type: 'row',
    keys: ['rowing', 'tirage', 'row', 'dos haltère', 'dos barre'],
    cues: [
      'Départ : buste penché en avant (~45°), dos droit, bras tendus.',
      'Mouvement : tire les coudes vers l\'arrière en serrant les omoplates, vers le nombril.',
      'À éviter : arrondir le dos ou tirer avec les bras seuls (pense « coudes »).',
    ],
  },
  {
    type: 'pulldown',
    keys: ['traction', 'pull-up', 'pullup', 'tirage vertical', 'lat pulldown', 'poulie haute'],
    cues: [
      'Départ : bras tendus au-dessus, prise un peu plus large que les épaules.',
      'Mouvement : tire les coudes vers le bas, poitrine vers la barre, en serrant le dos.',
      'À éviter : te balancer pour t\'aider avec l\'élan.',
    ],
  },
  {
    type: 'curl',
    keys: ['curl', 'biceps'],
    cues: [
      'Départ : bras le long du corps, coudes collés aux côtes, paumes vers l\'avant.',
      'Mouvement : monte la charge en fléchissant le coude, sans bouger le haut du bras.',
      'À éviter : balancer le buste ou décoller les coudes.',
    ],
  },
  {
    type: 'deadlift',
    keys: ['soulevé de terre', 'souleve de terre', 'deadlift', 'hip thrust', 'romanian'],
    cues: [
      'Départ : barre proche des tibias, dos plat, hanches en arrière.',
      'Mouvement : pousse dans les jambes et redresse les hanches, dos gainé du début à la fin.',
      'À éviter : arrondir le bas du dos — c\'est la première cause de blessure.',
    ],
  },
];

// Trouve la fiche correspondant au nom de l'exercice (insensible à la casse/accents).
export function matchGuide(exerciseName) {
  if (!exerciseName) return null;
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const n = norm(exerciseName);
  for (const g of EXERCISE_GUIDES) {
    if (g.keys.some(k => n.includes(norm(k)))) return g;
  }
  return null;
}

// Lien YouTube FIABLE (recherche réelle, jamais un ID inventé par l'IA).
export function youtubeSearchUrl(exerciseName) {
  const q = encodeURIComponent(`${exerciseName} technique exécution débutant`);
  return `https://www.youtube.com/results?search_query=${q}`;
}
