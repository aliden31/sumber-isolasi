'use client';

import React, { useState, useEffect } from 'react';
import type { Currency } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyTable } from '@/components/currencies/currency-table';
import { CurrencyActions } from '@/components/currencies/currency-actions';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'currencies'), orderBy('code'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCurrencies(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Currency)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Manajemen Mata Uang
        </h1>
        <CurrencyActions />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Mata Uang</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrencyTable data={currencies} />
        </CardContent>
      </Card>
    </div>
  );
}