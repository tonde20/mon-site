import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const data = await req.json();
  const db = getDb();
  if (data.password) {
    data.password = bcrypt.hashSync(data.password, 10);
  }
  const fields = Object.keys(data).filter(k => k !== 'id').map(k => `${k} = ?`).join(', ');
  const values = Object.keys(data).filter(k => k !== 'id').map(k => data[k]);
  db.prepare(`UPDATE doctors SET ${fields} WHERE id = ?`).run(...values, params.id);
  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  const db = getDb();
  db.prepare('UPDATE doctors SET actif = 0 WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
