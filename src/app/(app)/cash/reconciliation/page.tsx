
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
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
import { Download, Loader2, Upload, AlertCircle } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Account, Journal } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type LedgerEntry = {
  id: string;
  date: Date;
  ref: string;
  desc: string;
  amount: number; // Positive for debit, negative for credit
};

type BankStatementItem = {
    id: string;
    date: Date;
    description: string;
    amount: number;
}

// Mock data for bank statement
const MOCK_BANK_STATEMENT: BankStatementItem[] = [
    { id: 'bank-1', date: new Date(), description: 'Setoran Tunai', amount: 500000 },
    { id: 'bank-2', date: new Date(), description: 'Biaya Admin', amount: -6500 },
    { id: 'bank-3', date: new Date(), description: 'Transfer ke Supplier ABC', amount: -250000 },
]

export default function BankReconciliationPage() {
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  
  const [clearedLedgerIds, setClearedLedgerIds] = useState<Set<string>>(new Set());
  const [clearedBankIds, setClearedBankIds] = useState<Set<string>>(new Set());

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


  const { ledgerEntries, closingBalance } = useMemo(() => {
    if (!selectedAccountId) return { ledgerEntries: [], closingBalance: 0 };
    let runningBalance = 0;
    const entries: LedgerEntry[] = [];

    journals.sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach(journal => {
        journal.entries.forEach(entry => {
          if (entry.accountId === selectedAccountId) {
            const amount = entry.debit - entry.credit;
            runningBalance += amount;
            entries.push({
              id: `${journal.id}-${entry.accountId}-${Math.random()}`,
              date: journal.date,
              ref: journal.refNumber,
              desc: journal.description,
              amount: amount,
            });
          }
        });
      });
    return { ledgerEntries: entries, closingBalance: runningBalance };
  }, [journals, selectedAccountId]);
  
  const handleToggleCleared = (id: string, type: 'ledger' | 'bank') => {
      const updater = (prev: Set<string>) => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
              newSet.delete(id);
          } else {
              newSet.add(id);
          }
          return newSet;
      }
      if (type === 'ledger') setClearedLedgerIds(updater);
      if (type === 'bank') setClearedBankIds(updater);
  }

  const { unclearedLedger, unclearedBank, difference } = useMemo(() => {
      const clearedLedgerTotal = ledgerEntries
        .filter(e => clearedLedgerIds.has(e.id))
        .reduce((sum, e) => sum + e.amount, 0);

      const clearedBankTotal = MOCK_BANK_STATEMENT
        .filter(e => clearedBankIds.has(e.id))
        .reduce((sum, e) => sum + e.amount, 0);

      const unclearedLedger = closingBalance - clearedLedgerTotal;
      const unclearedBank = 0 - clearedBankTotal; // Assuming starting bank balance 0 for mock

      return {
          unclearedLedger,
          unclearedBank,
          difference: unclearedLedger - unclearedBank,
      }
  }, [clearedLedgerIds, clearedBankIds, ledgerEntries, closingBalance]);
  
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
            Pilih akun bank dan periode, lalu centang transaksi yang cocok antara catatan Anda dan laporan koran.
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
                    <h3 className="font-semibold mb-2">Transaksi di Pembukuan (Buku Besar)</h3>
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
                                    <TableRow key={entry.id} data-state={clearedLedgerIds.has(entry.id) && 'selected'}>
                                        <TableCell><Checkbox checked={clearedLedgerIds.has(entry.id)} onCheckedChange={() => handleToggleCleared(entry.id, 'ledger')} /></TableCell>
                                        <TableCell>{format(entry.date, 'dd/MM')}</TableCell>
                                        <TableCell className="text-xs">{entry.desc}</TableCell>
                                        <TableCell className={`text-right font-mono text-xs ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {entry.amount.toLocaleString('id-ID')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Transaksi di Laporan Koran</h3>
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
                                 {MOCK_BANK_STATEMENT.length === 0 ? (
                                     <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Unggah laporan koran.</TableCell></TableRow>
                                ) : MOCK_BANK_STATEMENT.map(entry => (
                                    <TableRow key={entry.id} data-state={clearedBankIds.has(entry.id) && 'selected'}>
                                        <TableCell><Checkbox checked={clearedBankIds.has(entry.id)} onCheckedChange={() => handleToggleCleared(entry.id, 'bank')} /></TableCell>
                                        <TableCell>{format(entry.date, 'dd/MM')}</TableCell>
                                        <TableCell className="text-xs">{entry.description}</TableCell>
                                        <TableCell className={`text-right font-mono text-xs ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {entry.amount.toLocaleString('id-ID')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
           </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
            <h3 className="font-semibold">Ringkasan Rekonsiliasi</h3>
            <div className="w-full grid md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Saldo Akhir Pembukuan</p>
                    <p className="font-bold text-lg">Rp {closingBalance.toLocaleString('id-ID')}</p>
                </Card>
                 <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Item Belum Clear</p>
                     <p className="font-bold text-lg">Rp {(unclearedLedger - unclearedBank).toLocaleString('id-ID')}</p>
                </Card>
                 <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Saldo Disesuaikan</p>
                    <p className="font-bold text-lg">Rp {(closingBalance - (unclearedLedger - unclearedBank)).toLocaleString('id-ID')}</p>
                </Card>
            </div>
            {difference !== 0 && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Tidak Seimbang</AlertTitle>
                    <AlertDescription>
                        Masih ada selisih sebesar Rp {difference.toLocaleString('id-ID')} antara pembukuan dan laporan koran. Mohon periksa kembali.
                    </AlertDescription>
                </Alert>
            )}
            <Button disabled={difference !== 0}>Selesaikan Rekonsiliasi (Segera Hadir)</Button>
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

    