
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, startAfter, DocumentData, getDocs, endBefore, limitToLast } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Transaction, Account } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, ReceiptText, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { settleReceivable } from '@/app/(app)/pos/actions';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TRANSACTIONS_PER_PAGE = 500;

export default function AccountsReceivablePage() {
  const [receivables, setReceivables] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReceivables, setTotalReceivables] = useState(0);

  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    // Listener for total receivables amount
    const qTotal = query(collection(db, 'transactions'), where('status', '==', 'Belum Lunas'));
    const unsubTotal = onSnapshot(qTotal, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().total;
      });
      setTotalReceivables(total);
    });

    fetchReceivables('initial');

    return () => unsubTotal();
  }, []);

  const fetchReceivables = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    setLoading(true);
    const receivablesCol = collection(db, "transactions");
    
    const baseQuery = query(receivablesCol, where('status', '==', 'Belum Lunas'), orderBy('date', 'desc'));

    let q;
    if (direction === 'next' && lastVisible) {
        q = query(baseQuery, startAfter(lastVisible), limit(TRANSACTIONS_PER_PAGE));
    } else if (direction === 'prev' && firstVisible) {
        q = query(baseQuery, endBefore(firstVisible), limitToLast(TRANSACTIONS_PER_PAGE));
    } else {
        q = query(baseQuery, limit(TRANSACTIONS_PER_PAGE));
    }
    
    const snapshot = await getDocs(q);

    const transactionList = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate(),
      } as Transaction;
    });

    setReceivables(transactionList);
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    setFirstVisible(snapshot.docs[0]);
    
    if (snapshot.docs.length < TRANSACTIONS_PER_PAGE && direction !== 'prev') {
        setHasNextPage(false);
    } else {
        const nextQuery = query(baseQuery, startAfter(snapshot.docs[snapshot.docs.length - 1]), limit(1));
        const nextSnapshot = await getDocs(nextQuery);
        setHasNextPage(!nextSnapshot.empty);
    }
    
    setLoading(false);
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
    fetchReceivables('next');
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      fetchReceivables('prev');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Piutang Usaha</h1>
      </div>

      <Card>
          <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                      <CardTitle>Daftar Piutang Belum Lunas</CardTitle>
                      <CardDescription>Total piutang dari semua pelanggan.</CardDescription>
                  </div>
                  <div className="text-left sm:text-right">
                      <p className="text-sm text-muted-foreground">Total Piutang</p>
                      <p className="text-xl sm:text-2xl font-bold text-destructive">Rp {totalReceivables.toLocaleString('id-ID')}</p>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>No. Invoice</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                         <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : receivables.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                Tidak ada piutang yang belum lunas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        receivables.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{format(tx.date, 'dd MMM yyyy')}</TableCell>
                                <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                                <TableCell>{tx.customerName}</TableCell>
                                <TableCell>
                                    <Badge variant="destructive">{tx.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">Rp {tx.total.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-right">
                                    <SettlePaymentDialog transaction={tx} onSettled={() => fetchReceivables('initial')}/>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Halaman {currentPage}</span>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevPage} disabled={currentPage === 1 || loading}>
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

function SettlePaymentDialog({ transaction, onSettled }: { transaction: Transaction, onSettled: () => void }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [paymentAccountId, setPaymentAccountId] = useState('');
    const [cashBankAccounts, setCashBankAccounts] = useState<Account[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'coa'), where('type', '==', 'Kas & Bank'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCashBankAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
        });
        return () => unsubscribe();
    }, []);

    const handleSettle = () => {
        if (!paymentAccountId) {
            toast({ title: 'Akun pembayaran harus dipilih', variant: 'destructive' });
            return;
        }
        startTransition(async () => {
            const result = await settleReceivable(transaction, paymentAccountId);
            if (result.error) {
                toast({ title: 'Gagal melunasi piutang', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Piutang berhasil dilunasi!' });
                onSettled();
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Catat Pelunasan
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pelunasan Piutang</DialogTitle>
                    <DialogDescription>
                        Konfirmasi pelunasan untuk invoice #{transaction.id} sebesar Rp {transaction.total.toLocaleString('id-ID')}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                    <Label htmlFor="payment-account">Akun Penerimaan Pembayaran</Label>
                    <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                        <SelectTrigger id="payment-account">
                            <SelectValue placeholder="Pilih akun kas/bank..." />
                        </SelectTrigger>
                        <SelectContent>
                            {cashBankAccounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Batal</Button>
                    <Button onClick={handleSettle} disabled={isPending || !paymentAccountId}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Konfirmasi Lunas'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
