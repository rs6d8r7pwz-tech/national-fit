// << Bonhomme >> unique et reutilisable, dessine dans differentes POSES selon l'exercice.
// Le MEME personnage (tete + corps + bras + jambes) change de position.
// Coordonnees dans une boite 0..100 (y vers le bas). Utilise par l'app (SVG) ET le PDF (jsPDF).
//
// Format d'une pose :
//   head:  [cx, cy, r]
//   lines: liste de polylignes ; chaque polyligne = liste de points [x, y] relies.

const P = {
  // Debout, neutre (pose par defaut)
  standing: {
    head: [50, 16, 8],
    lines: [
      [[50, 24], [50, 56]],            // tronc
      [[50, 30], [40, 44], [37, 58]],  // bras gauche
      [[50, 30], [60, 44], [63, 58]],  // bras droit
      [[50, 56], [44, 74], [43, 94]],  // jambe gauche
      [[50, 56], [56, 74], [57, 94]],  // jambe droite
    ],
  },
  // Squat profond : de profil, bassin bas au niveau des genoux, cuisse ~horizontale
  squat: {
    head: [46, 30, 7],
    lines: [
      [[47, 37], [58, 58]],            // buste penche, hanches basses en arriere
      [[48, 40], [33, 46], [26, 48]],  // bras tendus devant (equilibre)
      [[58, 58], [34, 60], [36, 88]],  // cuisse ~horizontale -> tibia vertical -> pied
      [[58, 58], [44, 62], [46, 88]],  // 2e jambe
    ],
  },
  // Pompe : corps gaine bien horizontal, bras tendus vers le sol
  pushup: {
    head: [22, 52, 6],
    lines: [
      [[28, 54], [86, 54]],            // corps horizontal (epaules -> hanches)
      [[38, 55], [38, 74]],            // bras vers le sol
      [[86, 54], [94, 62]],            // jambes/pieds
    ],
  },
  // Gainage / planche : avant-bras a plat au sol, corps droit
  plank: {
    head: [22, 52, 6],
    lines: [
      [[28, 54], [86, 60]],            // corps droit
      [[34, 55], [28, 72], [46, 72]],  // avant-bras a plat au sol
      [[86, 60], [94, 66]],            // pieds
    ],
  },
  // Fente : un pas en avant, genou arriere bas
  lunge: {
    head: [46, 20, 8],
    lines: [
      [[48, 28], [50, 54]],            // tronc droit
      [[48, 32], [42, 46], [40, 58]],  // bras
      [[50, 54], [66, 60], [66, 82]],  // jambe avant (flechie)
      [[50, 54], [40, 72], [34, 90]],  // jambe arriere (genou bas)
    ],
  },
  // Developpe couche : allonge bien droit, bras verticaux qui poussent la barre
  benchpress: {
    head: [24, 58, 6],
    lines: [
      [[30, 60], [82, 60]],            // corps allonge bien droit (torse + jambes)
      [[46, 60], [46, 42]],            // bras gauche vertical
      [[58, 60], [58, 42]],            // bras droit vertical
      [[40, 42], [64, 42]],            // barre au-dessus de la poitrine
    ],
  },
  // Developpe militaire : debout, bras au-dessus de la tete
  overheadpress: {
    head: [50, 24, 8],
    lines: [
      [[50, 32], [50, 60]],            // tronc
      [[50, 34], [40, 22], [40, 10]],  // bras gauche leve
      [[50, 34], [60, 22], [60, 10]],  // bras droit leve
      [[40, 10], [60, 10]],            // barre au-dessus
      [[50, 60], [44, 78], [43, 96]],  // jambe gauche
      [[50, 60], [56, 78], [57, 96]],  // jambe droite
    ],
  },
  // Curl biceps : debout, coudes colles en bas, avant-bras remontes vers les epaules
  curl: {
    head: [50, 16, 7],
    lines: [
      [[50, 23], [50, 56]],            // tronc
      [[47, 27], [45, 44], [49, 28]],  // bras gauche : epaule -> coude bas -> main haute
      [[53, 27], [55, 44], [51, 28]],  // bras droit
      [[50, 56], [44, 74], [43, 94]],  // jambe gauche
      [[50, 56], [56, 74], [57, 94]],  // jambe droite
    ],
  },
  // Rowing / tirage : buste penche, coude qui tire en arriere
  row: {
    head: [34, 34, 8],
    lines: [
      [[38, 40], [64, 52]],            // dos penche
      [[46, 44], [50, 58]],            // bras qui pend / tire
      [[64, 52], [70, 74], [70, 94]],  // jambe
      [[64, 52], [60, 72], [58, 94]],  // 2e jambe
    ],
  },
  // Souleve de terre : buste penche, dos plat, barre au sol devant
  deadlift: {
    head: [36, 30, 8],
    lines: [
      [[40, 37], [60, 55]],            // dos plat penche
      [[45, 42], [42, 62]],            // bras tendus vers la barre
      [[42, 62], [54, 62]],            // barre
      [[60, 55], [56, 76], [55, 94]],  // jambe
      [[60, 55], [64, 76], [65, 94]],  // 2e jambe
    ],
  },
  // Traction / tirage vertical : bras leves qui tirent vers le bas
  pulldown: {
    head: [50, 30, 8],
    lines: [
      [[50, 38], [50, 64]],            // tronc
      [[50, 40], [40, 26], [38, 14]],  // bras gauche leve (tire)
      [[50, 40], [60, 26], [62, 14]],  // bras droit leve (tire)
      [[38, 14], [62, 14]],            // barre
      [[50, 64], [45, 80], [44, 96]],  // jambe gauche
      [[50, 64], [55, 80], [56, 96]],  // jambe droite
    ],
  },
};

export function poseFor(type) {
  return P[type] || P.standing;
}

export const POSES = P;
