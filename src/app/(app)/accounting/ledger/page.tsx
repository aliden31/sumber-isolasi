
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Download, Loader2 } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
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
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAccounts = onSnapshot(collection(db, 'coa'), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)).sort((a,b) => a.code.localeCompare(b.code)));
    });

    const journalsCol = collection(db, "journals");
    const q = query(journalsCol, orderBy("date", "desc"));
    const unsubJournals = onSnapshot(q, (snapshot) => {
      setJournals(snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
        } as Journal;
      }));
      setLoading(false);
    });

    return () => {
      unsubAccounts();
      unsubJournals();
    };
  }, []);

  const ledgerEntries = useMemo(() => {
    if (!selectedAccountId) return [];

    let runningBalance = 0;
    const entries: LedgerEntry[] = [];

    const filteredJournals = journals
      .filter(j => {
        // Filter by date range if it exists
        if (dateRange?.from) {
          const from = dateRange.from;
          const to = dateRange.to || from; // if no 'to', use 'from'
           // Adjust to include the whole 'to' day
            const toDayEnd = new Date(to);
            toDayEnd.setHours(23, 59, 59, 999);
          return j.date >= from && j.date <= toDayEnd;
        }
        return true; // No date filter
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort ascending for balance calculation

    for (const journal of filteredJournals) {
      for (const entry of journal.entries) {
        if (entry.accountId === selectedAccountId) {
          runningBalance += entry.debit - entry.credit;
          entries.push({
            date: journal.date,
            ref: journal.refNumber || journal.id,
            desc: journal.description,
            debit: entry.debit,
            credit: entry.credit,
            balance: runningBalance,
          });
        }
      }
    }

    return entries.reverse(); // Show most recent first
  }, [selectedAccountId, journals, dateRange]);


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
      </Card>
    </div>
  );
}

// Add this to date-range-picker component to accept onSelect props
declare module '@/components/ui/date-range-picker' {
    interface DateRangePickerProps {
        onSelect?: (date?: DateRange) => void;
    }
}
