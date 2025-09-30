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
import { Download, Loader2, Upload } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Account, Journal } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

type LedgerEntry = {
  id: string;
  date: Date;
  ref: string;
  desc: string;
  debit: number;
  credit: number;
  balance: number;
};

export default function BankReconciliationPage() {
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'coa'), where('type', '==', 'Kas & Bank'));
    const unsubAccounts = onSnapshot(q, (snapshot) => {
      setBankAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)).sort((a,b) => a.code.localeCompare(b.code)));
    });

    return () => unsubAccounts();
  }, []);

  useEffect(() => {
    if (!selectedAccountId || !dateRange?.from) return;

    setLoading(true);
    const from = Timestamp.fromDate(dateRange.from);
    const to = dateRange.to ? Timestamp.fromDate(new Date(dateRange.to.setHours(23, 59, 59, 999))) : from;

    const q = query(
      collection(db, "journals"), 
      where("date", ">=", from), 
      where("date", "<=", to)
    );

    const unsubJournals = onSnapshot(q, (snapshot) => {
      const allJournals = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(), date: doc.data().date.toDate()
      } as Journal));

      const relevantJournals = allJournals.filter(j => 
        j.entries.some(e => e.accountId === selectedAccountId)
      );

      setJournals(relevantJournals);
      setLoading(false);
    });

    return () => unsubJournals();
  }, [selectedAccountId, dateRange]);


  const ledgerEntries = useMemo(() => {
    if (!selectedAccountId) return [];
    let runningBalance = 0;
    const entries: LedgerEntry[] = [];

    journals.sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach(journal => {
        journal.entries.forEach(entry => {
          if (entry.accountId === selectedAccountId) {
            runningBalance += entry.debit - entry.credit;
            entries.push({
              id: `${journal.id}-${entry.accountId}`,
              date: journal.date,
              ref: journal.refNumber,
              desc: journal.description,
              debit: entry.debit,
              credit: entry.credit,
              balance: runningBalance,
            });
          }
        });
      });
    return entries.reverse();
  }, [journals, selectedAccountId]);
  
  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Rekonsiliasi Bank
        </h1>
         <div className="flex items-center gap-2">
            <DateRangePicker onSelect={setDateRange} />
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Ekspor
            </Button>
        </div>
      </div>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Proses Rekonsiliasi</CardTitle>
          <CardDescription>
            Pilih akun bank dan periode, lalu unggah laporan koran untuk memulai.
          </CardDescription>
          <div className="grid md:grid-cols-2 gap-4 pt-4">
             <Select onValueChange={setSelectedAccountId} disabled={loading}>
              <SelectTrigger id="account">
                <SelectValue placeholder="Pilih Akun Bank..." />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled>
                <Upload className="mr-2 h-4 w-4" /> Unggah Laporan Koran (Segera Hadir)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold mb-2">Transaksi di Pembukuan</h3>
                    <div className="border rounded-md max-h-[500px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                                ) : ledgerEntries.length === 0 ? (
                                     <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Pilih akun & tanggal.</TableCell></TableRow>
                                ) : ledgerEntries.map(entry => (
                                    <TableRow key={entry.id}>
                                        <TableCell><Checkbox /></TableCell>
                                        <TableCell>{format(entry.date, 'dd/MM')}</TableCell>
                                        <TableCell className="text-xs">{entry.desc}</TableCell>
                                        <TableCell className={`text-right font-mono text-xs ${entry.debit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {entry.debit > 0 ? `+${entry.debit.toLocaleString('id-ID')}` : `-${entry.credit.toLocaleString('id-ID')}`}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Transaksi di Laporan Koran</h3>
                    <div className="border rounded-md max-h-[500px] overflow-y-auto flex items-center justify-center text-center text-muted-foreground min-h-[200px]">
                        <p>Unggah laporan koran untuk melihat transaksi bank di sini.</p>
                    </div>
                </div>
           </div>
        </CardContent>
       </Card>
    </div>
  );
}

declare module '@/components/ui/date-range-picker' {
    interface DateRangePickerProps {
        onSelect?: (date?: DateRange) => void;
    }
}
