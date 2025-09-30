
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PurchaseOrder } from '@/lib/types';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, ShoppingCart, Truck } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer } from "@/components/ui/chart";
import { Badge } from '@/components/ui/badge';
import { id } from 'date-fns/locale';

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

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'purchaseOrders'), orderBy('date', 'desc'));

    if (dateRange?.from) {
        const from = Timestamp.fromDate(dateRange.from);
        let to = dateRange.to ? Timestamp.fromDate(dateRange.to) : from;
        const toDayEnd = new Date(dateRange.to || dateRange.from);
        toDayEnd.setHours(23, 59, 59, 999);
        to = Timestamp.fromDate(toDayEnd);
        
        q = query(q, where("date", ">=", from), where("date", "<=", to));
    }

    const unsub = onSnapshot(q, (snapshot) => {
        setPurchaseOrders(snapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, date: data.date.toDate() } as PurchaseOrder;
        }));
        setLoading(false);
    }, (error) => {
        console.error("Error fetching purchase orders:", error);
        setLoading(false);
    });

    return () => unsub();
  }, [dateRange]);

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Pembelian</h1>
        <DateRangePicker onSelect={setDateRange} />
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : (
        <>
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
            </Header>
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
                  {purchaseOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Tidak ada pesanan pembelian.</TableCell></TableRow>
                  ) : (
                    purchaseOrders.map(po => (
                      <TableRow key={po.id}>
                          <TableCell>{format(po.date, "dd MMM yyyy", { locale: id })}</TableCell>
                          <TableCell className="font-mono text-xs">{po.id}</TableCell>
                          <TableCell>{po.supplierName}</TableCell>
                          <TableCell><Badge variant={po.status === 'Completed' ? 'secondary' : (po.status === 'Draft' ? 'outline' : 'default')}>{po.status}</Badge></TableCell>
                          <TableCell className="text-right font-mono">Rp {po.total.toLocaleString('id-ID')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
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
