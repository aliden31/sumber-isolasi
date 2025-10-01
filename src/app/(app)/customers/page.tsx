
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerTable } from '@/components/customers/customer-table';
import { CustomerActions } from '@/components/customers/customer-actions';
import { collection, onSnapshot, orderBy, query, limit, startAfter, endBefore, limitToLast, getDocs, DocumentData, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
  const [page, setPage] = useState(1);
  const [customersPerPage, setCustomersPerPage] = useState(50);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchCustomers = useCallback(async (direction: 'next' | 'prev' | 'initial') => {
    setLoading(true);
    let q: Query<DocumentData>;
    const baseQuery = query(collection(db, "customers"), orderBy('name'));

    if (direction === 'next' && lastVisible) {
      q = query(baseQuery, startAfter(lastVisible), limit(customersPerPage));
    } else if (direction === 'prev' && firstVisible) {
      q = query(baseQuery, endBefore(firstVisible), limitToLast(customersPerPage));
    } else {
      q = query(baseQuery, limit(customersPerPage));
    }

    const snapshot = await getDocs(q);
    const customerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    
    setCustomers(customerList);
    setLastVisible(snapshot.docs[snapshot.docs.length-1]);
    setFirstVisible(snapshot.docs[0]);

    if (snapshot.docs.length < customersPerPage) {
        setHasNextPage(false);
    } else {
        const nextQuery = query(baseQuery, startAfter(snapshot.docs[snapshot.docs.length - 1]), limit(1));
        const nextSnapshot = await getDocs(nextQuery);
        setHasNextPage(!nextSnapshot.empty);
    }

    setLoading(false);
  }, [customersPerPage, lastVisible, firstVisible]);

  useEffect(() => {
    fetchCustomers('initial');
  }, [customersPerPage]);

  const handleNextPage = () => {
    setPage(p => p + 1);
    fetchCustomers('next');
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(p => p - 1);
      fetchCustomers('prev');
    }
  };
  
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Manajemen Pelanggan</h1>
        <CustomerActions hasCustomers={customers.length > 0} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Pelanggan</CardTitle>
          <div className="pt-4">
            <Input
              placeholder="Cari nama pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <CustomerTable data={filteredCustomers} />
          )}
        </CardContent>
         <CardFooter className="flex flex-wrap justify-between items-center gap-4">
             <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tampilkan</span>
                 <Select value={String(customersPerPage)} onValueChange={(v) => setCustomersPerPage(Number(v))}>
                    <SelectTrigger className="w-[80px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[50, 100, 200, 300, 500].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <span className="text-sm text-muted-foreground">pelanggan per halaman.</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Halaman {page}</span>
                <Button variant="outline" onClick={handlePrevPage} disabled={page === 1 || loading}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Sebelumnya
                </Button>
                <Button variant="outline" onClick={handleNextPage} disabled={!hasNextPage || loading}>
                    Berikutnya <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
