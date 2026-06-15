import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';

export default function ProgramPDFExport({ program, isFR = true }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!program) return;
    setLoading(true);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 14;
    const pageW = 210;
    let y = 20;

    // Header band
    doc.setFillColor(30, 80, 220);
    doc.roundedRect(0, 0, pageW, 30, 0, 0, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('NATIONAL FIT', margin, 13);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(isFR ? 'Programme personnalisé IA' : 'AI Personalized Program', margin, 21);

    // Title
    y = 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 80, 220);
    doc.text(program.title || (isFR ? 'Mon Programme' : 'My Program'), margin, y);

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    if (program.description) {
      const descLines = doc.splitTextToSize(program.description, pageW - margin * 2);
      doc.text(descLines, margin, y);
      y += descLines.length * 5 + 3;
    }

    // Meta pills
    const meta = [
      program.level && `${isFR ? 'Niveau' : 'Level'}: ${program.level}`,
      program.goal && `${isFR ? 'Objectif' : 'Goal'}: ${program.goal}`,
      program.equipment && `${isFR ? 'Équipement' : 'Equipment'}: ${program.equipment}`,
      `${program.total_sessions || 0} ${isFR ? 'séances' : 'sessions'}`,
    ].filter(Boolean);

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    let metaX = margin;
    meta.forEach(m => {
      doc.setFillColor(235, 242, 255);
      const w = doc.getTextWidth(m) + 6;
      doc.roundedRect(metaX, y, w, 6, 2, 2, 'F');
      doc.setTextColor(30, 80, 220);
      doc.text(m, metaX + 3, y + 4.2);
      metaX += w + 3;
    });
    y += 12;

    // Separator
    doc.setDrawColor(200, 210, 240);
    doc.line(margin, y, pageW - margin, y);
    y += 7;

    // Sessions
    (program.sessions || []).forEach((session, sIdx) => {
      // Page break check
      if (y > 260) { doc.addPage(); y = 20; }

      // Session header
      doc.setFillColor(235, 242, 255);
      doc.roundedRect(margin, y - 4, pageW - margin * 2, 10, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 80, 220);
      doc.text(`${session.day || `J${sIdx + 1}`} — ${session.name || ''}`, margin + 4, y + 3);
      y += 11;

      // Exercises
      (session.exercises || []).forEach((ex, eIdx) => {
        if (y > 272) { doc.addPage(); y = 20; }

        // Alternate row
        if (eIdx % 2 === 0) {
          doc.setFillColor(249, 250, 255);
          doc.roundedRect(margin, y - 3, pageW - margin * 2, 9, 2, 2, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 60);
        doc.text(`${eIdx + 1}. ${ex.name || ''}`, margin + 3, y + 3);

        const info = `${ex.sets || 3} × ${ex.reps || '10'}  |  ${isFR ? 'Repos' : 'Rest'}: ${ex.rest_seconds || 60}s`;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 120);
        doc.text(info, pageW - margin - doc.getTextWidth(info) - 3, y + 3);

        if (ex.alternative) {
          y += 5;
          doc.setFontSize(7);
          doc.setTextColor(120, 130, 160);
          doc.text(`  ↔ ${isFR ? 'Alt' : 'Alt'}: ${ex.alternative}`, margin + 5, y + 2);
        }

        if (ex.notes) {
          y += 4;
          const noteLines = doc.splitTextToSize(`  💡 ${ex.notes}`, pageW - margin * 2 - 10);
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.text(noteLines, margin + 5, y + 1);
          y += noteLines.length * 3.5;
        }

        y += 7;
      });

      y += 4;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(`NATIONAL FIT — ${isFR ? 'Généré par IA' : 'AI Generated'} — ${new Date().toLocaleDateString(isFR ? 'fr-FR' : 'en-US')}`, margin, 292);
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