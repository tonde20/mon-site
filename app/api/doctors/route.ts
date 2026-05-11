import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const db = getDb();
  const doctors = db.prepare('SELECT id, nom, prenom, telephone, specialite, username, actif, created_at FROM doctors ORDER BY nom').all();
  return NextResponse.json(doctors);
}

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const { nom, prenom, telephone, specialite, username, password } = await req.json();
  if (!nom || !prenom || !telephone || !username || !password) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }
  const db = getDb();
  const hashedPwd = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(
      'INSERT INTO doctors (nom, prenom, telephone, specialite, username, password) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(nom, prenom, telephone, specialite || 'Médecin généraliste', username, hashedPwd);
    return NextResponse.json({ id: result.lastInsertRowid, success: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: "Ce nom d'utilisateur existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
