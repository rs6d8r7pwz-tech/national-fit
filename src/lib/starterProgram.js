// ============================================================
// NATIONAL FIT — Generateur de programme DEBUTANT sans IA
// ------------------------------------------------------------
// But : qu'un debutant ne soit JAMAIS bloque. Programme full body
// progressif, sur, adapte au materiel, disponible instantanement
// (filet de securite si l'IA echoue + option "programme en 1 clic").
// Retourne un objet pret pour setPendingProgram() dans Programs.jsx.
// ============================================================

// Pools d'exercices par materiel. Chaque exo :
// [nom, alternative (variante plus facile), groupe, reps, note debutant]
const POOLS = {
  aucun: [
    // Session A
    [
      ['Squat au poids du corps', 'Squat sur une chaise', 'legs', '12-15', 'Descends lentement, genoux dans l\'axe des pieds, dos droit.'],
      ['Pompes', 'Pompes sur les genoux', 'chest', '8-12', 'Corps gaine, coudes a ~45 degres du buste.'],
      ['Fentes alternees', 'Fentes statiques (sans avancer)', 'legs', '10-12 / jambe', 'Genou avant au-dessus de la cheville, buste droit.'],
      ['Gainage planche', 'Planche sur les genoux', 'core', '20-40 s', 'Fessiers serres, ne creuse pas le bas du dos.'],
      ['Superman (extension dorsale)', 'Superman bras seuls', 'back', '12-15', 'Mouvement lent, regarde le sol pour proteger la nuque.'],
    ],
    // Session B
    [
      ['Pont fessier au sol', 'Pont fessier tempo lent', 'legs', '12-15', 'Pousse dans les talons, serre les fessiers en haut.'],
      ['Pompes prise large', 'Pompes sur les genoux', 'chest', '8-12', 'Amplitude complete, poitrine vers le sol.'],
      ['Chaise contre le mur', 'Demi-chaise (moins bas)', 'legs', '30-45 s', 'Cuisses vers l\'horizontale, respire.'],
      ['Dips sur une chaise', 'Dips pieds bien au sol', 'arms', '8-12', 'Coudes vers l\'arriere, descends sous controle.'],
      ['Gainage lateral', 'Planche laterale sur le genou', 'core', '20-30 s / cote', 'Corps aligne, hanche haute.'],
    ],
    // Session C
    [
      ['Fentes marchees', 'Fentes statiques', 'legs', '10-12 / jambe', 'Grands pas, buste droit, controle.'],
      ['Pompes diamant', 'Pompes sur les genoux', 'arms', '6-10', 'Mains rapprochees, coudes pres du corps.'],
      ['Bird-dog', 'Bird-dog tempo lent', 'back', '10-12 / cote', 'Bras et jambe opposes, garde le bassin stable.'],
      ['Releves de jambes au sol', 'Genoux replies', 'core', '10-15', 'Bas du dos colle au sol, descends lentement.'],
      ['Mollets debout', 'Mollets appui mur', 'legs', '15-20', 'Monte haut sur la pointe, pause 1 s.'],
    ],
  ],
  essentiel: [
    [
      ['Goblet squat (haltere)', 'Squat au poids du corps', 'legs', '10-12', 'Haltere contre la poitrine, descends droit.'],
      ['Developpe haltere (sol ou banc)', 'Pompes', 'chest', '8-12', 'Descends les halteres au niveau de la poitrine.'],
      ['Rowing haltere', 'Rowing avec bande elastique', 'back', '10-12 / bras', 'Dos plat, tire le coude vers la hanche.'],
      ['Fentes avec halteres', 'Fentes au poids du corps', 'legs', '10 / jambe', 'Halteres le long du corps, buste droit.'],
      ['Gainage planche', 'Planche sur les genoux', 'core', '20-40 s', 'Corps gaine, respiration reguliere.'],
    ],
    [
      ['Souleve de terre roumain (halteres)', 'Pont fessier au sol', 'legs', '10-12', 'Halteres pres des jambes, dos droit, plie les hanches.'],
      ['Developpe epaules halteres', 'Elevations laterales bande', 'shoulders', '10-12', 'Pousse au-dessus de la tete sans cambrer.'],
      ['Tractions assistees (bande)', 'Rowing haltere', 'back', '6-10', 'Bande sous le pied ou le genou pour t\'aider.'],
      ['Curl biceps halteres', 'Curl avec bande', 'arms', '10-12', 'Coudes fixes, remonte sans balancer.'],
      ['Gainage lateral', 'Planche laterale sur le genou', 'core', '20-30 s / cote', 'Hanche haute, corps aligne.'],
    ],
    [
      ['Fentes bulgares (pied sur banc)', 'Fentes classiques', 'legs', '8-10 / jambe', 'Descends droit, genou avant stable.'],
      ['Developpe incline halteres', 'Pompes pieds sureleves', 'chest', '8-12', 'Banc legerement incline, controle la descente.'],
      ['Elevations laterales halteres', 'Elevations bande', 'shoulders', '12-15', 'Legers, monte jusqu\'a l\'horizontale.'],
      ['Extension triceps haltere', 'Dips sur chaise', 'arms', '10-12', 'Coude haut et fixe, descends derriere la nuque.'],
      ['Releves de jambes', 'Genoux replies', 'core', '10-15', 'Bas du dos au sol, mouvement controle.'],
    ],
  ],
  salle_complete: [
    [
      ['Presse a cuisses', 'Squat guide (machine Smith)', 'legs', '10-12', 'Amplitude complete, ne bloque pas les genoux.'],
      ['Developpe couche halteres', 'Developpe machine pectoraux', 'chest', '8-12', 'Descente controlee, coudes ~45 degres.'],
      ['Tirage vertical poulie', 'Tractions assistees machine', 'back', '10-12', 'Tire vers le haut de la poitrine, dos droit.'],
      ['Leg curl (machine)', 'Pont fessier', 'legs', '12-15', 'Contracte les ischios, controle le retour.'],
      ['Gainage planche', 'Planche sur les genoux', 'core', '30-45 s', 'Corps gaine.'],
    ],
    [
      ['Squat guide (machine Smith)', 'Presse a cuisses', 'legs', '8-12', 'Barre sur le haut du dos, descends droit.'],
      ['Developpe epaules machine', 'Developpe halteres', 'shoulders', '10-12', 'Pousse sans cambrer le bas du dos.'],
      ['Rowing assis poulie', 'Rowing haltere', 'back', '10-12', 'Tire les coudes en arriere, serre les omoplates.'],
      ['Curl biceps poulie', 'Curl halteres', 'arms', '10-12', 'Coudes fixes le long du corps.'],
      ['Crunch machine', 'Releves de jambes', 'core', '12-15', 'Enroule le buste, expire en montant.'],
    ],
    [
      ['Fentes avec halteres', 'Presse a cuisses', 'legs', '10 / jambe', 'Buste droit, grands pas.'],
      ['Developpe incline machine', 'Pompes', 'chest', '8-12', 'Cible le haut des pectoraux.'],
      ['Tirage horizontal poulie', 'Rowing haltere', 'back', '10-12', 'Dos droit, tire vers le nombril.'],
      ['Extension triceps poulie', 'Dips assistes', 'arms', '10-12', 'Coudes fixes, extension complete.'],
      ['Mollets debout (machine)', 'Mollets au poids du corps', 'legs', '15-20', 'Monte haut, pause en haut.'],
    ],
  ],
};

