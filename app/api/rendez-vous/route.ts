import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get('doctor_id');

  let query = `
    SELECT rv.*, p.nom as patient_nom, p.prenom as patient_prenom, p.code as patient_code,
           d.nom as doctor_nom, d.prenom as doctor_prenom
    FROM rendez_vous rv
    JOIN patients p ON rv.patient_id = p.id
    JOIN doctors d ON rv.doctor_id = d.id
  `;
  const params: any[] = [];

  if (session.role === 'medecin') {
    query += ' WHERE rv.doctor_id = ?';
    params.push(session.id);
  } else if (session.role === 'patient') {
    query += ' WHERE rv.patient_id = (SELECT id FROM patients WHERE code = ?)';
    params.push(session.code);
  } else if (doctorId) {
    query += ' WHERE rv.doctor_id = ?';
    params.push(doctorId);
  }

  query += ' ORDER BY rv.date_heure DESC LIMIT 100';
  const rdvs = db.prepare(query).all(...params);
  return NextResponse.json(rdvs);
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { patient_id, doctor_id, date_heure, motif } = await req.json();
  if (!doctor_id || !date_heure) {
    return NextResponse.json({ error: 'Médecin et date requis' }, { status: 400 });
  }

  const db = getDb();
  let actualPatientId = patient_id;
  if (session.role === 'patient') {
    const pat = db.prepare('SELECT id FROM patients WHERE code = ?').get(session.code) as any;
    actualPatientId = pat?.id;
  }
  if (!actualPatientId) return NextResponse.json({ error: 'Patient requis' }, { status: 400 });

  const result = db.prepare(
    'INSERT INTO rendez_vous (patient_id, doctor_id, date_heure, motif, statut) VALUES (?, ?, ?, ?, ?)'
  ).run(actualPatientId, doctor_id, date_heure, motif || null, 'en_attente');

  return NextResponse.json({ id: result.lastInsertRowid, success: true });
}
