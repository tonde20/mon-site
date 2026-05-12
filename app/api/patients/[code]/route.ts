import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: { code: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  if (session.role === 'patient' && session.code !== params.code) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const db = getDb();
  const patient = db.prepare(
    'SELECT id, code, nom, prenom, date_naissance, sexe, telephone, adresse, decede, created_at FROM patients WHERE code = ?'
  ).get(params.code) as any;

  if (!patient) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });

  const consultations = db.prepare(`
    SELECT c.*, d.nom as doctor_nom, d.prenom as doctor_prenom
    FROM consultations c
    JOIN doctors d ON c.doctor_id = d.id
    WHERE c.patient_id = ?
    ORDER BY c.date DESC
  `).all(patient.id) as any[];

  for (const consult of consultations) {
    consult.prescriptions = db.prepare('SELECT * FROM prescriptions WHERE consultation_id = ?').all(consult.id);
    consult.examens = db.prepare('SELECT * FROM examens WHERE consultation_id = ?').all(consult.id);
  }

  const rendez_vous = db.prepare(`
    SELECT rv.*, d.nom as doctor_nom, d.prenom as doctor_prenom
    FROM rendez_vous rv
    JOIN doctors d ON rv.doctor_id = d.id
    WHERE rv.patient_id = ?
    ORDER BY rv.date_heure DESC
  `).all(patient.id);

  return NextResponse.json({ patient, consultations, rendez_vous });
}

export async function PUT(req: NextRequest, { params }: { params: { code: string } }) {
  const session = getSession();
  if (!session || session.role === 'patient') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const data = await req.json();
  const db = getDb();
  const allowed = ['nom', 'prenom', 'date_naissance', 'sexe', 'telephone', 'adresse'];
  const fields = Object.keys(data).filter(k => allowed.includes(k)).map(k => `${k} = ?`).join(', ');
  const values = Object.keys(data).filter(k => allowed.includes(k)).map(k => data[k]);
  if (!fields) return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 });
  db.prepare(`UPDATE patients SET ${fields} WHERE code = ?`).run(...values, params.code);
  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { code: string } }) {
  const session = getSession();
  if (!session || session.role === 'patient') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const db = getDb();
  const patient = db.prepare('SELECT id FROM patients WHERE code = ?').get(params.code) as any;
  if (!patient) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 });

  db.prepare('DELETE FROM paiements WHERE patient_id = ?').run(patient.id);
  db.prepare('DELETE FROM certificats WHERE patient_id = ?').run(patient.id);
  db.prepare('DELETE FROM rendez_vous WHERE patient_id = ?').run(patient.id);
  db.prepare('DELETE FROM consultations WHERE patient_id = ?').run(patient.id);
  db.prepare('DELETE FROM patients WHERE id = ?').run(patient.id);

  return NextResponse.json({ success: true });
}
