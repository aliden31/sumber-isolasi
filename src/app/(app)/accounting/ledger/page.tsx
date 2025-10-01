
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
import { collection, onSnapshot, query, orderBy, where, Timestamp, getDocs, limit, startAfter, DocumentData } from 'firebase/firestore';
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

const LEDGER_PAGE_SIZE = 100;

export default function GeneralLedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);
  
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [pageHistory, setPageHistory] = useState<(DocumentData | null)[] >([null]);
  const [currentPage, setCurrentPage] = useState(1);


  useEffect(() => {
    const unsubAccounts = onSnapshot(collection(db, 'coa'), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)).sort((a,b) => a.code.localeCompare(b.code)));
      setLoading(false);
    });

    return () => unsubAccounts();
  }, []);
  
  const fetchLedgerEntries = useCallback(async (page: number, startAfterDoc: DocumentData | null) => {
    if (!selectedAccountId) return;
    
    setLoading(true);

    let runningBalance = 0; // This will need to be calculated based on previous data
    const entries: LedgerEntry[] = [];
    
    // --- Phase 1: Calculate beginning balance ---
    let beginningBalance = 0;
    const allJournalsBeforeDateQuery = query(
        collection(db, 'journals'),
        where('date', '<', dateRange?.from ? Timestamp.fromDate(dateRange.from) : Timestamp.now())
    );
    const journalsBeforeSnap = await getDocs(allJournalsBeforeDateQuery);
    journalsBeforeSnap.docs.forEach(journalDoc => {
        const journal = journalDoc.data() as Journal;
        journal.entries.forEach(entry => {
            if (entry.accountId === selectedAccountId) {
                beginningBalance += entry.debit - entry.credit;
            }
        });
    });
    
    runningBalance = beginningBalance;
    
    // --- Phase 2: Fetch all relevant entries within the date range ---
    let allJournalsQuery = query(
        collection(db, 'journals'), 
        orderBy("date", "asc")
    );

    if (dateRange?.from) {
        allJournalsQuery = query(allJournalsQuery, where("date", ">=", Timestamp.fromDate(dateRange.from)));
    }
    if (dateRange?.to) {
        const toDayEnd = new Date(dateRange.to);
        toDayEnd.setHours(23, 59, 59, 999);
        allJournalsQuery = query(allJournalsQuery, where("date", "<=", Timestamp.fromDate(toDayEnd)));
    }

    const allJournalsSnapshot = await getDocs(allJournalsQuery);
    const allRelevantEntries: any[] = [];
    
    allJournalsSnapshot.docs.forEach(journalDoc => {
        const journal = journalDoc.data() as Journal;
        journal.entries.forEach(entry => {
            if (entry.accountId === selectedAccountId) {
                allRelevantEntries.push({
                    journalDate: journal.date.toDate(),
                    journalRef: journal.refNumber || journal.id,
                    journalDesc: journal.description,
                    ...entry
                });
            }
        });
    });

    // --- Phase 3: Paginate and calculate running balance for the current page ---
    const sortedEntriesForDisplay = allRelevantEntries.sort((a,b) => b.journalDate.getTime() - a.journalDate.getTime());
    const startIndex = (page - 1) * LEDGER_PAGE_SIZE;
    const endIndex = page * LEDGER_PAGE_SIZE;
    const pagedEntries = sortedEntriesForDisplay.slice(startIndex, endIndex);

    // To calculate the balance correctly up to the first item on the current page,
    // we need to process all entries that came before it.
    const lastDateOnPage = pagedEntries.length > 0 ? pagedEntries[pagedEntries.length - 1].journalDate : new Date();
    
    const entriesForBalanceCalc = allRelevantEntries
        .filter(entry => entry.journalDate < lastDateOnPage)
        .sort((a, b) => a.journalDate.getTime() - b.journalDate.getTime());

    let balanceUpToPage = beginningBalance;
    entriesForBalanceCalc.forEach(entry => {
        balanceUpToPage += entry.debit - entry.credit;
    });

    // Now, calculate balance for the paged entries
    const finalPageEntries: LedgerEntry[] = [];
    pagedEntries.reverse().forEach(entry => {
        balanceUpToPage += entry.debit - entry.credit;
        finalPageEntries.push({
            date: entry.journalDate,
            ref: entry.journalRef,
            desc: entry.journalDesc,
            debit: entry.debit,
            credit: entry.credit,
            balance: balanceUpToPage
        });
    });

    setLedgerEntries(finalPageEntries.reverse());
    setLoading(false);

  }, [selectedAccountId, dateRange]);


  useEffect(() => {
    setCurrentPage(1);
    setPageHistory([null]);
    if (selectedAccountId) {
        fetchLedgerEntries(1, null);
    } else {
        setLedgerEntries([]);
    }
  }, [selectedAccountId, dateRange, fetchLedgerEntries]);

  const handleNextPage = () => {
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    fetchLedgerEntries(newPage, lastVisible);
  };

  const handlePrevPage = () => {
    const newPage = currentPage - 1;
    if (newPage > 0) {
      setCurrentPage(newPage);
      fetchLedgerEntries(newPage, null); // Simplified, not using pageHistory for now
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div />
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
        <CardFooter className="flex justify-between">
            <span className="text-sm text-muted-foreground">Menampilkan hingga {LEDGER_PAGE_SIZE} transaksi per halaman.</span>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevPage} disabled={currentPage === 1 || loading}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Sebelumnya
                </Button>
                <Button variant="outline" onClick={handleNextPage} disabled={loading || ledgerEntries.length < LEDGER_PAGE_SIZE}>
                    Berikutnya <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </CardFooter>
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
