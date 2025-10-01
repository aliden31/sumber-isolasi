
'use client';

import React, { useState, useEffect } from 'react';
import type { Tax } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaxTable } from '@/components/taxes/tax-table';
import { TaxActions } from '@/components/taxes/tax-actions';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'taxes'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTaxes(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tax)));
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
        <div />
        <TaxActions />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Tarif Pajak</CardTitle>
        </CardHeader>
        <CardContent>
          <TaxTable data={taxes} />
        </CardContent>
      </Card>
    </div>
  );
}
