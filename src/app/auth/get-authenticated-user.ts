
import { authConfig } from '@/config/server-config';
import { getTokens } from 'next-firebase-auth-edge';
import { cookies } from 'next/headers';

export async function getAuthenticatedUser() {
  try {
    const tokens = await getTokens(cookies(), {
      apiKey: authConfig.apiKey,
      cookieName: authConfig.cookieName,
      cookieSignatureKeys: authConfig.cookieSignatureKeys,
      serviceAccount: authConfig.serviceAccount,
    });
    
    return tokens;
  } catch (e) {
    console.error(e);
    return null;
  }
}
