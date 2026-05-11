import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role === 'patient') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const { statut, notes } = await req.json();
  const db = getDb();
  db.prepare('UPDATE rendez_vous SET statut = ?, notes = ? WHERE id = ?').run(statut, notes || null, params.id);
  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const db = getDb();
  db.prepare('DELETE FROM rendez_vous WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
