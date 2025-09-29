
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TransactionsPage() {
  const [date, setDate] = useState<DateRange | undefined>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const transactionsCol = collection(db, "transactions");
    
    let q = query(transactionsCol, orderBy("date", "desc"));

    if (date?.from) {
        const from = Timestamp.fromDate(date.from);
        let to;

        if (date.to) {
            // Adjust to include the whole 'to' day
            const toDayEnd = new Date(date.to);
            toDayEnd.setHours(23, 59, 59, 999);
            to = Timestamp.fromDate(toDayEnd);
        } else {
            // If only 'from' is selected, filter for that day
            const fromDayEnd = new Date(date.from);
            fromDayEnd.setHours(23, 59, 59, 999);
            to = Timestamp.fromDate(fromDayEnd);
        }
        q = query(q, where("date", ">=", from), where("date", "<=", to));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(), // Convert Firestore Timestamp to JS Date
        } as Transaction;
      });
      setTransactions(transactionList);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching transactions: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [date]);

  const totalSales = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.total, 0);
  }, [transactions]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Riwayat Transaksi</h1>
         <DateRangePicker 
            className="w-full sm:w-[300px]" 
            onSelect={setDate}
        />
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                    <CardTitle className="font-headline">Semua Transaksi</CardTitle>
                    <CardDescription>Total penjualan untuk periode yang dipilih.</CardDescription>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-sm text-muted-foreground">Total Penjualan</p>
                    <p className="text-xl sm:text-2xl font-bold">Rp {totalSales.toLocaleString('id-ID')}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {loading ? (
                <div className="text-center py-10">Memuat data transaksi...</div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Tidak ada transaksi pada periode ini.</div>
            ) : (
                transactions.map(tx => (
                <AccordionItem value={tx.id} key={tx.id}>
                    <AccordionTrigger>
                    <div className="flex flex-col sm:flex-row justify-between w-full sm:pr-4 text-left sm:items-center">
                        <div className="mb-2 sm:mb-0">
                        <p className="font-semibold text-sm sm:text-base font-mono">{tx.id}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{format(tx.date, "eeee, dd MMM yyy 'pukul' HH:mm", { locale: id })}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 justify-between">
                            <Badge variant={tx.paymentMethod === 'Tunai' ? 'default' : 'secondary'} className="flex items-center gap-1">
                                <Wallet size={12}/>{tx.paymentMethod}
                            </Badge>
                            <p className="font-bold text-md sm:text-lg text-primary">Rp {tx.total.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent>
                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Produk</TableHead>
                            <TableHead>Jumlah</TableHead>
                            <TableHead>Harga</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tx.items.map((item, index) => (
                            <TableRow key={`${item.productId}-${index}`}>
                                <TableCell>{item.productName || item.productId}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>Rp {item.price.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-right">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                    </AccordionContent>
                </AccordionItem>
                ))
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

// Ensure DateRangePicker component accepts onSelect prop
declare module '@/components/ui/date-range-picker' {
    interface DateRangePickerProps {
        onSelect?: (date?: DateRange) => void;
        className?: string;
    }
}
