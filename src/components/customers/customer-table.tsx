
'use client';

import React, { useState, useEffect } from 'react';
import type { Customer, Transaction } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CustomerRowActions } from './customer-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerTableProps {
  data: Customer[];
}

export function CustomerTable({ data }: CustomerTableProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCustomer) return;

    setLoading(true);
    const q = query(
      collection(db, 'transactions'),
      where('customerName', '==', selectedCustomer.name),
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
  }, [selectedCustomer]);

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setSelectedCustomer(null);
        setTransactions([]);
    }
  }


  return (
    <Dialog onOpenChange={handleOpenChange}>
        <div className="w-full overflow-x-auto">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="min-w-[200px]">Nama Pelanggan</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>No. Telepon</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {data.map((customer) => (
                <TableRow key={customer.id}>
                <TableCell>
                    <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto font-medium" onClick={() => handleCustomerClick(customer)}>
                            {customer.name}
                        </Button>
                    </DialogTrigger>
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell className="text-right">
                    <CustomerRowActions customer={customer} />
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>

        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Riwayat Pembelian: {selectedCustomer?.name}</DialogTitle>
                <DialogDescription>
                    Berikut adalah daftar semua transaksi yang dilakukan oleh pelanggan ini.
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">Pelanggan ini belum memiliki riwayat transaksi.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>No. Transaksi</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{format(tx.date, 'dd MMM yyyy, HH:mm')}</TableCell>
                                    <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                                    <TableCell className="text-right font-medium">Rp {tx.total.toLocaleString('id-ID')}</TableCell>
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

