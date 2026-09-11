import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { poseFor } from '@/lib/bonhomme';
import { matchGuide } from '@/lib/exerciseGuide';

// Couleur de marque (bleu National Fit)
const BLUE = [30, 80, 220];

// Dessine le MÊME bonhomme que dans l'app, dans la pose de l'exercice.
// Coordonnées de pose en 0..100 -> boîte (x, y, size) en mm.
function drawBonhomme(doc, type, x, y, size) {
  const pose = poseFor(type);
  const s = (v) => (v / 100) * size;
  doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.setLineWidth(0.6);
  doc.setLineCap('round');
  doc.setLineJoin('round');
  const [hx, hy, hr] = pose.head;
  doc.circle(x + s(hx), y + s(hy), s(hr), 'S');
  pose.lines.forEach((pl) => {
    for (let i = 0; i < pl.length - 1; i++) {
      doc.line(x + s(pl[i][0]), y + s(pl[i][1]), x + s(pl[i + 1][0]), y + s(pl[i + 1][1]));
    }
  });
}

export default function ProgramPDFExport({ program, isFR = true }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!program) return;
    setLoading(true);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 14;
    const pageW = 210;
    const pageBottom = 285;

    // Bandeau titre
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text('NATIONAL FIT', margin, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(program.title || (isFR ? 'Mon programme' : 'My program'), margin, 19);

    let y = 34;

    // Ligne d'infos compacte (une seule ligne, pas de blabla)
    const meta = [
      program.level && `${isFR ? 'Niveau' : 'Level'} ${program.level}`,
      program.goal,
      `${program.total_sessions || (program.sessions || []).length} ${isFR ? 'séances' : 'sessions'}`,
    ].filter(Boolean).join('   •   ');
    if (meta) {
      doc.setFontSize(9);
      doc.setTextColor(110, 120, 150);
      doc.text(meta, margin, y);
      y += 8;
    }

    // Séances
    (program.sessions || []).forEach((session, sIdx) => {
      if (y > pageBottom - 30) { doc.addPage(); y = 20; }

      // En-tête de séance
      doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      doc.roundedRect(margin, y - 4, pageW - margin * 2, 9, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`${session.day || `J${sIdx + 1}`}  ·  ${session.name || ''}`, margin + 4, y + 2.2);
      y += 12;

      // Exercices : bonhomme + nom + séries×reps
      const rowH = 17;
      (session.exercises || []).forEach((ex, eIdx) => {
        if (y + rowH > pageBottom) { doc.addPage(); y = 20; }

        const rowTop = y;
        // Fond alterné léger
        if (eIdx % 2 === 0) {
          doc.setFillColor(248, 250, 255);
          doc.roundedRect(margin, rowTop, pageW - margin * 2, rowH, 2, 2, 'F');
        }

        // Bonhomme dans la pose de l'exercice
        const type = matchGuide(ex.name)?.type || 'standing';
        drawBonhomme(doc, type, margin + 3, rowTop + 1.5, 14);

        const textX = margin + 22;
        // Nom
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(25, 30, 55);
        doc.text(`${eIdx + 1}. ${ex.name || ''}`, textX, rowTop + 7);

        // Séries × reps · repos (direct, sur une ligne)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(70, 80, 120);
        const line = `${ex.sets || 3} ${isFR ? 'séries' : 'sets'} × ${ex.reps || '10'}   ·   ${isFR ? 'repos' : 'rest'} ${ex.rest_seconds || 60}s`;
        doc.text(line, textX, rowTop + 12.5);

        y += rowH + 2;
      });

      y += 3;
    });

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(170, 175, 190);
      doc.text(`NATIONAL FIT · ${new Date().toLocaleDateString(isFR ? 'fr-FR' : 'en-US')}`, margin, 292);
      doc.text(`${i}/${pageCount}`, pageW - margin, 292, { align: 'right' });
    }

    const filename = `nfit_${(program.title || 'programme').replace(/\s+/g, '_').toLowerCase()}.pdf`;
    doc.save(filename);
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
      {loading ? (isFR ? 'Export...' : 'Exporting...') : 'PDF'}
    </Button>
  );
}
