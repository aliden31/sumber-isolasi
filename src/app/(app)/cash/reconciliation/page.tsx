
'use client';

import React, { useState, useEffect, useMemo, useRef, useTransition } from 'react';
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
import { Download, Loader2, Upload, AlertCircle, Plus, FilePlus } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { collection, onSnapshot, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Account, Journal } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { format, parse } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { createAdjustmentJournal } from './actions';


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

export default function BankReconciliationPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  
  const [clearedLedgerIds, setClearedLedgerIds] = useState<Set<string>>(new Set());
  const [clearedBankIds, setClearedBankIds] = useState<Set<string>>(new Set());

  const [bankStatementItems, setBankStatementItems] = useState<BankStatementItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();


  useEffect(() => {
    const q = query(collection(db, 'coa'), orderBy('name'));
    const unsubAccounts = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)).sort((a,b) => a.code.localeCompare(b.code)));
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

  const { unclearedLedgerTotal, unclearedBankTotal, difference, allBankItemsAccountedFor } = useMemo(() => {
      const clearedLedgerTotal = ledgerEntries
        .filter(e => clearedLedgerIds.has(e.id))
        .reduce((sum, e) => sum + e.amount, 0);

      const clearedBankTotal = bankStatementItems
        .filter(e => clearedBankIds.has(e.id))
        .reduce((sum, e) => sum + e.amount, 0);
      
      const allBankItemsAccountedFor = bankStatementItems.every(item => clearedBankIds.has(item.id));

      return {
          unclearedLedgerTotal: closingBalance - clearedLedgerTotal,
          unclearedBankTotal: bankStatementItems.reduce((sum, item) => sum + item.amount, 0) - clearedBankTotal,
          difference: (closingBalance - clearedLedgerTotal) - (bankStatementItems.reduce((sum, item) => sum + item.amount, 0) - clearedBankTotal),
          allBankItemsAccountedFor,
      }
  }, [clearedLedgerIds, clearedBankIds, ledgerEntries, closingBalance, bankStatementItems]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            const parsedData = json.map((row: any, index: number) => {
                const dateValue = row.Tanggal || row.Date;
                 if (!dateValue) {
                    console.warn(`Skipping row ${index + 2} due to missing date.`);
                    return null;
                }

                let date;
                if (typeof dateValue === 'number') {
                    date = XLSX.SSF.parse_date_code(dateValue);
                    date = new Date(date.y, date.m - 1, date.d);
                } else {
                    date = parse(String(dateValue), 'dd/MM/yyyy', new Date());
                    if (isNaN(date.getTime())) {
                       date = parse(String(dateValue), 'MM/dd/yyyy', new Date());
                    }
                    if (isNaN(date.getTime())) {
                       date = new Date(String(dateValue));
                    }
                }
                
                const description = row.Keterangan || row.Deskripsi || row.Description;
                const amountValue = row.Mutasi || row.Amount || row.Jumlah || row.Credit || row.Debit;
                
                let amount = 0;
                if (amountValue) {
                   amount = parseFloat(String(amountValue).replace(/[^0-9\\.-]+/g, ""));
                } else if (row.Debit) {
                    amount = -parseFloat(String(row.Debit).replace(/[^0-9\\.-]+/g, ""));
                } else if (row.Credit) {
                     amount = parseFloat(String(row.Credit).replace(/[^0-9\\.-]+/g, ""));
                }

                
                if (isNaN(date.getTime()) || !description || isNaN(amount)) {
                    console.warn(`Skipping invalid row ${index + 2}:`, row);
                    return null;
                }

                return {
                    id: `bank-${index}`,
                    date: date,
                    description: description,
                    amount: amount,
                };
            }).filter(Boolean) as BankStatementItem[];
            
            setBankStatementItems(parsedData.sort((a,b) => b.date.getTime() - a.date.getTime()));
            toast({ title: 'Berhasil', description: `${parsedData.length} transaksi bank berhasil diimpor.` });

        } catch (err) {
            console.error(err);
            toast({ title: 'Gagal Memproses File', description: 'Pastikan file Excel Anda memiliki format yang benar.', variant: 'destructive' });
        }
    };
    reader.onerror = (err) => {
        console.error(err);
        toast({ title: 'Gagal Membaca File', description: 'Terjadi kesalahan saat membaca file.', variant: 'destructive' });
    }
    reader.readAsArrayBuffer(file);
  };
  
  const bankAccounts = accounts.filter(a => a.type === 'Kas & Bank');

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
            Pilih akun bank dan periode, lalu unggah laporan koran (format .xlsx) dan centang transaksi yang cocok.
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
            <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Unggah Laporan Koran (.xlsx)
            </Button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
            />
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
                                    <TableHead className="w-10 text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                 {bankStatementItems.length === 0 ? (
                                     <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Unggah laporan koran.</TableCell></TableRow>
                                ) : bankStatementItems.map(entry => (
                                    <TableRow key={entry.id} data-state={clearedBankIds.has(entry.id) && 'selected'}>
                                        <TableCell><Checkbox checked={clearedBankIds.has(entry.id)} onCheckedChange={() => handleToggleCleared(entry.id, 'bank')} /></TableCell>
                                        <TableCell>{format(entry.date, 'dd/MM')}</TableCell>
                                        <TableCell className="text-xs">{entry.description}</TableCell>
                                        <TableCell className={`text-right font-mono text-xs ${entry.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {entry.amount.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!clearedBankIds.has(entry.id) && (
                                                <AdjustmentJournalDialog
                                                    triggerButton={<Button size="icon" variant="ghost" className="h-6 w-6"><Plus className="h-4 w-4"/></Button>}
                                                    bankItem={entry}
                                                    reconciledAccountId={selectedAccountId}
                                                    allAccounts={accounts}
                                                    onJournalCreated={() => setClearedBankIds(prev => new Set(prev.add(entry.id)))}
                                                />
                                            )}
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
                    <p className="text-sm text-muted-foreground">Selisih Belum Clear</p>
                     <p className="font-bold text-lg">Rp {difference.toLocaleString('id-ID')}</p>
                </Card>
                 <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Saldo Disesuaikan</p>
                    <p className="font-bold text-lg">Rp {(closingBalance - difference).toLocaleString('id-ID')}</p>
                </Card>
            </div>
            {difference !== 0 && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Tidak Seimbang</AlertTitle>
                    <AlertDescription>
                        Masih ada selisih sebesar Rp {difference.toLocaleString('id-ID')} antara pembukuan dan laporan koran. Mohon periksa kembali transaksi yang dicentang atau buat jurnal penyesuaian.
                    </AlertDescription>
                </Alert>
            )}
            <Button disabled={difference !== 0 || !allBankItemsAccountedFor}>Selesaikan Rekonsiliasi</Button>
        </CardFooter>
       </Card>
    </div>
  );
}


interface AdjustmentJournalDialogProps {
  triggerButton: React.ReactNode;
  bankItem: BankStatementItem;
  reconciledAccountId: string | null;
  allAccounts: Account[];
  onJournalCreated: () => void;
}

function AdjustmentJournalDialog({ triggerButton, bankItem, reconciledAccountId, allAccounts, onJournalCreated }: AdjustmentJournalDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [contraAccountId, setContraAccountId] = useState('');

    const handleSubmit = () => {
        if (!reconciledAccountId || !contraAccountId) {
            toast({ title: 'Data tidak lengkap', variant: 'destructive'});
            return;
        }
        startTransition(async () => {
            const result = await createAdjustmentJournal(
                bankItem.date,
                bankItem.description,
                bankItem.amount,
                reconciledAccountId,
                contraAccountId
            );
            if (result.error) {
                toast({ title: 'Gagal Membuat Jurnal', description: result.error, variant: 'destructive'});
            } else {
                toast({ title: 'Jurnal Penyesuaian Dibuat'});
                onJournalCreated();
                setOpen(false);
            }
        });
    }

    const nonCashAccounts = allAccounts.filter(a => a.type !== 'Kas & Bank');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Buat Jurnal Penyesuaian</DialogTitle>
                    <DialogDescription>Buat entri jurnal untuk transaksi bank yang belum tercatat di pembukuan.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex justify-between items-center bg-muted p-2 rounded-md">
                        <span className="text-sm">{bankItem.description}</span>
                        <span className="text-sm font-mono font-bold">Rp {bankItem.amount.toLocaleString('id-ID')}</span>
                    </div>
                     <div className="space-y-2">
                        <Label>Akun Lawan (Kontra)</Label>
                        <Select value={contraAccountId} onValueChange={setContraAccountId}>
                            <SelectTrigger><SelectValue placeholder="Pilih akun..."/></SelectTrigger>
                            <SelectContent>
                                {nonCashAccounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Pilih akun yang sesuai, misal: Beban Admin Bank, Pendapatan Bunga.</p>
                     </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Batal</Button>
                    <Button onClick={handleSubmit} disabled={!contraAccountId || isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Buat Jurnal
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

declare module '@/components/ui/date-range-picker' {
    interface DateRangePickerProps {
        onSelect?: (date?: DateRange) => void;
    }
}
