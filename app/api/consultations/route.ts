import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'medecin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const { patient_id, motif, diagnostic, notes, tension, temperature, poids, taille, prescriptions, examens } = await req.json();
  if (!patient_id) return NextResponse.json({ error: 'Patient requis' }, { status: 400 });

  const db = getDb();
  const settings = db.prepare('SELECT value FROM settings WHERE key = ?').get('consultation_validite_jours') as any;
  const validiteDays = parseInt(settings?.value || '10');
  const validiteDate = new Date();
  validiteDate.setDate(validiteDate.getDate() + validiteDays);
  const valide_jusqu = validiteDate.toISOString().split('T')[0];

  const fraisRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('consultation_frais') as any;
  const montant = parseInt(fraisRow?.value || '1250');

  const result = db.prepare(`
    INSERT INTO consultations (patient_id, doctor_id, motif, diagnostic, notes, tension, temperature, poids, taille, valide_jusqu, montant)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(patient_id, session.id, motif || null, diagnostic || null, notes || null, tension || null, temperature || null, poids || null, taille || null, valide_jusqu, montant);

  const consultId = result.lastInsertRowid;

  if (prescriptions?.length) {
    const stmtP = db.prepare('INSERT INTO prescriptions (consultation_id, medicament, posologie, duree) VALUES (?, ?, ?, ?)');
    for (const p of prescriptions) {
      if (p.medicament) stmtP.run(consultId, p.medicament, p.posologie || null, p.duree || null);
    }
  }

  if (examens?.length) {
    const stmtE = db.prepare('INSERT INTO examens (consultation_id, type_examen, description) VALUES (?, ?, ?)');
    for (const e of examens) {
      if (e.type_examen) stmtE.run(consultId, e.type_examen, e.description || null);
    }
  }

  db.prepare('INSERT INTO paiements (patient_id, type, reference_id, montant) VALUES (?, ?, ?, ?)').run(patient_id, 'consultation', consultId, montant);

  return NextResponse.json({ id: consultId, success: true });
}

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session || session.role === 'patient') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patient_id');
  const db = getDb();
  let consultations;
  if (patientId) {
    consultations = db.prepare(`
      SELECT c.*, d.nom as doctor_nom, d.prenom as doctor_prenom
      FROM consultations c JOIN doctors d ON c.doctor_id = d.id
      WHERE c.patient_id = ? ORDER BY c.date DESC
    `).all(patientId);
  } else {
    consultations = db.prepare(`
      SELECT c.*, d.nom as doctor_nom, d.prenom as doctor_prenom,
             p.nom as patient_nom, p.prenom as patient_prenom, p.code as patient_code
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN patients p ON c.patient_id = p.id
      ORDER BY c.date DESC LIMIT 100
    `).all();
  }
  return NextResponse.json(consultations);
}
