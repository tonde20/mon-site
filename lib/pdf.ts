import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Palette ──────────────────────────────────────────────
const GREEN       = [22, 101, 52]   as [number,number,number];  // #166534
const GREEN_LIGHT = [220, 252, 231] as [number,number,number];  // #dcfce7
const TEAL        = [13, 148, 136]  as [number,number,number];  // #0d9488
const TEAL_LIGHT  = [204, 251, 241] as [number,number,number];  // #ccfbf1
const GRAY_DARK   = [31, 41, 55]    as [number,number,number];  // #1f2937
const GRAY_MID    = [107, 114, 128] as [number,number,number];  // #6b7280
const GRAY_LIGHT  = [249, 250, 251] as [number,number,number];  // #f9fafb
const WHITE       = [255, 255, 255] as [number,number,number];
const BORDER      = [209, 213, 219] as [number,number,number];  // #d1d5db

function addHeader(doc: jsPDF, etablissement: string, titre: string, sousTitre?: string) {
  const w = doc.internal.pageSize.getWidth();

  // Bande verte en haut
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, w, 28, 'F');

  // Nom établissement
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(etablissement.toUpperCase(), w / 2, 11, { align: 'center' });

  // Titre du document
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(titre, w / 2, 19, { align: 'center' });

  // Sous-titre
  if (sousTitre) {
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_MID);
    doc.text(sousTitre, w / 2, 26, { align: 'center' });
  }

  // Ligne de séparation
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(14, 32, w - 14, 32);

  doc.setTextColor(...GRAY_DARK);
}

function addFooter(doc: jsPDF, etablissement: string) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(14, h - 14, w - 14, h - 14);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_MID);
    doc.text(etablissement, 14, h - 8);
    doc.text(`Page ${i} / ${pageCount}`, w - 14, h - 8, { align: 'right' });
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, w / 2, h - 8, { align: 'center' });
  }
}