const LETTERS = ['A', 'B', 'C', 'D'];

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

export function buildStarterProgram(profile = {}, language = 'fr') {
  const equipKey = ['aucun', 'essentiel', 'salle_complete'].includes(profile.equipment)
    ? profile.equipment
    : 'aucun';
  const pool = POOLS[equipKey] || POOLS.aucun;

  const days = clamp(parseInt(profile.available_days, 10) || 3, 2, 4);

  // Objectif -> repos + finisher cardio eventuel
  const goal = profile.goal || 'maintien';
  const lightGoal = goal === 'seche' || goal === 'cardio';
  const baseRest = lightGoal ? 60 : 75;

  const sessions = [];
  for (let i = 0; i < days; i++) {
    const tpl = pool[i % pool.length];
    const exercises = tpl.map(([name, alternative, muscle, reps, note]) => ({
      name,
      alternative,
      sets: 3,
      reps,
      rest_seconds: muscle === 'core' ? Math.max(30, baseRest - 30) : baseRest,
      notes: note,
      muscle_group: muscle,
      target_areas: '',
    }));

    // Finisher cardio doux pour seche/cardio (optionnel, accessible)
    if (lightGoal) {
      exercises.push({
        name: 'Cardio doux (marche rapide, velo ou corde)',
        alternative: 'Marche sur place',
        sets: 1,
        reps: '8-10 min',
        rest_seconds: 0,
        notes: 'Rythme ou tu peux encore parler. Pour bruler des calories en douceur.',
        muscle_group: 'cardio',
        target_areas: '',
      });
    }

    sessions.push({
      day: language === 'fr' ? `Jour ${i + 1}` : `Day ${i + 1}`,
      name: `Full Body ${LETTERS[i % LETTERS.length]}`,
      exercises,
    });
  }

  const title = language === 'fr' ? 'Programme Debutant — Full Body' : 'Beginner Program — Full Body';
  const description = language === 'fr'
    ? `Programme full body ${days} seances/semaine, concu pour bien demarrer en toute securite. Exercices simples, progressifs, avec une variante plus facile pour chaque mouvement. Augmente les charges (ou les repetitions) quand une seance devient facile.`
    : `Full-body program, ${days} sessions/week, built to start safely. Simple, progressive exercises with an easier variant for each move. Add weight (or reps) once a session feels easy.`;

  return {
    title,
    description,
    mode: 'cool',
    goal,
    level: 'debutant',
    equipment: equipKey,
    body_type_score: profile.body_type_score,
    total_sessions: days * 4,
    sessions_done: 0,
    exercise_preferences: {},
    weak_muscles: profile.weak_muscles || [],
    sessions,
    is_active: true,
    completed: false,
  };
}
