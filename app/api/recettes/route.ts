import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const dateDebut = searchParams.get('date_debut') || '';
  const dateFin = searchParams.get('date_fin') || '';

  const db = getDb();
  let where = '';
  const params: string[] = [];
  if (dateDebut && dateFin) {
    where = 'WHERE date(paiements.date) BETWEEN ? AND ?';
    params.push(dateDebut, dateFin);
  } else if (dateDebut) {
    where = 'WHERE date(paiements.date) >= ?';
    params.push(dateDebut);
  }

  const paiements = db.prepare(`
    SELECT paiements.*, p.nom as patient_nom, p.prenom as patient_prenom, p.code as patient_code
    FROM paiements
    LEFT JOIN patients p ON paiements.patient_id = p.id
    ${where}
    ORDER BY paiements.date DESC LIMIT 500
  `).all(...params);

  const totals = db.prepare(`
    SELECT type, SUM(montant) as total, COUNT(*) as count
    FROM paiements ${where}
    GROUP BY type
  `).all(...params);

  const globalTotal = db.prepare(`SELECT SUM(montant) as total FROM paiements ${where}`).get(...params) as any;

  return NextResponse.json({ paiements, totals, globalTotal: globalTotal?.total || 0 });
}
