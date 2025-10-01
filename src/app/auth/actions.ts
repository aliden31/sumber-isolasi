
'use server';

import { getFirebaseAuth } from 'next-firebase-auth-edge';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authConfig } from '@/config/server-config';

const { setCustomUserClaims, revokeAllSessions } = getFirebaseAuth(
  authConfig.serviceAccount,
  authConfig.apiKey
);

export async function logout() {
  const session = cookies().get('session')?.value;
  if (session) {
    cookies().delete('session');
  }
  redirect('/login');
}
