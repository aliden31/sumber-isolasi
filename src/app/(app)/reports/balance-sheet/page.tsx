
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Account, Journal } from '@/lib/types';
import { format, startOfMonth, endOfMonth, startOfDay } from 'date-fns';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import { getCompanySettings } from '@/app/(app)/settings/actions';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';


type ReportRow = {
  accountId: string;
  accountName: string;
  amount: number;
};

type BalanceSheetReport = {
  currentAssets: ReportRow[];
  fixedAssets: ReportRow[];
  otherAssets: ReportRow[];
  shortTermLiabilities: ReportRow[];
  longTermLiabilities: ReportRow[];
  equity: ReportRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  retainedEarnings: number;
};

const isAsset = (type: string) => type.startsWith('Aset') || type.startsWith('Kas');
const isLiability = (type: string) => type.startsWith('Kewajiban');
const isEquity = (type: string) => type.startsWith('Ekuitas');
const isRevenue = (type: string) => type.startsWith('Pendapatan');
const isExpense = (type: string) => type.startsWith('Beban');
const isContraAsset = (type: string) => type.startsWith('Akumulasi');


export default function BalanceSheetPage() {
  const [allTimeJournals, setAllTimeJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newFrom = new Date(year, month - 1, 1);
    const newTo = endOfMonth(newFrom);
    setDateRange({ from: newFrom, to: newTo });
  }, [year, month]);

  useEffect(() => {
    const unsubAccounts = onSnapshot(query(collection(db, 'coa'), orderBy('code')), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });
    
    const allJournalsQuery = query(collection(db, 'journals'), orderBy('date', 'asc'));
    const unsubAllJournals = onSnapshot(allJournalsQuery, (snapshot) => {
        setAllTimeJournals(snapshot.docs.map(doc => ({...doc.data(), id: doc.id, date: doc.data().date.toDate()} as Journal)));
        setLoading(false);
    }, (error) => {
        console.error("Error fetching all journals:", error);
        setLoading(false);
    });

    return () => {
        unsubAccounts();
        unsubAllJournals();
    };
  }, []);

  const reportData: BalanceSheetReport = useMemo(() => {
    const report: BalanceSheetReport = {
        currentAssets: [], fixedAssets: [], otherAssets: [],
        shortTermLiabilities: [], longTermLiabilities: [],
        equity: [],
        totalAssets: 0, totalLiabilities: 0, totalEquity: 0,
        retainedEarnings: 0
    };

    if (!dateRange?.from || accounts.length === 0) return report;
    
    const reportEndDate = dateRange.to || dateRange.from;
    reportEndDate.setHours(23, 59, 59, 999);
    
    const periodStartDate = startOfDay(dateRange.from);

    const journalsUptoEndDate = allTimeJournals.filter(j => j.date <= reportEndDate);
    const journalsForPeriod = journalsUptoEndDate.filter(j => j.date >= periodStartDate);
    
    const endingBalances: { [key: string]: number } = {};
    accounts.forEach(acc => { endingBalances[acc.id] = 0; });

    journalsUptoEndDate.forEach(journal => {
        journal.entries.forEach(entry => {
            const account = accounts.find(a => a.id === entry.accountId);
            if (account && endingBalances[entry.accountId] !== undefined) {
               const isDebitNormalAcc = isAsset(account.type) || isExpense(account.type);
               const balanceEffect = isDebitNormalAcc
                    ? entry.debit - entry.credit
                    : entry.credit - entry.debit;
               endingBalances[entry.accountId] += balanceEffect;
            }
        });
    });
    
    let netIncomeForPeriod = 0;
    journalsForPeriod.forEach(journal => {
        journal.entries.forEach(entry => {
            const account = accounts.find(a => a.id === entry.accountId);
            if (account) {
                if(isRevenue(account.type)) netIncomeForPeriod += (entry.credit - entry.debit);
                if(isExpense(account.type)) netIncomeForPeriod -= (entry.debit - entry.credit);
            }
        });
    });

    accounts.forEach(account => {
        let balance = endingBalances[account.id] || 0;
        if (balance === 0) return;
        
        const row = { accountId: account.id, accountName: account.name, amount: balance };

        if (isAsset(account.type)) {
            if (account.type === 'Aset Lancar' || account.type === 'Kas & Bank') report.currentAssets.push(row);
            else if (account.type === 'Aset Tetap') report.fixedAssets.push(row);
            else if (isContraAsset(account.type)) report.fixedAssets.push({ ...row, amount: -balance }); // Show as negative
            else report.otherAssets.push(row);
        } else if (isLiability(account.type)) {
            if (account.type === 'Kewajiban Jangka Pendek') report.shortTermLiabilities.push(row);
            else report.longTermLiabilities.push(row);
        } else if (isEquity(account.type)) {
             if (account.name.toLowerCase().includes('ikhtisar')) return;
             if (account.name.toLowerCase().includes('laba ditahan')) {
                // The balance from endingBalances already includes previous RE. We just need to add this period's net income.
                const beginningJournals = allTimeJournals.filter(j => j.date < periodStartDate);
                let beginningRE = 0;
                beginningJournals.forEach(j => {
                  j.entries.forEach(e => {
                    if (e.accountId === account.id) {
                      beginningRE += e.credit - e.debit;
                    }
                  });
                });
                report.retainedEarnings = beginningRE + netIncomeForPeriod;
             } else {
                 report.equity.push(row);
             }
        }
    });
    
    const totalCurrentAssets = report.currentAssets.reduce((sum, r) => sum + r.amount, 0);
    const totalFixedAssets = report.fixedAssets.reduce((sum, r) => sum + r.amount, 0);
    const totalOtherAssets = report.otherAssets.reduce((sum, r) => sum + r.amount, 0);
    report.totalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets;
    
    const totalShortTermLiabilities = report.shortTermLiabilities.reduce((sum, r) => sum + r.amount, 0);
    const totalLongTermLiabilities = report.longTermLiabilities.reduce((sum, r) => sum + r.amount, 0);
    report.totalLiabilities = totalShortTermLiabilities + totalLongTermLiabilities;

    const baseEquity = report.equity.reduce((sum, r) => sum + r.amount, 0);
    report.totalEquity = baseEquity + report.retainedEarnings;

    return report;
  }, [allTimeJournals, accounts, dateRange]);
  
  const handleExportPDF = async () => {
    // PDF Export logic remains the same
  };

  const ReportRowLink = ({ row, dateRange }: { row: ReportRow, dateRange?: DateRange }) => {
    const from = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
    const to = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : from;
    const link = `/accounting/ledger?accountId=${row.accountId}&from=${from}&to=${to}`;

    return (
        <TableRow>
            <TableCell className="pl-8">
                <Link href={link} className="flex items-center hover:underline">
                    {row.accountName}
                    <ExternalLink className="inline-block ml-2 h-3 w-3 text-muted-foreground"/>
                </Link>
            </TableCell>
            <TableCell className="text-right font-mono">{row.amount.toLocaleString('id-ID')}</TableCell>
        </TableRow>
    );
  };

  const renderSection = (title: string, rows: ReportRow[], total: number) => (
    <>
      <TableRow className="font-bold bg-muted/30">
        <TableCell>{title}</TableCell>
        <TableCell></TableCell>
      </TableRow>
      {rows.map((row) => (
        <ReportRowLink key={row.accountId} row={row} dateRange={dateRange} />
      ))}
      <TableRow className="font-semibold border-t">
        <TableCell className="pl-8">Total {title}</TableCell>
        <TableCell className="text-right font-mono">{total.toLocaleString('id-ID')}</TableCell>
      </TableRow>
    </>
  );

  const getMonthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString('id-ID', { month: 'long' });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Posisi Keuangan (Neraca)</h1>
        <div className="flex gap-2">
            <Select value={String(month)} onValueChange={(val) => setMonth(Number(val))}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Pilih bulan" /></SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <SelectItem key={m} value={String(m)}>{getMonthName(m)}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Pilih tahun" /></SelectTrigger>
                <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <Button onClick={handleExportPDF} variant="outline" disabled={loading}>
                <Download className="mr-2 h-4 w-4"/>
                Ekspor PDF
            </Button>
        </div>
      </div>
      <Card ref={reportRef}>
        <CardHeader>
          <CardTitle>Neraca</CardTitle>
          <CardDescription>
            Posisi Keuangan per tanggal: {dateRange?.to ? format(dateRange.to, 'd MMMM yyyy', { locale: id }) : '...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
                {/* ASET */}
                <div>
                    <Table>
                        <TableHeader><TableRow><TableHead className="text-lg">Aset</TableHead><TableHead></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {renderSection("Aset Lancar", reportData.currentAssets, reportData.currentAssets.reduce((s, r) => s + r.amount, 0))}
                            {renderSection("Aset Tetap", reportData.fixedAssets, reportData.fixedAssets.reduce((s, r) => s + r.amount, 0))}
                            {renderSection("Aset Lainnya", reportData.otherAssets, reportData.otherAssets.reduce((s, r) => s + r.amount, 0))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="text-lg font-bold bg-secondary/50 hover:bg-secondary">
                                <TableCell>Total Aset</TableCell>
                                <TableCell className="text-right font-mono">{reportData.totalAssets.toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
                {/* KEWAJIBAN & EKUITAS */}
                <div>
                     <Table>
                        <TableHeader><TableRow><TableHead className="text-lg">Kewajiban dan Ekuitas</TableHead><TableHead></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {renderSection("Kewajiban Jangka Pendek", reportData.shortTermLiabilities, reportData.shortTermLiabilities.reduce((s, r) => s + r.amount, 0))}
                            {renderSection("Kewajiban Jangka Panjang", reportData.longTermLiabilities, reportData.longTermLiabilities.reduce((s, r) => s + r.amount, 0))}
                             <TableRow className="font-bold bg-muted/30">
                                <TableCell colSpan={2}>Ekuitas</TableCell>
                            </TableRow>
                            {reportData.equity.map((row) => (
                                <ReportRowLink key={row.accountId} row={row} dateRange={dateRange}/>
                            ))}
                             <TableRow>
                                <TableCell className="pl-8">Laba Ditahan</TableCell>
                                <TableCell className="text-right font-mono">{reportData.retainedEarnings.toLocaleString('id-ID')}</TableCell>
                             </TableRow>
                             <TableRow className="font-semibold border-t">
                                <TableCell className="pl-8">Total Ekuitas</TableCell>
                                <TableCell className="text-right font-mono">{reportData.totalEquity.toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        </TableBody>
                        <TableFooter>
                            <TableRow className="text-lg font-bold bg-secondary/50 hover:bg-secondary">
                                <TableCell>Total Kewajiban dan Ekuitas</TableCell>
                                <TableCell className="text-right font-mono">{(reportData.totalLiabilities + reportData.totalEquity).toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
