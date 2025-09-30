
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Account, Journal } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ReportRow = {
  description: string;
  amount: number;
};

type CashFlowReport = {
  netIncome: number;
  adjustments: ReportRow[];
  netCashFromOperating: number;
  
  investingActivities: ReportRow[];
  netCashFromInvesting: number;

  financingActivities: ReportRow[];
  netCashFromFinancing: number;

  netCashChange: number;
  beginningCash: number;
  endingCash: number;
};

const isAsset = (type: string) => type.startsWith('Aset') || type.startsWith('Kas');
const isLiability = (type: string) => type.startsWith('Kewajiban');
const isEquity = (type: string) => type.startsWith('Ekuitas');
const isRevenue = (type: string) => type.startsWith('Pendapatan');
const isExpense = (type: string) => type.startsWith('Beban');
const isContraAsset = (type: string) => type.startsWith('Akumulasi');


export default function CashFlowPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [allTimeJournals, setAllTimeJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const unsubAccounts = onSnapshot(query(collection(db, 'coa'), orderBy('code')), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });
    
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
      netIncome: 0, adjustments: [], netCashFromOperating: 0,
      investingActivities: [], netCashFromInvesting: 0,
      financingActivities: [], netCashFromFinancing: 0,
      netCashChange: 0, beginningCash: 0, endingCash: 0
    };

    if (!dateRange?.from) return report;
    
    const calculateBalances = (journalList: Journal[]) => {
        const balances: { [key: string]: number } = {};
        accounts.forEach(acc => { balances[acc.id] = 0; });
        journalList.forEach(journal => {
            journal.entries.forEach(entry => {
                const account = accounts.find(a => a.id === entry.accountId);
                if (account) {
                   const balanceEffect = (isAsset(account.type) || isExpense(account.type)) && !isContraAsset(account.type)
                        ? entry.debit - entry.credit
                        : entry.credit - entry.debit;
                   balances[entry.accountId] += balanceEffect;
                }
            })
        });
        return balances;
    }

    const beginningJournals = allTimeJournals.filter(j => j.date < dateRange.from!);
    const beginningBalances = calculateBalances(beginningJournals);
    report.beginningCash = cashAccountIds.reduce((sum, id) => sum + (beginningBalances[id] || 0), 0);

    const endingBalances = calculateBalances(allTimeJournals.filter(j => j.date <= (dateRange.to || dateRange.from!)));
    report.endingCash = cashAccountIds.reduce((sum, id) => sum + (endingBalances[id] || 0), 0);
    
    const currentBalances = calculateBalances(journals);

    // Calculate Net Income for the period
    let netIncome = 0;
    accounts.forEach(acc => {
        if (isRevenue(acc.type)) netIncome += currentBalances[acc.id] || 0;
        if (isExpense(acc.type)) netIncome -= currentBalances[acc.id] || 0;
    });
    report.netIncome = netIncome;

    // Adjustments for Operating Activities (Indirect Method)
    const operatingAdjustments: ReportRow[] = [];
    accounts.forEach(acc => {
        const beginningBalance = beginningBalances[acc.id] || 0;
        const endingBalance = endingBalances[acc.id] || 0;
        const change = endingBalance - beginningBalance;

        if (change === 0) return;

        // Depreciation & Amortization (non-cash expense)
        if (isContraAsset(acc.type)) {
            operatingAdjustments.push({ description: `Penambahan ${acc.name}`, amount: change });
        }
        // Changes in Working Capital
        else if (acc.type === 'Aset Lancar' && acc.type !== 'Kas & Bank') {
            operatingAdjustments.push({ description: `Kenaikan ${acc.name}`, amount: -change }); // Increase in asset is cash outflow
        } else if (acc.type === 'Kewajiban Jangka Pendek') {
            operatingAdjustments.push({ description: `Kenaikan ${acc.name}`, amount: change }); // Increase in liability is cash inflow
        }
    });

    report.adjustments = operatingAdjustments;
    report.netCashFromOperating = report.netIncome + operatingAdjustments.reduce((sum, adj) => sum + adj.amount, 0);

    // Direct cash movements for Investing and Financing
    journals.forEach(journal => {
        const cashEntry = journal.entries.find(e => cashAccountIds.includes(e.accountId));
        if (!cashEntry) return; // Skip non-cash transaction

        const cashAmount = cashEntry.debit - cashEntry.credit;
        const contraEntries = journal.entries.filter(e => !cashAccountIds.includes(e.accountId));

        contraEntries.forEach(contra => {
            const contraAccount = accounts.find(a => a.id === contra.accountId);
            if (!contraAccount) return;
            
            const contraAmount = contra.debit - contra.credit;

            if (contraAccount.type === 'Aset Tetap') {
                report.investingActivities.push({ description: contraAmount > 0 ? `Pembelian ${contraAccount.name}` : `Penjualan ${contraAccount.name}`, amount: -cashAmount });
            } else if (contraAccount.type === 'Kewajiban Jangka Panjang' || contraAccount.type === 'Ekuitas') {
                report.financingActivities.push({ description: contraAmount < 0 ? `Penerimaan dari ${contraAccount.name}` : `Pembayaran ke ${contraAccount.name}`, amount: cashAmount });
            }
        });
    });

    report.netCashFromInvesting = report.investingActivities.reduce((sum, inv) => sum + inv.amount, 0);
    report.netCashFromFinancing = report.financingActivities.reduce((sum, fin) => sum + fin.amount, 0);
    report.netCashChange = report.netCashFromOperating + report.netCashFromInvesting + report.netCashFromFinancing;

    return report;
  }, [journals, accounts, cashAccountIds, allTimeJournals, dateRange]);

  const handleExportPDF = () => {
    const input = reportRef.current;
    if (!input) return;

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const height = pdfWidth / ratio;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height);
      pdf.save(`laporan-arus-kas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    });
  };

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
        <TableCell>Arus Kas Bersih dari {title.replace('Arus Kas dari ', '')}</TableCell>
        <TableCell className="text-right font-mono">{total.toLocaleString('id-ID')}</TableCell>
      </TableRow>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Arus Kas</h1>
        <div className="flex gap-2">
            <DateRangePicker onSelect={setDateRange} />
            <Button onClick={handleExportPDF} variant="outline" disabled={loading}>
                <Download className="mr-2 h-4 w-4"/>
                Ekspor PDF
            </Button>
        </div>
      </div>
      <Card ref={reportRef}>
        <CardHeader>
          <CardTitle>Laporan Arus Kas (Metode Tidak Langsung)</CardTitle>
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
                    <TableRow className="font-bold bg-muted/30"><TableCell colSpan={2}>Arus Kas dari Aktivitas Operasi</TableCell></TableRow>
                    <TableRow><TableCell className="pl-8">Laba Bersih</TableCell><TableCell className="text-right font-mono">{reportData.netIncome.toLocaleString('id-ID')}</TableCell></TableRow>
                    <TableRow><TableCell className="pl-8 font-semibold text-muted-foreground">Penyesuaian untuk rekonsiliasi:</TableCell><TableCell></TableCell></TableRow>
                    {reportData.adjustments.map((row, i) => (
                        <TableRow key={`adj-${i}`}>
                            <TableCell className="pl-12">{row.description}</TableCell>
                            <TableCell className="text-right font-mono">{row.amount.toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="font-semibold border-t"><TableCell>Arus Kas Bersih dari Aktivitas Operasi</TableCell><TableCell className="text-right font-mono">{reportData.netCashFromOperating.toLocaleString('id-ID')}</TableCell></TableRow>

                    {renderSection("Arus Kas dari Aktivitas Investasi", reportData.investingActivities, reportData.netCashFromInvesting)}
                    {renderSection("Arus Kas dari Aktivitas Pendanaan", reportData.financingActivities, reportData.netCashFromFinancing)}
                </TableBody>
                <TableFooter>
                    <TableRow className="font-bold text-base"><TableCell>Kenaikan (Penurunan) Bersih Kas</TableCell><TableCell className="text-right font-mono">{reportData.netCashChange.toLocaleString('id-ID')}</TableCell></TableRow>
                    <TableRow><TableCell>Saldo Kas dan Setara Kas, Awal Periode</TableCell><TableCell className="text-right font-mono">{reportData.beginningCash.toLocaleString('id-ID')}</TableCell></TableRow>
                    <TableRow className="font-bold text-lg bg-secondary/50 hover:bg-secondary"><TableCell>Saldo Kas dan Setara Kas, Akhir Periode</TableCell><TableCell className="text-right font-mono">{reportData.endingCash.toLocaleString('id-ID')}</TableCell></TableRow>
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
