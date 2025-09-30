
'use client';

import React, { useState, useEffect } from 'react';
import type { MarketplaceStore, Transaction } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MarketplaceRowActions } from './marketplace-actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface MarketplaceStoreTableProps {
  data: MarketplaceStore[];
}

function HistoryDialog({ store }: { store: MarketplaceStore }) {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    const q = query(
      collection(db, 'transactions'),
      where('channel', '==', store.marketplace),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      } as Transaction));
      setTransactions(txs);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching transactions: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [open, store.marketplace]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto">
          <Badge variant="secondary">{store.marketplace}</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Riwayat Transaksi: {store.storeName}</DialogTitle>
          <DialogDescription>
            Berikut adalah daftar semua transaksi yang diimpor dari channel {store.marketplace}.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Toko ini belum memiliki riwayat transaksi.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Transaksi</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(tx.date, 'dd MMM yyyy, HH:mm')}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                    <TableCell>{tx.customerName}</TableCell>
                    <TableCell className="text-right font-medium">Rp {tx.netTotal?.toLocaleString('id-ID') || tx.total.toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MarketplaceStoreTable({ data }: MarketplaceStoreTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Marketplace</TableHead>
            <TableHead>Nama Toko</TableHead>
            <TableHead>Nama Panggilan (Internal)</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((store) => (
            <TableRow key={store.id}>
              <TableCell>
                <HistoryDialog store={store} />
              </TableCell>
              <TableCell className="font-medium">{store.storeName}</TableCell>
              <TableCell>{store.nickname}</TableCell>
              <TableCell className="text-right">
                <MarketplaceRowActions store={store} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
