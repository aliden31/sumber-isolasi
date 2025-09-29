
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Account, Journal } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ReportRow = {
  accountName: string;
  amount: number;
};

type FinancialReport = {
  revenues: ReportRow[];
  cogs: ReportRow[];
  expenses: ReportRow[];
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalExpense: number;
  netIncome: number;
};

export default function FinancialReportsPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAccounts = onSnapshot(collection(db, 'coa'), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });

    return () => unsubAccounts();
  }, []);
  
  useEffect(() => {
    setLoading(true);
    const journalsCol = collection(db, 'journals');
    let q = query(journalsCol, orderBy('date', 'asc'));

    if (dateRange?.from) {
        const from = Timestamp.fromDate(dateRange.from);
        let to = dateRange.to ? Timestamp.fromDate(dateRange.to) : from;

        // Adjust to include the whole 'to' day
        const toDayEnd = new Date(dateRange.to || dateRange.from);
        toDayEnd.setHours(23, 59, 59, 999);
        to = Timestamp.fromDate(toDayEnd);
        
        q = query(q, where("date", ">=", from), where("date", "<=", to));
    }

    const unsubJournals = onSnapshot(q, (snapshot) => {
        setJournals(snapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, date: data.date.toDate() } as Journal;
        }));
        setLoading(false);
    }, (error) => {
        console.error("Error fetching journals:", error);
        setLoading(false);
    });

    return () => unsubJournals();
  }, [dateRange]);


  const reportData: FinancialReport = useMemo(() => {
    const revenueAccountTypes = ['Pendapatan', 'Pendapatan Lainnya'];
    const cogsAccountTypes = ['Beban Pokok Penjualan'];
    const expenseAccountTypes = ['Beban Operasional', 'Beban Lainnya'];

    const accountBalances: { [key: string]: number } = {};

    journals.forEach(journal => {
      journal.entries.forEach(entry => {
        if (!accountBalances[entry.accountId]) {
          accountBalances[entry.accountId] = 0;
        }
        const account = accounts.find(a => a.id === entry.accountId);
        if (account && [...revenueAccountTypes, ...cogsAccountTypes, ...expenseAccountTypes].includes(account.type)) {
           // For income & revenue, credits increase the balance (positive value)
           // For expenses & COGS, debits increase the balance (positive value)
           const balanceEffect = (revenueAccountTypes.includes(account.type)) 
                ? entry.credit - entry.debit
                : entry.debit - entry.credit;

            accountBalances[entry.accountId] += balanceEffect;
        }
      });
    });

    const report: FinancialReport = {
      revenues: [],
      cogs: [],
      expenses: [],
      totalRevenue: 0,
      totalCogs: 0,
      grossProfit: 0,
      totalExpense: 0,
      netIncome: 0,
    };

    Object.entries(accountBalances).forEach(([accountId, balance]) => {
      const account = accounts.find(a => a.id === accountId);
      if (account && balance !== 0) {
        const row = { accountName: account.name, amount: balance };
        if (revenueAccountTypes.includes(account.type)) {
          report.revenues.push(row);
          report.totalRevenue += balance;
        } else if (cogsAccountTypes.includes(account.type)) {
          report.cogs.push(row);
          report.totalCogs += balance;
        } else if (expenseAccountTypes.includes(account.type)) {
          report.expenses.push(row);
          report.totalExpense += balance;
        }
      }
    });
    
    report.grossProfit = report.totalRevenue - report.totalCogs;
    report.netIncome = report.grossProfit - report.totalExpense;

    return report;
  }, [journals, accounts]);

  const renderSection = (title: string, rows: ReportRow[], total: number, isTotal=true, className?: string, titleClassName?: string) => (
    <>
      <TableRow className={titleClassName}>
        <TableHead colSpan={2} className="font-bold">{title}</TableHead>
      </TableRow>
      {rows.map((row, index) => (
        <TableRow key={index}>
          <TableCell className="pl-8">{row.accountName}</TableCell>
          <TableCell className="text-right font-mono">{row.amount.toLocaleString('id-ID')}</TableCell>
        </TableRow>
      ))}
      {isTotal && (
        <TableRow className={cn("font-bold", className)}>
            <TableCell className="pl-8">Total {title}</TableCell>
            <TableCell className="text-right font-mono">{total.toLocaleString('id-ID')}</TableCell>
        </TableRow>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Laba Rugi</h1>
        <DateRangePicker onSelect={setDateRange} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Laporan Laba Rugi</CardTitle>
          <CardDescription>
            Periode: {dateRange?.from ? format(dateRange.from, 'd MMM yyyy') : '...'} - {dateRange?.to ? format(dateRange.to, 'd MMM yyyy') : '...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Jumlah (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderSection("Pendapatan", reportData.revenues, reportData.totalRevenue)}
                
                {renderSection("Beban Pokok Penjualan", reportData.cogs, reportData.totalCogs)}

                <TableRow className="font-bold bg-muted/50">
                    <TableCell>Laba Kotor</TableCell>
                    <TableCell className="text-right font-mono">{reportData.grossProfit.toLocaleString('id-ID')}</TableCell>
                </TableRow>

                {renderSection("Beban Operasional", reportData.expenses, reportData.totalExpense)}
              </TableBody>
              <TableFooter>
                <TableRow className="text-lg font-bold bg-secondary/50 hover:bg-secondary">
                  <TableCell>Laba Bersih</TableCell>
                  <TableCell className="text-right font-mono">{reportData.netIncome.toLocaleString('id-ID')}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
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
