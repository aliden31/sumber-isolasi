
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
import { id } from 'date-fns/locale';

type ReportRow = {
  description: string;
  amount: number;
};

type CashFlowReport = {
  operatingActivities: ReportRow[];
  investingActivities: ReportRow[];
  financingActivities: ReportRow[];
  netCashFromOperating: number;
  netCashFromInvesting: number;
  netCashFromFinancing: number;
  netCashChange: number;
  beginningCash: number;
  endingCash: number;
};

export default function CashFlowPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [allTimeJournals, setAllTimeJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAccounts = onSnapshot(query(collection(db, 'coa'), orderBy('code')), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });
    
    // Fetch all journals for beginning balance calculation
    const allJournalsQuery = query(collection(db, 'journals'), orderBy('date', 'asc'));
    const unsubAllJournals = onSnapshot(allJournalsQuery, (snapshot) => {
        setAllTimeJournals(snapshot.docs.map(doc => ({...doc.data(), date: doc.data().date.toDate()} as Journal)));
    });

    return () => {
        unsubAccounts();
        unsubAllJournals();
    };
  }, []);

  useEffect(() => {
    if (accounts.length === 0 || !dateRange?.from) return;

    setLoading(true);
    const from = Timestamp.fromDate(dateRange.from);
    let to = dateRange.to ? Timestamp.fromDate(dateRange.to) : from;
    const toDayEnd = new Date(dateRange.to || dateRange.from);
    toDayEnd.setHours(23, 59, 59, 999);
    to = Timestamp.fromDate(toDayEnd);
    
    const q = query(collection(db, 'journals'), where("date", ">=", from), where("date", "<=", to), orderBy('date', 'asc'));
    
    const unsubJournals = onSnapshot(q, (snapshot) => {
        setJournals(snapshot.docs.map(doc => ({...doc.data(), date: doc.data().date.toDate()} as Journal)));
        setLoading(false);
    }, (error) => {
        console.error("Error fetching journals:", error);
        setLoading(false);
    });

    return () => unsubJournals();
  }, [dateRange, accounts]);

  const cashAccountIds = useMemo(() => 
    accounts.filter(a => a.type === 'Kas & Bank').map(a => a.id),
  [accounts]);

  const reportData: CashFlowReport = useMemo(() => {
    const report: CashFlowReport = {
      operatingActivities: [], investingActivities: [], financingActivities: [],
      netCashFromOperating: 0, netCashFromInvesting: 0, netCashFromFinancing: 0,
      netCashChange: 0, beginningCash: 0, endingCash: 0,
    };
    
    // Calculate Beginning Cash Balance
    const beginningJournals = allTimeJournals.filter(j => dateRange?.from && j.date < dateRange.from);
    let beginningCash = 0;
    beginningJournals.forEach(j => {
        j.entries.forEach(e => {
            if (cashAccountIds.includes(e.accountId)) {
                beginningCash += e.debit - e.credit;
            }
        })
    });
    report.beginningCash = beginningCash;

    const operatingInflows: { [key: string]: number } = {};
    const operatingOutflows: { [key: string]: number } = {};

    journals.forEach(journal => {
      let cashEffect = 0;
      const nonCashEntries: { account: Account, amount: number }[] = [];
      
      journal.entries.forEach(entry => {
        if (cashAccountIds.includes(entry.accountId)) {
          cashEffect += entry.debit - entry.credit;
        } else {
          const account = accounts.find(a => a.id === entry.accountId);
          if (account) {
            nonCashEntries.push({ account, amount: entry.credit - entry.debit });
          }
        }
      });

      if (cashEffect === 0) return; // Skip non-cash transactions

      nonCashEntries.forEach(nce => {
        const { account, amount } = nce;
        const targetAmount = amount + (cashEffect / nonCashEntries.length); // Distribute cash effect
        
        // Classify based on account type
        if (['Pendapatan', 'Aset Lancar', 'Kewajiban Jangka Pendek'].includes(account.type)) { // Operating
            if (targetAmount > 0) { // Inflow
                const desc = `Penerimaan dari ${account.name}`;
                operatingInflows[desc] = (operatingInflows[desc] || 0) + targetAmount;
            } else { // Outflow
                 const desc = `Pembayaran untuk ${account.name}`;
                operatingOutflows[desc] = (operatingOutflows[desc] || 0) + targetAmount;
            }
        } else if (['Beban Pokok Penjualan', 'Beban Operasional'].includes(account.type)) { // Operating Outflow
            const desc = `Pembayaran ${account.name}`;
            operatingOutflows[desc] = (operatingOutflows[desc] || 0) - targetAmount;
        } else if (account.type.includes('Aset Tetap')) { // Investing
            const desc = amount < 0 ? `Pembelian ${account.name}` : `Penjualan ${account.name}`;
            report.investingActivities.push({ description: desc, amount: -targetAmount });
        } else if (account.type.includes('Ekuitas') || account.type.includes('Kewajiban Jangka Panjang')) { // Financing
            const desc = amount < 0 ? `Penerimaan dari ${account.name}` : `Pembayaran ${account.name}`;
            report.financingActivities.push({ description: desc, amount: -targetAmount });
        }
      });
    });

    report.operatingActivities = [
        ...Object.entries(operatingInflows).map(([desc, amt]) => ({ description: desc, amount: amt })),
        ...Object.entries(operatingOutflows).map(([desc, amt]) => ({ description: desc, amount: amt }))
    ];

    report.netCashFromOperating = report.operatingActivities.reduce((sum, act) => sum + act.amount, 0);
    report.netCashFromInvesting = report.investingActivities.reduce((sum, act) => sum + act.amount, 0);
    report.netCashFromFinancing = report.financingActivities.reduce((sum, act) => sum + act.amount, 0);

    report.netCashChange = report.netCashFromOperating + report.netCashFromInvesting + report.netCashFromFinancing;
    report.endingCash = report.beginningCash + report.netCashChange;

    return report;
  }, [journals, accounts, cashAccountIds, allTimeJournals, dateRange]);

  const renderSection = (title: string, rows: ReportRow[], total: number) => (
    <>
      <TableRow className="font-bold bg-muted/30">
        <TableCell colSpan={2}>{title}</TableCell>
      </TableRow>
      {rows.map((row, index) => (
        <TableRow key={index}>
          <TableCell className="pl-8">{row.description}</TableCell>
          <TableCell className="text-right font-mono">{row.amount.toLocaleString('id-ID')}</TableCell>
        </TableRow>
      ))}
      <TableRow className="font-semibold border-t">
        <TableCell>Arus Kas Bersih dari {title}</TableCell>
        <TableCell className="text-right font-mono">{total.toLocaleString('id-ID')}</TableCell>
      </TableRow>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Arus Kas</h1>
        <DateRangePicker onSelect={setDateRange} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Laporan Arus Kas</CardTitle>
           <CardDescription>
            Periode: {dateRange?.from ? format(dateRange.from, 'd MMM yyyy', { locale: id }) : '...'} - {dateRange?.to ? format(dateRange.to, 'd MMM yyyy', { locale: id }) : '...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
                <TableHeader><TableRow><TableHead>Deskripsi</TableHead><TableHead className="text-right">Jumlah (Rp)</TableHead></TableRow></TableHeader>
                <TableBody>
                    {renderSection("Aktivitas Operasi", reportData.operatingActivities, reportData.netCashFromOperating)}
                    {renderSection("Aktivitas Investasi", reportData.investingActivities, reportData.netCashFromInvesting)}
                    {renderSection("Aktivitas Pendanaan", reportData.financingActivities, reportData.netCashFromFinancing)}
                </TableBody>
                <TableFooter>
                    <TableRow className="font-bold text-base"><TableCell>Kenaikan (Penurunan) Bersih Kas</TableCell><TableCell className="text-right font-mono">{reportData.netCashChange.toLocaleString('id-ID')}</TableCell></TableRow>
                    <TableRow><TableCell>Saldo Kas Awal Periode</TableCell><TableCell className="text-right font-mono">{reportData.beginningCash.toLocaleString('id-ID')}</TableCell></TableRow>
                    <TableRow className="font-bold text-lg bg-secondary/50 hover:bg-secondary"><TableCell>Saldo Kas Akhir Periode</TableCell><TableCell className="text-right font-mono">{reportData.endingCash.toLocaleString('id-ID')}</TableCell></TableRow>
                </TableFooter>
            </Table>
          )}
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

    