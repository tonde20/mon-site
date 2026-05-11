import { NextRequest, NextResponse } from 'next/server';
import { loginUser, createSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { role, identifier, password } = await req.json();

  if (!role || !identifier || !password) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const user = await loginUser(role, identifier, password);
  if (!user) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
  }

  const sessionValue = createSessionCookie(user);
  const response = NextResponse.json({ success: true, user });
  response.cookies.set('session', sessionValue, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
  });
  return response;
}
