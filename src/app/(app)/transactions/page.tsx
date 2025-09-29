'use client';

import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { mockTransactions, mockProducts } from '@/lib/data';
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

export default function TransactionsPage() {
  const [date, setDate] = useState<DateRange | undefined>();

  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter(tx => {
      if (!date || (!date.from && !date.to)) return true;
      const txDate = new Date(tx.date);
      if (date.from && !date.to) return txDate >= date.from;
      if (date.from && date.to) return txDate >= date.from && txDate <= date.to;
      return true;
    }).sort((a,b) => b.date.getTime() - a.date.getTime());
  }, [date]);

  const totalSales = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
  }, [filteredTransactions]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold">Riwayat Transaksi</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-[300px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y', { locale: id })} -{' '}
                    {format(date.to, 'LLL dd, y', { locale: id })}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y', { locale: id })
                )
              ) : (
                <span>Pilih tanggal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Semua Transaksi</CardTitle>
                    <CardDescription>Total penjualan untuk periode yang dipilih.</CardDescription>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Penjualan</p>
                    <p className="text-2xl font-bold">Rp {totalSales.toLocaleString('id-ID')}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {filteredTransactions.map(tx => (
              <AccordionItem value={tx.id} key={tx.id}>
                <AccordionTrigger>
                  <div className="flex justify-between w-full pr-4">
                    <div className="text-left">
                      <p className="font-semibold">{tx.id}</p>
                      <p className="text-sm text-muted-foreground">{format(tx.date, "eeee, dd MMMM yyyy 'pukul' HH:mm", { locale: id })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant={tx.paymentMethod === 'Tunai' ? 'default' : 'secondary'} className="hidden sm:flex items-center gap-1">
                            <Wallet size={12}/>{tx.paymentMethod}
                        </Badge>
                        <p className="font-bold text-lg text-primary">Rp {tx.total.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Harga Satuan</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tx.items.map(item => {
                        const product = mockProducts.find(p => p.id === item.productId);
                        return (
                          <TableRow key={item.productId}>
                            <TableCell>{product?.name || 'Produk tidak ditemukan'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>Rp {item.price.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-right">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
