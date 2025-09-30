
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Account, Journal } from '@/lib/types';
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


export default function BalanceSheetPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reportDate, setReportDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubAccounts = onSnapshot(collection(db, 'coa'), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });
    return () => unsubAccounts();
  }, []);
  
  useEffect(() => {
    if (accounts.length === 0 || !reportDate) return;

    setLoading(true);
    const journalsCol = collection(db, 'journals');
    
    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);
    const to = Timestamp.fromDate(endDate);
    
    const q = query(journalsCol, where("date", "<=", to), orderBy('date', 'asc'));

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
  }, [reportDate, accounts]);


  const reportData: BalanceSheetReport = useMemo(() => {
    const balances: { [key: string]: number } = {};

    // Initialize all accounts with 0 balance
    accounts.forEach(acc => {
        balances[acc.id] = 0;
    });

    // Calculate balance from journals
    journals.forEach(journal => {
      journal.entries.forEach(entry => {
        const account = accounts.find(a => a.id === entry.accountId);
        if (!account) return;

        const balanceEffect = (isAsset(account.type) || isExpense(account.type))
            ? entry.debit - entry.credit
            : entry.credit - entry.debit;
        
        balances[entry.accountId] += balanceEffect;
      });
    });
    
    const report: BalanceSheetReport = {
        currentAssets: [], fixedAssets: [], otherAssets: [],
        shortTermLiabilities: [], longTermLiabilities: [],
        equity: [],
        totalAssets: 0, totalLiabilities: 0, totalEquity: 0,
        retainedEarnings: 0
    };

    // Calculate retained earnings from profit/loss
    let netIncome = 0;
    accounts.forEach(account => {
        if(isRevenue(account.type)) netIncome += balances[account.id];
        if(isExpense(account.type)) netIncome -= balances[account.id];
    });

    accounts.forEach(account => {
        const balance = balances[account.id];
        const row = { accountName: account.name, amount: balance };

        if (isAsset(account.type)) {
            if (account.type === 'Aset Lancar' || account.type === 'Kas & Bank') report.currentAssets.push(row);
            else if (account.type === 'Aset Tetap') report.fixedAssets.push(row);
            else if (account.type === 'Akumulasi Penyusutan') report.fixedAssets.push({ accountName: account.name, amount: -balance });
            else report.otherAssets.push(row);
        } else if (isLiability(account.type)) {
            if (account.type === 'Kewajiban Jangka Pendek') report.shortTermLiabilities.push(row);
            else report.longTermLiabilities.push(row);
        } else if (isEquity(account.type)) {
            // Don't include temporary income statement accounts in equity section
            if (account.name.toLowerCase().includes('laba ditahan')) {
                report.retainedEarnings += balance + netIncome; // Add current period net income to retained earnings
            } else {
                 if (account.name.toLowerCase().includes('ikhtisar')) return;
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
  }, [journals, accounts]);
  
  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const settings = await getCompanySettings();
    const companyName = settings.companyName || 'Toko Kilat';
    
    let y = 15;
    const pageHeight = doc.internal.pageSize.getHeight();
    const rightMargin = 195;
    const leftMargin = 15;
    const indent = 5;

    const addPageIfNeeded = () => {
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 15;
        }
    }
    const formatCurrency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
    const drawLine = (yPos: number) => doc.line(leftMargin, yPos, rightMargin, yPos);
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 105, y, { align: 'center' });
    y += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan Posisi Keuangan', 105, y, { align: 'center' });
    y += 5;
    doc.setFontSize(10);
    const dateStr = `Per ${reportDate ? format(reportDate, 'd MMMM yyyy', { locale: id }) : ''}`;
    doc.text(dateStr, 105, y, { align: 'center' });
    y += 10;
    
    // --- RENDER FUNCTION ---
    const renderPdfSection = (title: string, data: ReportRow[], total: number, isTotalBold: boolean = false) => {
        if (data.length === 0 && total === 0) return;
        
        addPageIfNeeded();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(title, leftMargin, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        data.forEach(row => {
            addPageIfNeeded();
            doc.text(row.accountName, leftMargin + indent, y);
            doc.text(formatCurrency(row.amount), rightMargin, y, { align: 'right' });
            y += 5;
        });

        if (data.length > 1) {
             addPageIfNeeded();
             doc.setFont('helvetica', 'bold');
             doc.text(`Total ${title}`, leftMargin + indent, y);
             doc.text(formatCurrency(total), rightMargin, y, { align: 'right' });
             y += 7;
        }
    }

    // --- ASET ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ASET', leftMargin, y);
    y += 6;

    renderPdfSection("Aset Lancar", reportData.currentAssets, reportData.currentAssets.reduce((s, r) => s + r.amount, 0));
    renderPdfSection("Aset Tetap", reportData.fixedAssets, reportData.fixedAssets.reduce((s, r) => s + r.amount, 0));
    
    drawLine(y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("TOTAL ASET", leftMargin, y);
    doc.text(formatCurrency(reportData.totalAssets), rightMargin, y, { align: 'right' });
    y += 10;
    
    // --- KEWAJIBAN & EKUITAS ---
    addPageIfNeeded();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('KEWAJIBAN DAN EKUITAS', leftMargin, y);
    y += 6;

    // Kewajiban
    renderPdfSection("Kewajiban Jangka Pendek", reportData.shortTermLiabilities, reportData.shortTermLiabilities.reduce((s, r) => s + r.amount, 0));
    renderPdfSection("Kewajiban Jangka Panjang", reportData.longTermLiabilities, reportData.longTermLiabilities.reduce((s, r) => s + r.amount, 0));

    // Ekuitas
    addPageIfNeeded();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Ekuitas', leftMargin, y);
    y+=6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    reportData.equity.forEach(row => {
        addPageIfNeeded();
        doc.text(row.accountName, leftMargin + indent, y);
        doc.text(formatCurrency(row.amount), rightMargin, y, { align: 'right' });
        y += 5;
    });
    doc.text('Laba Ditahan', leftMargin + indent, y);
    doc.text(formatCurrency(reportData.retainedEarnings), rightMargin, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Ekuitas', leftMargin + indent, y);
    doc.text(formatCurrency(reportData.totalEquity), rightMargin, y, { align: 'right' });
    y += 7;
    addPageIfNeeded();

    drawLine(y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("TOTAL KEWAJIBAN DAN EKUITAS", leftMargin, y);
    doc.text(formatCurrency(reportData.totalLiabilities + reportData.totalEquity), rightMargin, y, { align: 'right' });

    // --- Footer ---
    const pageCount = doc.internal.pages.length;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.getWidth() - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        doc.text(`Dicetak pada ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 15, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`laporan-neraca-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const renderSection = (title: string, rows: ReportRow[], total: number) => (
    <>
      <TableRow className="font-bold bg-muted/30">
        <TableCell>{title}</TableCell>
        <TableCell></TableCell>
      </TableRow>
      {rows.map((row, index) => (
        <TableRow key={index}>
          <TableCell className="pl-8">{row.accountName}</TableCell>
          <TableCell className="text-right font-mono">{row.amount.toLocaleString('id-ID')}</TableCell>
        </TableRow>
      ))}
      <TableRow className="font-semibold border-t">
        <TableCell className="pl-8">Total {title}</TableCell>
        <TableCell className="text-right font-mono">{total.toLocaleString('id-ID')}</TableCell>
      </TableRow>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Posisi Keuangan (Neraca)</h1>
        <div className="flex gap-2">
            <DatePicker date={reportDate} setDate={setReportDate} />
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
            Posisi Keuangan per tanggal: {reportDate ? format(reportDate, 'd MMMM yyyy', { locale: id }) : '...'}
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
                            {reportData.equity.map((row, index) => (
                                <TableRow key={index}>
                                <TableCell className="pl-8">{row.accountName}</TableCell>
                                <TableCell className="text-right font-mono">{row.amount.toLocaleString('id-ID')}</TableCell>
                                </TableRow>
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


    

    