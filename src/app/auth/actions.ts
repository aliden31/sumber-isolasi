
'use server';

import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cookies } from 'next/headers';

const createResponse = (error: string | null = null, data: any = null) => ({ error, data });

export async function login({ email, password }: {email: string, password: string}) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();

    cookies().set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return createResponse(null, { uid: user.uid });
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : 'An unknown error occurred.');
  }
}

export async function signup({ email, password }: {email: string, password: string}) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return createResponse(null, { uid: userCredential.user.uid });
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : 'An unknown error occurred.');
  }
}

export async function logout() {
    try {
        cookies().delete('session');
        await signOut(auth);
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : 'An unknown error occurred.');
    }
}
