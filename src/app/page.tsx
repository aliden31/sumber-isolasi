import { collection, getDocs, limit, query } from 'firebase/firestore';
import { redirect } from 'next/navigation';
import { db } from '@/lib/firebase';

export default async function RootPage() {
  const coaSnapshot = await getDocs(query(collection(db, 'coa'), limit(1)));
  
  if (coaSnapshot.empty) {
    redirect('/setup');
  }

  redirect('/dashboard');
}
