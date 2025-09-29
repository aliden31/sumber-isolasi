'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, DollarSign, Package, ShoppingCart } from "lucide-react";
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, Transaction, SalesData } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WeeklySalesChart } from "@/components/dashboard/weekly-sales-chart";

export default function DashboardPage() {
  const [dailySales, setDailySales] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [weeklySales, setWeeklySales] = useState<SalesData[]>([]);

  useEffect(() => {
    // --- Transactions Listener ---
    const transactionsCol = collection(db, "transactions");
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);
    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

    const qTransactions = query(transactionsCol, where("date", ">=", sevenDaysAgoTimestamp));

    const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
      let totalToday = 0;
      let cashTotal = 0;
      const salesByDay: { [key: string]: number } = { 'Sen': 0, 'Sel': 0, 'Rab': 0, 'Kam': 0, 'Jum': 0, 'Sab': 0, 'Min': 0 };
      const dayMapping = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

      snapshot.docs.forEach(doc => {
        const tx = { ...doc.data(), date: doc.data().date.toDate() } as Transaction;
        const txDate = tx.date;

        // Check if transaction is from today
        if (txDate.getFullYear() === today.getFullYear() &&
            txDate.getMonth() === today.getMonth() &&
            txDate.getDate() === today.getDate()) {
          totalToday += tx.total;
          if (tx.paymentMethod === 'Tunai') {
              cashTotal += tx.total;
          }
        }

        // Aggregate sales for the last 7 days
        const dayOfWeek = dayMapping[txDate.getDay()];
        if(salesByDay.hasOwnProperty(dayOfWeek)){
            salesByDay[dayOfWeek] += tx.total;
        }
      });

      setDailySales(totalToday);
      setCashBalance(cashTotal);
      
      const formattedWeeklySales = dayMapping.map(day => ({
        day,
        total: salesByDay[day]
      }));
      setWeeklySales(formattedWeeklySales);
    });

    // --- Products Listener ---
    const productsCol = collection(db, "products");
    const qLowStock = query(productsCol, where("stock", "<", 10));

    const unsubscribeProducts = onSnapshot(productsCol, (snapshot) => {
      setTotalProducts(snapshot.size);
    });
    
    const unsubscribeLowStock = onSnapshot(qLowStock, (snapshot) => {
       const lowStock = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
       setLowStockProducts(lowStock);
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeProducts();
      unsubscribeLowStock();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Dashboard</h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">
              Penjualan Hari Ini
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {dailySales.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pendapatan hari ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Penerimaan Kas Hari Ini</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {cashBalance.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              Total penerimaan tunai hari ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Stok Menipis</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Produk dengan stok di bawah 10
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Total Produk</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Jumlah jenis produk
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Penjualan 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <WeeklySalesChart data={weeklySales} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Stok Produk Menipis</CardTitle>
            <CardDescription>
              Produk dengan jumlah stok kurang dari 10 unit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.category}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{product.stock}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
