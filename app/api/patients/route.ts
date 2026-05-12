import { NextRequest, NextResponse } from 'next/server';
import { getDb, generatePatientCode } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session || session.role === 'patient') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const db = getDb();
  let patients;
  if (search) {
    patients = db.prepare(
      "SELECT id, code, nom, prenom, date_naissance, sexe, telephone, adresse, decede, created_at FROM patients WHERE nom LIKE ? OR prenom LIKE ? OR code LIKE ? ORDER BY decede ASC, nom ASC LIMIT 50"
    ).all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    patients = db.prepare(
      "SELECT id, code, nom, prenom, date_naissance, sexe, telephone, adresse, decede, created_at FROM patients ORDER BY decede ASC, nom ASC LIMIT 100"
    ).all();
  }
  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role === 'patient') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const { nom, prenom, date_naissance, sexe, telephone, adresse, password } = await req.json();
  if (!nom || !prenom) {
    return NextResponse.json({ error: 'Nom et prénom requis' }, { status: 400 });
  }
  const db = getDb();
  const code = generatePatientCode(db);
  const hashedPwd = bcrypt.hashSync(password || code, 10);
  try {
    const result = db.prepare(
      'INSERT INTO patients (code, nom, prenom, date_naissance, sexe, telephone, adresse, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(code, nom, prenom, date_naissance || null, sexe || 'M', telephone || null, adresse || null, hashedPwd);
    return NextResponse.json({ id: result.lastInsertRowid, code, success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
