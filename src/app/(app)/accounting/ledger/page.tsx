
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { collection, onSnapshot, query, orderBy, where, Timestamp, getDocs, limit, startAfter, DocumentData, endBefore, limitToLast, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Account, Journal, JournalEntry } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

type LedgerEntry = {
  date: Date;
  ref: string;
  desc: string;
  debit: number;
  credit: number;
  balance: number;
};

export default function GeneralLedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);
  
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  useEffect(() => {
    const unsubAccounts = onSnapshot(collection(db, 'coa'), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)).sort((a,b) => a.code.localeCompare(b.code)));
      if (!selectedAccountId) setLoading(false);
    });

    return () => unsubAccounts();
  }, [selectedAccountId]);
  
  const fetchLedgerEntries = useCallback(async (direction: 'next' | 'prev' | 'initial') => {
    if (!selectedAccountId) {
        setLedgerEntries([]);
        setLoading(false);
        return;
    };
    
    setLoading(true);

    const fromDate = dateRange?.from || new Date('1970-01-01');
    const toDate = dateRange?.to || new Date();
    toDate.setHours(23, 59, 59, 999);

    const journalsRef = collection(db, 'journals');
    let q = query(journalsRef, orderBy("date", "asc"));
    
    if (fromDate) q = query(q, where("date", ">=", Timestamp.fromDate(fromDate)));
    if (toDate) q = query(q, where("date", "<=", Timestamp.fromDate(toDate)));

    const allRelevantJournalsSnap = await getDocs(q);
    const journalsContainingAccount = allRelevantJournalsSnap.docs.filter(doc => (doc.data() as Journal).entries.some(e => e.accountId === selectedAccountId));
    const journalIds = journalsContainingAccount.map(doc => doc.id);

    if (journalIds.length === 0) {
      setLedgerEntries([]);
      setLoading(false);
      return;
    }

    let finalQuery: Query<DocumentData> = query(
        collection(db, 'journals'),
        where('__name__', 'in', journalIds),
        orderBy('date', 'desc')
    );

    if (direction === 'next' && lastVisible) {
        finalQuery = query(finalQuery, startAfter(lastVisible), limit(entriesPerPage));
    } else if (direction === 'prev' && firstVisible) {
        finalQuery = query(finalQuery, endBefore(firstVisible), limitToLast(entriesPerPage));
    } else {
        finalQuery = query(finalQuery, limit(entriesPerPage));
    }

    const snapshot = await getDocs(finalQuery);
    const pageJournals = snapshot.docs.map(d => ({...d.data(), id: d.id, date: d.data().date.toDate()} as Journal));

    // --- Balance Calculation ---
    const allJournalsBeforeDateQuery = query(
        collection(db, 'journals'),
        where('date', '<', fromDate)
    );
    const journalsBeforeSnap = await getDocs(allJournalsBeforeDateQuery);
    let beginningBalance = 0;
    journalsBeforeSnap.docs.forEach(journalDoc => {
        (journalDoc.data() as Journal).entries.forEach(entry => {
            if (entry.accountId === selectedAccountId) {
                beginningBalance += entry.debit - entry.credit;
            }
        });
    });

    const entries: LedgerEntry[] = [];
    let runningBalance = beginningBalance;

    const allJournalsForPeriod = journalsContainingAccount.map(doc => ({...doc.data(), date: doc.data().date.toDate()} as Journal)).sort((a,b) => a.date.getTime() - b.date.getTime());
    
    allJournalsForPeriod.forEach(journal => {
        journal.entries.forEach(entry => {
            if (entry.accountId === selectedAccountId) {
                 runningBalance += entry.debit - entry.credit;
                 entries.push({
                    date: journal.date,
                    ref: journal.refNumber || journal.id,
                    desc: journal.description,
                    debit: entry.debit,
                    credit: entry.credit,
                    balance: runningBalance,
                 })
            }
        })
    })

    const finalEntries = entries.reverse().slice((page-1) * entriesPerPage, page * entriesPerPage);

    setLedgerEntries(finalEntries);

    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    setFirstVisible(snapshot.docs[0]);
    setHasNextPage(finalEntries.length === entriesPerPage);

    setLoading(false);

  }, [selectedAccountId, dateRange, page, entriesPerPage, lastVisible, firstVisible]);


  useEffect(() => {
    setPage(1);
    setLastVisible(null);
    setFirstVisible(null);
    fetchLedgerEntries('initial');
  }, [selectedAccountId, dateRange, entriesPerPage]);

  const handleNextPage = () => {
    setPage(p => p + 1);
  };

  const handlePrevPage = () => {
    setPage(p => p - 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Buku Besar (General Ledger)
        </h1>
         <div className="flex items-center gap-2">
            <DateRangePicker onSelect={setDateRange} />
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Ekspor
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Detail Transaksi Akun</CardTitle>
          <CardDescription>
            Pilih akun untuk melihat seluruh riwayat transaksi yang memengaruhinya.
          </CardDescription>
          <div className="pt-4">
             <Select onValueChange={setSelectedAccountId}>
              <SelectTrigger id="account" className="max-w-md">
                <SelectValue placeholder="Pilih Akun..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Ref</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                           <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                    </TableRow>
                ) : ledgerEntries.length > 0 ? (
                  ledgerEntries.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(tx.date, 'dd MMM yyyy')}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.ref}</TableCell>
                      <TableCell>{tx.desc}</TableCell>
                      <TableCell className="text-right font-mono">
                        {tx.debit > 0 ? tx.debit.toLocaleString('id-ID') : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {tx.credit > 0 ? tx.credit.toLocaleString('id-ID') : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        {tx.balance.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                           {selectedAccountId ? "Tidak ada transaksi untuk akun ini pada periode yang dipilih." : "Silakan pilih akun untuk melihat riwayatnya."}
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between items-center gap-4">
             <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tampilkan</span>
                 <Select value={String(entriesPerPage)} onValueChange={(v) => setEntriesPerPage(Number(v))}>
                    <SelectTrigger className="w-[80px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[50, 100, 200, 300, 500].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <span className="text-sm text-muted-foreground">transaksi per halaman.</span>
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

declare module '@/components/ui/date-range-picker' {
    interface DateRangePickerProps {
        onSelect?: (date?: DateRange) => void;
    }
}
