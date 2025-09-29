'use client';

import React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';

const mockLedger = [
  { date: '2024-07-28', ref: 'TRX001', desc: 'Penjualan Tunai', debit: 105000, credit: 0, balance: 105000 },
  { date: '2024-07-28', ref: 'CSH-IN-01', desc: 'Setoran Modal', debit: 5000000, credit: 0, balance: 5105000 },
  { date: '2024-07-27', ref: 'CSH-OUT-05', desc: 'Bayar Listrik', debit: 0, credit: 500000, balance: 4605000 },
];

export default function GeneralLedgerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Buku Besar (General Ledger)
        </h1>
         <div className="flex items-center gap-2">
            <DateRangePicker />
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Ekspor
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Detail Transaksi Akun</CardTitle>
          <CardDescription>
            Pilih akun untuk melihat seluruh riwayat transaksi yang memengaruhinya.
          </CardDescription>
          <div className="pt-4">
             <Select>
              <SelectTrigger id="account" className="max-w-md">
                <SelectValue placeholder="Pilih Akun..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10000">1-10000 - Kas</SelectItem>
                <SelectItem value="1-10100">1-10100 - Bank BCA</SelectItem>
                <SelectItem value="4-10000">4-10000 - Pendapatan Penjualan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Ref</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLedger.map((tx, index) => (
                  <TableRow key={index}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell className="font-mono">{tx.ref}</TableCell>
                    <TableCell>{tx.desc}</TableCell>
                    <TableCell className="text-right">
                      {tx.debit > 0 ? tx.debit.toLocaleString('id-ID') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.credit > 0 ? tx.credit.toLocaleString('id-ID') : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {tx.balance.toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