// ── ORDONNANCE ────────────────────────────────────────────
export function genererOrdonnance(opts: {
  etablissement: string;
  patient: { prenom: string; nom: string; code: string; date_naissance?: string; sexe?: string };
  consultation: {
    date: string; valide_jusqu: string; motif?: string; diagnostic?: string;
    tension?: string; temperature?: string; poids?: string;
    doctor_prenom: string; doctor_nom: string;
    prescriptions: { medicament: string; posologie?: string; duree?: string }[];
    examens: { type_examen: string; description?: string }[];
  };
}) {
  const { etablissement, patient, consultation } = opts;
  const doc = new jsPDF('p', 'mm', 'a4');
  const w = doc.internal.pageSize.getWidth();

  addHeader(doc, etablissement, 'ORDONNANCE MÉDICALE',
    `Dr. ${consultation.doctor_prenom} ${consultation.doctor_nom} — ${new Date(consultation.date).toLocaleDateString('fr-FR')}`);

  let y = 37;

  // ── Bloc patient / médecin ───────────────────────────────
  const colW = (w - 28) / 2;
  // Fond gauche (patient)
  doc.setFillColor(...GREEN_LIGHT);
  doc.roundedRect(14, y, colW - 2, 26, 2, 2, 'F');
  // Fond droit (médecin)
  doc.setFillColor(...TEAL_LIGHT);
  doc.roundedRect(14 + colW + 2, y, colW - 2, 26, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text('PATIENT', 18, y + 6);
  doc.setTextColor(...TEAL);
  doc.text('MÉDECIN', 18 + colW + 6, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY_DARK);
  doc.setFontSize(9.5);
  doc.text(`${patient.prenom} ${patient.nom}`, 18, y + 13);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_MID);
  doc.text(`Code : ${patient.code}`, 18, y + 19);
  if (patient.date_naissance) {
    const age = Math.floor((Date.now() - new Date(patient.date_naissance).getTime()) / (365.25*24*3600*1000));
    doc.text(`Né(e) le ${new Date(patient.date_naissance).toLocaleDateString('fr-FR')} (${age} ans)`, 18, y + 24);
  }

  doc.setFontSize(9.5);
  doc.setTextColor(...GRAY_DARK);
  doc.text(`Dr. ${consultation.doctor_prenom} ${consultation.doctor_nom}`, 18 + colW + 6, y + 13);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_MID);
  doc.text(`Date : ${new Date(consultation.date).toLocaleDateString('fr-FR')}`, 18 + colW + 6, y + 19);
  doc.text(`Valide jusqu'au : ${new Date(consultation.valide_jusqu).toLocaleDateString('fr-FR')}`, 18 + colW + 6, y + 24);

  y += 32;

  // ── Constantes vitales ───────────────────────────────────
  const { tension, temperature, poids } = consultation;
  if (tension || temperature || poids) {
    const items = [
      tension      && `TA : ${tension}`,
      temperature  && `T° : ${temperature}°C`,
      poids        && `Poids : ${poids} kg`,
    ].filter(Boolean) as string[];
    const cw = (w - 28) / items.length;
    items.forEach((item, i) => {
      doc.setFillColor(...GRAY_LIGHT);
      doc.roundedRect(14 + i * cw, y, cw - 2, 10, 1, 1, 'F');
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY_DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(item, 14 + i * cw + (cw - 2) / 2, y + 6.5, { align: 'center' });
    });
    y += 15;
  }

  // ── Diagnostic / Motif ───────────────────────────────────
  if (consultation.diagnostic || consultation.motif) {
    doc.setFillColor(...GRAY_LIGHT);
    doc.roundedRect(14, y, w - 28, 12, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text('DIAGNOSTIC', 18, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY_DARK);
    doc.setFontSize(9);
    doc.text(consultation.diagnostic || consultation.motif || '', 18, y + 10);
    y += 17;
  }

  // ── Prescriptions ────────────────────────────────────────
  if (consultation.prescriptions.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...GREEN);
    doc.text('Rp/', 14, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_DARK);
    doc.text('PRESCRIPTION', 22, y + 1);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Médicament', 'Posologie', 'Durée']],
      body: consultation.prescriptions.map((p, i) => [
        String(i + 1), p.medicament, p.posologie || '—', p.duree || '—',
      ]),
      styles: { fontSize: 9, cellPadding: 3, textColor: GRAY_DARK },
      headStyles: { fillColor: GREEN, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
      alternateRowStyles: { fillColor: GREEN_LIGHT },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 60 }, 2: { cellWidth: 65 } },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Examens ──────────────────────────────────────────────
  if (consultation.examens.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...TEAL);
    doc.text('EXAMENS DEMANDÉS', 14, y + 1);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Type d\'examen', 'Précisions']],
      body: consultation.examens.map((e, i) => [
        String(i + 1), e.type_examen, e.description || '—',
      ]),
      styles: { fontSize: 9, cellPadding: 3, textColor: GRAY_DARK },
      headStyles: { fillColor: TEAL, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
      alternateRowStyles: { fillColor: TEAL_LIGHT },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 70 } },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Zone signature ───────────────────────────────────────
  const ph = doc.internal.pageSize.getHeight();
  const sigY = Math.max(y + 10, ph - 50);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(w - 80, sigY, w - 14, sigY);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_MID);
  doc.text(`Dr. ${consultation.doctor_prenom} ${consultation.doctor_nom}`, w - 47, sigY + 5, { align: 'center' });
  doc.text('Signature et cachet', w - 47, sigY + 10, { align: 'center' });

  addFooter(doc, etablissement);
  doc.save(`Ordonnance_${patient.code}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── CERTIFICAT ────────────────────────────────────────────
export function genererCertificat(opts: {
  etablissement: string;
  patient: { prenom: string; nom: string; code: string; date_naissance?: string; sexe?: string };
  certificat: { type: string; contenu?: string; date: string; doctor_prenom: string; doctor_nom: string };
}) {
  const { etablissement, patient, certificat } = opts;
  const doc = new jsPDF('p', 'mm', 'a4');
  const w = doc.internal.pageSize.getWidth();

  addHeader(doc, etablissement, `CERTIFICAT ${certificat.type.toUpperCase()}`,
    new Date(certificat.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }));

  let y = 40;

  // Cadre principal
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.8);
  doc.roundedRect(14, y, w - 28, 150, 3, 3, 'S');
  y += 12;

  // Intro
  const age = patient.date_naissance
    ? Math.floor((Date.now() - new Date(patient.date_naissance).getTime()) / (365.25*24*3600*1000))
    : null;
  const civilite = patient.sexe === 'F' ? 'Madame' : 'Monsieur';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY_DARK);
  const intro = `Je soussigné(e), Dr. ${certificat.doctor_prenom} ${certificat.doctor_nom}, médecin au ${etablissement},`;
  doc.text(intro, w / 2, y, { align: 'center' });
  y += 8;
  const certifie = `certifie avoir examiné ce jour ${civilite} ${patient.prenom} ${patient.nom}${age ? `, âgé(e) de ${age} ans` : ''}.`;
  doc.text(certifie, w / 2, y, { align: 'center' });
  y += 12;

  // Contenu
  if (certificat.contenu) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(certificat.contenu, w - 48);
    doc.text(lines, 24, y);
    y += lines.length * 6 + 10;
  }

  // Infos patient dans un tableau
  autoTable(doc, {
    startY: y,
    head: [['Champ', 'Information']],
    body: [
      ['Nom complet', `${patient.prenom} ${patient.nom}`],
      ['Code patient', patient.code],
      ...(patient.date_naissance ? [['Date de naissance', new Date(patient.date_naissance).toLocaleDateString('fr-FR')]] : []),
    ],
    styles: { fontSize: 9, cellPadding: 3, textColor: GRAY_DARK },
    headStyles: { fillColor: GREEN, textColor: WHITE, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: GREEN_LIGHT },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
    margin: { left: 24, right: 24 },
    theme: 'grid',
  });
  y = (doc as any).lastAutoTable.finalY + 20;

  // Signature
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY_DARK);
  doc.text(`Fait à Boromo, le ${new Date(certificat.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, w - 24, y, { align: 'right' });
  y += 20;
  doc.setDrawColor(...BORDER);
  doc.line(w - 80, y, w - 24, y);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_MID);
  doc.text(`Dr. ${certificat.doctor_prenom} ${certificat.doctor_nom}`, w - 52, y + 5, { align: 'center' });
  doc.text('Signature et cachet', w - 52, y + 10, { align: 'center' });

  addFooter(doc, etablissement);
  doc.save(`Certificat_${certificat.type}_${patient.code}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── RAPPORT RECETTES ──────────────────────────────────────
export function genererRapportRecettes(opts: {
  etablissement: string;
  paiements: any[];
  totals: { type: string; total: number; count: number }[];
  globalTotal: number;
  dateDebut?: string;
  dateFin?: string;
}) {
  const { etablissement, paiements, totals, globalTotal, dateDebut, dateFin } = opts;
  const doc = new jsPDF('p', 'mm', 'a4');
  const w = doc.internal.pageSize.getWidth();

  const periode = dateDebut && dateFin
    ? `Période du ${new Date(dateDebut).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}`
    : `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

  addHeader(doc, etablissement, 'RAPPORT DE RECETTES', periode);

  let y = 36;

  // ── Résumé financier ─────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GREEN);
  doc.text('Résumé financier', 14, y);
  y += 4;

  const consultTotal = totals.find(t => t.type === 'consultation');
  const certifTotal  = totals.find(t => t.type === 'certificat');

  autoTable(doc, {
    startY: y,
    head: [['Catégorie', 'Transactions', 'Montant']],
    body: [
      ['Consultations', String(consultTotal?.count ?? 0), `${(consultTotal?.total ?? 0).toLocaleString()} F CFA`],
      ['Certificats',   String(certifTotal?.count ?? 0),  `${(certifTotal?.total ?? 0).toLocaleString()} F CFA`],
      ['TOTAL GÉNÉRAL', String(paiements.length),          `${globalTotal.toLocaleString()} F CFA`],
    ],
    styles: { fontSize: 9.5, cellPadding: 4 },
    headStyles: { fillColor: GREEN, textColor: WHITE, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: GREEN_LIGHT },
    bodyStyles: { textColor: GRAY_DARK },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = GREEN;
        data.cell.styles.textColor = WHITE;
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 },
    theme: 'grid',
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Détail des transactions ───────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TEAL);
  doc.text('Détail des transactions', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Patient', 'Code', 'Type', 'Montant']],
    body: paiements.map(p => [
      new Date(p.date).toLocaleDateString('fr-FR'),
      `${p.patient_prenom ?? ''} ${p.patient_nom ?? ''}`.trim() || '—',
      p.patient_code || '—',
      p.type === 'consultation' ? 'Consultation' : 'Certificat',
      `${Number(p.montant).toLocaleString()} F CFA`,
    ]),
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: GRAY_DARK },
    headStyles: { fillColor: TEAL, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: TEAL_LIGHT },
    columnStyles: {
      0: { cellWidth: 24 },
      2: { cellWidth: 24 },
      3: { cellWidth: 24 },
      4: { halign: 'right', cellWidth: 32 },
    },
    margin: { left: 14, right: 14 },
    theme: 'grid',
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const rawRow = data.row.raw as string[];
        data.cell.styles.textColor = rawRow[3] === 'Consultation' ? GREEN : TEAL;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  addFooter(doc, etablissement);
  doc.save(`Rapport_Recettes_${new Date().toISOString().split('T')[0]}.pdf`);
}
