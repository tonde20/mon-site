import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'medecin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const { patient_id, type, contenu } = await req.json();
  if (!patient_id || !type) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });

  const db = getDb();
  const fraisRow = db.prepare("SELECT value FROM settings WHERE key = 'certificat_frais'").get() as any;
  const montant = parseInt(fraisRow?.value || '2000');

  const result = db.prepare(
    'INSERT INTO certificats (patient_id, doctor_id, type, contenu, montant) VALUES (?, ?, ?, ?, ?)'
  ).run(patient_id, session.id, type, contenu || null, montant);

  db.prepare('INSERT INTO paiements (patient_id, type, reference_id, montant) VALUES (?, ?, ?, ?)').run(patient_id, 'certificat', result.lastInsertRowid, montant);

  if (type === 'Décès') {
    db.prepare('UPDATE patients SET decede = 1 WHERE id = ?').run(patient_id);
  }

  return NextResponse.json({ id: result.lastInsertRowid, success: true });
}

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session || session.role === 'patient') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patient_id');
  const db = getDb();
  let certs;
  if (patientId) {
    certs = db.prepare(`
      SELECT c.*, d.nom as doctor_nom, d.prenom as doctor_prenom
      FROM certificats c JOIN doctors d ON c.doctor_id = d.id
      WHERE c.patient_id = ? ORDER BY c.date DESC
    `).all(patientId);
  } else {
    certs = db.prepare(`
      SELECT c.*, d.nom as doctor_nom, d.prenom as doctor_prenom,
             p.nom as patient_nom, p.prenom as patient_prenom
      FROM certificats c
      JOIN doctors d ON c.doctor_id = d.id
      JOIN patients p ON c.patient_id = p.id
      ORDER BY c.date DESC LIMIT 100
    `).all();
  }
  return NextResponse.json(certs);
}
