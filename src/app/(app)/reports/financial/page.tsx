

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
import { getCompanySettings } from '@/app/(app)/settings/actions';


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
  const reportRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const unsubAccounts = onSnapshot(collection(db, 'coa'), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });

    return () => unsubAccounts();
  }, []);
  
  useEffect(() => {
    if (accounts.length === 0) return; // Wait for accounts to be loaded

    setLoading(true);
    const journalsCol = collection(db, 'journals');
    let q = query(journalsCol, orderBy('date', 'asc'));

    if (dateRange?.from) {
        const from = Timestamp.fromDate(dateRange.from);
        let to = dateRange.to ? Timestamp.fromDate(dateRange.to) : from;

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
  }, [dateRange, accounts]);


  const reportData: FinancialReport = useMemo(() => {
    const revenueAccountTypes = ['Pendapatan', 'Pendapatan Lainnya'];
    const cogsAccountTypes = ['Beban Pokok Penjualan'];
    const expenseAccountTypes = ['Beban Operasional', 'Beban Lainnya'];

    const accountBalances: { [key: string]: number } = {};

    journals.forEach(journal => {
      journal.entries.forEach(entry => {
        const account = accounts.find(a => a.id === entry.accountId);
        if (account && [...revenueAccountTypes, ...cogsAccountTypes, ...expenseAccountTypes].includes(account.type)) {
           if (!accountBalances[entry.accountId]) {
             accountBalances[entry.accountId] = 0;
           }
           const balanceEffect = (revenueAccountTypes.includes(account.type)) 
                ? entry.credit - entry.debit
                : entry.debit - entry.credit;

            accountBalances[entry.accountId] += balanceEffect;
        }
      });
    });

    const report: FinancialReport = {
      revenues: [], cogs: [], expenses: [],
      totalRevenue: 0, totalCogs: 0, grossProfit: 0, totalExpense: 0, netIncome: 0,
    };

    Object.entries(accountBalances).forEach(([accountId, balance]) => {
      const account = accounts.find(a => a.id === accountId);
      if (account && balance !== 0) {
        const row = { accountName: account.name, amount: balance };
        if (revenueAccountTypes.includes(account.type)) {
          report.revenues.push(row);
        } else if (cogsAccountTypes.includes(account.type)) {
          report.cogs.push(row);
        } else if (expenseAccountTypes.includes(account.type)) {
          report.expenses.push(row);
        }
      }
    });
    
    report.totalRevenue = report.revenues.reduce((sum, r) => sum + r.amount, 0);
    report.totalCogs = report.cogs.reduce((sum, c) => sum + c.amount, 0);
    report.totalExpense = report.expenses.reduce((sum, e) => sum + e.amount, 0);
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
      {isTotal && rows.length > 0 && (
        <TableRow className={cn("font-bold", className)}>
            <TableCell className="pl-8">Total {title}</TableCell>
            <TableCell className="text-right font-mono">{total.toLocaleString('id-ID')}</TableCell>
        </TableRow>
      )}
    </>
  );
  
  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const settings = await getCompanySettings();
    const companyName = settings.companyName || 'Toko Kilat';
    
    let y = 15;
    const pageHeight = doc.internal.pageSize.getHeight();
    const addPageIfNeeded = () => {
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 15;
        }
    }

    doc.setTextColor(0, 0, 0); // Set text color to black

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 105, y, { align: 'center' });
    y += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan Laba Rugi', 105, y, { align: 'center' });
    y += 5;
    const dateStr = `Untuk Periode yang Berakhir pada ${dateRange?.to ? format(dateRange.to, 'd MMMM yyyy', { locale: id }) : ''}`;
    doc.setFontSize(10);
    doc.text(dateStr, 105, y, { align: 'center' });
    y += 10;
    
    const formatCurrency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
    const drawLine = () => {
        y += 2;
        doc.setDrawColor(0, 0, 0); // Set line color to black
        doc.line(15, y, 195, y);
        y += 4;
    };

    doc.setFont('helvetica', 'bold');
    doc.text('Pendapatan', 15, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    reportData.revenues.forEach(row => {
        addPageIfNeeded();
        doc.text(row.accountName, 20, y);
        doc.text(formatCurrency(row.amount), 195, y, { align: 'right' });
        y += 6;
    });

    drawLine();
    doc.setFont('helvetica', 'bold');
    doc.text('Total Pendapatan', 15, y);
    doc.text(formatCurrency(reportData.totalRevenue), 195, y, { align: 'right' });
    y += 10;

    doc.text('Beban Pokok Penjualan', 15, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    reportData.cogs.forEach(row => {
        addPageIfNeeded();
        doc.text(row.accountName, 20, y);
        doc.text(`(${formatCurrency(row.amount)})`, 195, y, { align: 'right' });
        y += 6;
    });
    
    drawLine();
    doc.setFont('helvetica', 'bold');
    doc.text('Laba Kotor', 15, y);
    doc.text(formatCurrency(reportData.grossProfit), 195, y, { align: 'right' });
    y += 10;

    doc.text('Beban Operasional', 15, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
     reportData.expenses.forEach(row => {
        addPageIfNeeded();
        doc.text(row.accountName, 20, y);
        doc.text(`(${formatCurrency(row.amount)})`, 195, y, { align: 'right' });
        y += 6;
    });
    
    drawLine();
    doc.setFont('helvetica', 'bold');
    doc.text('Laba Bersih', 15, y);
    doc.text(formatCurrency(reportData.netIncome), 195, y, { align: 'right' });
    y += 10;

    // Footer
    const pageCount = doc.internal.pages.length;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150); // Muted color for footer
        doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.getWidth() - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        doc.text(`Dicetak pada ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 15, doc.internal.pageSize.getHeight() - 10);
    }
    
    doc.save(`laporan-laba-rugi-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Laba Rugi</h1>
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
          <CardTitle>Laporan Laba Rugi</CardTitle>
          <CardDescription>
            Periode: {dateRange?.from ? format(dateRange.from, 'd MMM yyyy', { locale: id }) : '...'} - {dateRange?.to ? format(dateRange.to, 'd MMM yyyy', { locale: id }) : '...'}
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

                {renderSection("Beban", reportData.expenses, reportData.totalExpense)}
              </TableBody>
              <TableFooter>
                <TableRow className="text-lg font-bold bg-secondary/50 hover:bg-secondary">
                  <TableCell>Laba Bersih</TableCell>
                  <TableCell className={cn("text-right font-mono", reportData.netIncome < 0 && "text-destructive")}>{reportData.netIncome.toLocaleString('id-ID')}</TableCell>
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


