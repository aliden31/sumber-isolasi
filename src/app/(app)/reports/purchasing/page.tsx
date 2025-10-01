
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, where, Timestamp, orderBy, getDocs, limit, startAfter, endBefore, limitToLast, Query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PurchaseOrder } from '@/lib/types';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, ShoppingCart, Truck, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer } from "@/components/ui/chart";
import { Badge } from '@/components/ui/badge';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getCompanySettings } from '@/app/(app)/settings/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

(jsPDF as any).autoTableSetDefaults({
    headStyles: { fillColor: [15, 23, 42] },
    styles: { font: 'helvetica' },
});

interface PurchaseMetric {
    totalValue: number;
    totalOrders: number;
    supplierCount: number;
}

interface SupplierPurchaseSummary {
    supplierName: string;
    totalValue: number;
}

export default function PurchasingReportPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchPOs = async (direction: 'next' | 'prev' | 'initial') => {
    setLoading(true);
    let q: Query<DocumentData>;
    let baseQuery = query(collection(db, 'purchaseOrders'), orderBy('date', 'desc'));

    if (dateRange?.from) {
        const from = Timestamp.fromDate(dateRange.from);
        let to = dateRange.to ? Timestamp.fromDate(dateRange.to) : from;
        const toDayEnd = new Date(dateRange.to || dateRange.from);
        toDayEnd.setHours(23, 59, 59, 999);
        to = Timestamp.fromDate(toDayEnd);
        baseQuery = query(baseQuery, where("date", ">=", from), where("date", "<=", to));
    }
    
    if (direction === 'next' && lastVisible) {
      q = query(baseQuery, startAfter(lastVisible), limit(itemsPerPage));
    } else if (direction === 'prev' && firstVisible) {
      q = query(baseQuery, endBefore(firstVisible), limitToLast(itemsPerPage));
    } else {
      q = query(baseQuery, limit(itemsPerPage));
    }

    const snapshot = await getDocs(q);
    const pos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() } as PurchaseOrder));
    
    setPurchaseOrders(pos);
    setLastVisible(snapshot.docs[snapshot.docs.length-1]);
    setFirstVisible(snapshot.docs[0]);

    const nextQuery = query(baseQuery, startAfter(snapshot.docs[snapshot.docs.length - 1] || null), limit(1));
    const nextSnapshot = await getDocs(nextQuery);
    setHasNextPage(!nextSnapshot.empty);
    
    setLoading(false);
  };
  
  useEffect(() => {
    fetchPOs('initial');
  }, [dateRange, itemsPerPage]);

  const handleNextPage = () => {
    setPage(p => p + 1);
    fetchPOs('next');
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(p => p - 1);
      fetchPOs('prev');
    }
  };


  const { metrics, supplierSummary } = useMemo(() => {
    const metrics: PurchaseMetric = {
      totalValue: 0,
      totalOrders: purchaseOrders.length,
      supplierCount: 0,
    };
    
    const supplierMap: { [key: string]: number } = {};
    const uniqueSuppliers = new Set<string>();

    purchaseOrders.forEach(po => {
      metrics.totalValue += po.total;
      uniqueSuppliers.add(po.supplierId);
      
      if (!supplierMap[po.supplierName]) {
          supplierMap[po.supplierName] = 0;
      }
      supplierMap[po.supplierName] += po.total;
    });

    metrics.supplierCount = uniqueSuppliers.size;

    const supplierSummary: SupplierPurchaseSummary[] = Object.entries(supplierMap)
        .map(([supplierName, totalValue]) => ({ supplierName, totalValue }))
        .sort((a, b) => b.totalValue - a.totalValue);

    return { metrics, supplierSummary };
  }, [purchaseOrders]);
  
  const top5Suppliers = useMemo(() => supplierSummary.slice(0, 5), [supplierSummary]);

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const settings = await getCompanySettings();
    const companyName = settings.companyName || 'Toko Kilat';
    const period = `Periode: ${dateRange?.from ? format(dateRange.from, 'd MMM yyyy', { locale: id }) : '...'} - ${dateRange?.to ? format(dateRange.to, 'd MMM yyyy', { locale: id }) : '...'}`;
    
    let y = 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 105, y, { align: 'center' });
    y += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan Pembelian', 105, y, { align: 'center' });
    y += 5;
    doc.setFontSize(10);
    doc.text(period, 105, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Ringkasan Metrik Pembelian", 14, y);
    y+= 6;
    (doc as any).autoTable({
        startY: y,
        body: [
            ['Total Nilai Pembelian', `Rp ${metrics.totalValue.toLocaleString('id-ID')}`],
            ['Total Pesanan (PO)', `${metrics.totalOrders.toLocaleString('id-ID')}`],
            ['Jumlah Pemasok', `${metrics.supplierCount.toLocaleString('id-ID')}`],
        ],
        theme: 'grid',
    });

    y = (doc as any).autoTable.previous.finalY + 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Riwayat Pesanan Pembelian", 14, y);
    y += 6;

    const tableData = purchaseOrders.map(po => [
      format(po.date, "dd MMM yyyy", { locale: id }),
      po.id,
      po.supplierName,
      po.status,
      `Rp ${po.total.toLocaleString('id-ID')}`,
    ]);

    (doc as any).autoTable({
        startY: y,
        head: [['Tanggal', 'No. PO', 'Pemasok', 'Status', 'Total']],
        body: tableData,
        theme: 'striped',
        styles: { cellPadding: 2, fontSize: 8 },
        columnStyles: {
            4: { halign: 'right' },
        }
    });
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Dicetak pada ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, doc.internal.pageSize.getHeight() - 10);
    
    doc.save(`laporan-pembelian-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedPO(null)}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Pembelian</h1>
           <div className="flex gap-2">
              <DateRangePicker onSelect={setDateRange} />
              <Button onClick={handleExportPDF} variant="outline" disabled={loading}>
                  <Download className="mr-2 h-4 w-4"/>
                  Ekspor PDF
              </Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard title="Total Nilai Pembelian" value={metrics.totalValue} format="currency" icon={DollarSign} />
            <MetricCard title="Total Pesanan (PO)" value={metrics.totalOrders} icon={ShoppingCart} />
            <MetricCard title="Jumlah Pemasok" value={metrics.supplierCount} icon={Truck} />
          </div>

          <Card>
              <CardHeader>
                  <CardTitle>Total Pembelian per Pemasok</CardTitle>
              </CardHeader>
              <CardContent>
                  <ChartContainer config={{}} className="min-h-[250px] w-full">
                      <BarChart data={top5Suppliers} layout="vertical" margin={{ left: 20 }}>
                           <XAxis type="number" hide />
                           <YAxis dataKey="supplierName" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--foreground))" fontSize={12} width={150} />
                           <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                           <Bar dataKey="totalValue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Total Pembelian"/>
                      </BarChart>
                  </ChartContainer>
              </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pesanan Pembelian</CardTitle>
              <CardDescription>
                Daftar pesanan pembelian untuk periode yang dipilih.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No. PO</TableHead>
                    <TableHead>Pemasok</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                  ) : purchaseOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Tidak ada pesanan pembelian.</TableCell></TableRow>
                  ) : (
                    purchaseOrders.map(po => (
                      <TableRow key={po.id}>
                          <TableCell>{format(po.date, "dd MMM yyyy", { locale: id })}</TableCell>
                          <TableCell>
                            <DialogTrigger asChild>
                              <Button variant="link" className="p-0 h-auto font-mono text-xs" onClick={() => setSelectedPO(po)}>
                                {po.id}
                              </Button>
                            </DialogTrigger>
                          </TableCell>
                          <TableCell>{po.supplierName}</TableCell>
                          <TableCell><Badge variant={po.status === 'Completed' ? 'secondary' : (po.status === 'Draft' ? 'outline' : 'default')}>{po.status}</Badge></TableCell>
                          <TableCell className="text-right font-mono">Rp {po.total.toLocaleString('id-ID')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Tampilkan</span>
                  <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                      <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                          {[50, 100, 200].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">per halaman.</span>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Halaman {page}</span>
                  <Button variant="outline" onClick={handlePrevPage} disabled={page === 1 || loading}>
                      <ArrowLeft className="mr-2 h-4 w-4"/> Sebelumnya
                  </Button>
                  <Button variant="outline" onClick={handleNextPage} disabled={!hasNextPage || loading}>
                      Berikutnya <ArrowRight className="ml-2 h-4 w-4"/>
                  </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {selectedPO && (
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail PO: #{selectedPO.id}</DialogTitle>
            <DialogDescription>
              Pemasok: {selectedPO.supplierName} | Tanggal: {format(selectedPO.date, "dd MMM yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-center">Kuantitas</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPO.items.map(item => (
                  <TableRow key={item.productId}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right font-mono">Rp {item.cost.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right font-mono">Rp {(item.cost * item.quantity).toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

interface MetricCardProps {
    title: string;
    value: number;
    format?: 'currency' | 'number';
    icon: React.ElementType;
}

function MetricCard({ title, value, format = 'number', icon: Icon }: MetricCardProps) {
    const formattedValue = format === 'currency' 
        ? `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
        : value.toLocaleString('id-ID');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formattedValue}</div>
            </CardContent>
        </Card>
    );
}

declare module '@/components/ui/date-range-picker' {
    interface DateRangePickerProps {
        onSelect?: (date?: DateRange) => void;
    }
}
