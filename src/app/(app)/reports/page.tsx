
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Transaction, ProductSalesSummary, SalesMetric, SalesTrendData, Product } from '@/lib/types';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer } from "@/components/ui/chart";

export default function SalesReportPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  useEffect(() => {
    setLoading(true);

    const productsUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    let q = query(collection(db, 'transactions'), orderBy('date', 'desc'));

    if (dateRange?.from) {
        const from = Timestamp.fromDate(dateRange.from);
        let to = dateRange.to ? Timestamp.fromDate(dateRange.to) : from;
        const toDayEnd = new Date(dateRange.to || dateRange.from);
        toDayEnd.setHours(23, 59, 59, 999);
        to = Timestamp.fromDate(toDayEnd);
        
        q = query(collection(db, 'transactions'), where("date", ">=", from), where("date", "<=", to), orderBy("date", "asc"));
    }

    const transUnsub = onSnapshot(q, (snapshot) => {
        setTransactions(snapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, date: data.date.toDate() } as Transaction;
        }));
        setLoading(false);
    }, (error) => {
        console.error("Error fetching transactions:", error);
        setLoading(false);
    });

    return () => {
        transUnsub();
        productsUnsub();
    };
  }, [dateRange]);

  const { metrics, productSummary, salesTrend } = useMemo(() => {
    const metrics: SalesMetric = {
      grossSales: 0,
      totalTransactions: transactions.length,
      avgTransactionValue: 0,
      productsSold: 0,
    };
    
    const productSummaryMap: { [key: string]: ProductSalesSummary } = {};
    const salesTrendMap: { [key: string]: number } = {};

    transactions.forEach(tx => {
      metrics.grossSales += tx.total;
      
      const dateKey = format(tx.date, 'yyyy-MM-dd');
      if (!salesTrendMap[dateKey]) salesTrendMap[dateKey] = 0;
      salesTrendMap[dateKey] += tx.total;

      tx.items.forEach(item => {
        metrics.productsSold += item.quantity;
        const product = products.find(p => p.id === item.productId);
        const cost = product?.cost || item.cost || 0; // use master product cost if available

        if (!productSummaryMap[item.productId]) {
          productSummaryMap[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantitySold: 0,
            grossRevenue: 0,
            grossProfit: 0,
          };
        }
        const summary = productSummaryMap[item.productId];
        summary.quantitySold += item.quantity;
        summary.grossRevenue += item.price * item.quantity;
        summary.grossProfit += (item.price - cost) * item.quantity;
      });
    });

    if (metrics.totalTransactions > 0) {
      metrics.avgTransactionValue = metrics.grossSales / metrics.totalTransactions;
    }

    const productSummary = Object.values(productSummaryMap).sort((a, b) => b.grossRevenue - a.grossRevenue);
    
    const salesTrend: SalesTrendData[] = Object.entries(salesTrendMap)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { metrics, productSummary, salesTrend };
  }, [transactions, products]);
  
  const top5Products = useMemo(() => {
    return [...productSummary].sort((a,b) => b.quantitySold - a.quantitySold).slice(0, 5);
  }, [productSummary]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Penjualan</h1>
        <DateRangePicker onSelect={setDateRange} />
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Penjualan Kotor" value={metrics.grossSales} format="currency" icon={DollarSign} />
            <MetricCard title="Total Transaksi" value={metrics.totalTransactions} icon={ShoppingCart} />
            <MetricCard title="Rata-rata Transaksi" value={metrics.avgTransactionValue} format="currency" icon={TrendingUp} />
            <MetricCard title="Produk Terjual" value={metrics.productsSold} icon={Package} />
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                  <CardHeader>
                      <CardTitle>Tren Penjualan Harian</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <ChartContainer config={{}} className="min-h-[250px] w-full">
                          <LineChart data={salesTrend}>
                              <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), 'dd MMM', { locale: id })} stroke="hsl(var(--foreground))" fontSize={12} />
                              <YAxis tickFormatter={(val) => `Rp${Number(val) / 1000}k`} stroke="hsl(var(--foreground))" fontSize={12}/>
                              <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                              <Legend />
                              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="Penjualan" dot={false}/>
                          </LineChart>
                      </ChartContainer>
                  </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                  <CardHeader>
                      <CardTitle>Produk Terlaris (Kuantitas)</CardTitle>
                  </CardHeader>
                  <CardContent>
                       <ChartContainer config={{}} className="min-h-[250px] w-full">
                          <BarChart data={top5Products} layout="vertical" margin={{ left: 20 }}>
                               <XAxis type="number" hide />
                               <YAxis dataKey="productName" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--foreground))" fontSize={12} width={120} />
                               <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                               <Bar dataKey="quantitySold" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Terjual"/>
                          </BarChart>
                      </ChartContainer>
                  </CardContent>
              </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rangkuman Penjualan per Produk</CardTitle>
              <CardDescription>
                Periode: {dateRange?.from ? format(dateRange.from, 'd MMM yyyy', { locale: id }) : '...'} - {dateRange?.to ? format(dateRange.to, 'd MMM yyyy', { locale: id }) : '...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Kuantitas Terjual</TableHead>
                    <TableHead className="text-right">Pendapatan Kotor</TableHead>
                    <TableHead className="text-right">Laba Kotor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productSummary.map(p => (
                    <TableRow key={p.productId}>
                      <TableCell className="font-medium">{p.productName}</TableCell>
                      <TableCell className="text-right">{p.quantitySold}</TableCell>
                      <TableCell className="text-right font-mono">Rp {p.grossRevenue.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right font-mono">Rp {p.grossProfit.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
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
