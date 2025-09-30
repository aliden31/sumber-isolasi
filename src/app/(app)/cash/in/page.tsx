
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Account, NewJournal, JournalEntry } from '@/lib/types';
import { addJournalEntry } from '@/app/(app)/accounting/journal/actions';

export default function CashInPage() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [sourceAccounts, setSourceAccounts] = useState<Account[]>([]);
  const [destinationAccounts, setDestinationAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coa'), (snapshot) => {
      const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)).sort((a,b) => a.code.localeCompare(b.code));
      setAllAccounts(accounts);
      // Source accounts are typically non-cash accounts like Equity, Revenue, or Liabilities
      setSourceAccounts(accounts.filter(a => !['Kas & Bank', 'Aset Tetap', 'Beban Pokok Penjualan', 'Beban Operasional'].includes(a.type)));
      // Destination accounts for cash in are always cash/bank accounts
      setDestinationAccounts(accounts.filter(a => a.type === 'Kas & Bank'));
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setDate(new Date());
    setDescription('');
    setAmount(0);
    setFromAccountId('');
    setToAccountId('');
  }

  const handleSave = () => {
    if (!fromAccountId || !toAccountId || amount <= 0 || !date || !description) {
        toast({ title: "Data tidak lengkap", description: "Mohon isi semua field yang diperlukan.", variant: "destructive" });
        return;
    }
    
    const fromAccount = allAccounts.find(a => a.id === fromAccountId);
    const toAccount = allAccounts.find(a => a.id === toAccountId);

    if (!fromAccount || !toAccount) {
        toast({ title: "Akun tidak valid", variant: "destructive" });
        return;
    }

    // Debit (toAccount) and Credit (fromAccount)
    const journalEntries: JournalEntry[] = [
      { accountId: toAccountId, accountName: toAccount.name, debit: amount, credit: 0 },
      { accountId: fromAccountId, accountName: fromAccount.name, debit: 0, credit: amount },
    ];

    const newJournal: NewJournal = {
      date,
      description: `Kas Masuk: ${description}`,
      refNumber: '',
      entries: journalEntries,
      total: amount,
    };
    
    startTransition(async () => {
      const result = await addJournalEntry(newJournal);
      if (result.error) {
        toast({ title: "Gagal menyimpan transaksi", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Transaksi kas masuk berhasil disimpan!" });
        resetForm();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Kas Masuk</h1>
      <Card className="max-w-3xl mx-auto w-full">
        <CardHeader>
          <CardTitle className="font-headline">Catat Pemasukan Kas</CardTitle>
          <CardDescription>
            Gunakan form ini untuk mencatat semua pemasukan kas di luar dari transaksi penjualan utama (misalnya, setoran modal, pendapatan bunga).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="cash-in-to">Masuk Ke Akun Kas/Bank (Debit)</Label>
            <Select value={toAccountId} onValueChange={setToAccountId} disabled={isPending}>
              <SelectTrigger id="cash-in-to">
                <SelectValue placeholder="Pilih akun kas/bank tujuan" />
              </SelectTrigger>
              <SelectContent>
                 {destinationAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label htmlFor="cash-in-from">Dari Akun Sumber (Kredit)</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId} disabled={isPending}>
              <SelectTrigger id="cash-in-from">
                <SelectValue placeholder="Pilih akun asal dana (misal: modal, pendapatan lain)" />
              </SelectTrigger>
              <SelectContent>
                {sourceAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah</Label>
              <Input id="amount" type="number" placeholder="Masukkan jumlah pemasukan" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} disabled={isPending} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="transaction-date">Tanggal Transaksi</Label>
               <DatePicker date={date} setDate={setDate} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" placeholder="Contoh: Setoran modal awal dari pemilik" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending || amount <= 0 || !toAccountId || !fromAccountId || !description}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
            Simpan Transaksi
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
