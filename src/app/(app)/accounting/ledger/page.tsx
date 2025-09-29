'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';

const mockLedger = [
    { date: '2024-07-28', description: 'Penjualan Tunai TRX001', ref: 'TRX001', debit: 105000, credit: 0, balance: 105000 },
    { date: '2024-07-28', description: 'Pembayaran Gaji Karyawan', ref: 'GJ005', debit: 0, credit: 5000000, balance: -4895000 },
    { date: '2024-07-27', description: 'Penjualan Tunai TRX003', ref: 'TRX003', debit: 140000, credit: 0, balance: -4755000 },
];

export default function GeneralLedgerPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Buku Besar</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Filter Laporan</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
             <Select>
              <SelectTrigger id="account">
                <SelectValue placeholder="Pilih Akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10000">1-10000 - Kas</SelectItem>
                <SelectItem value="1-10100">1-10100 - Bank BCA</SelectItem>
                <SelectItem value="1-12000">1-12000 - Piutang Usaha</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker />
            <Button>Tampilkan Laporan</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='py-6'>
            <h2 className="text-xl font-bold font-headline">Buku Besar: 1-10000 - Kas</h2>
            <p className="text-muted-foreground">Periode: 1 Jul 2024 - 31 Jul 2024</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={5}>Saldo Awal</TableCell>
                    <TableCell className="text-right">Rp 0</TableCell>
                </TableRow>
                {mockLedger.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.ref}</TableCell>
                    <TableCell className="text-right">Rp {entry.debit.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">Rp {entry.credit.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">Rp {entry.balance.toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))}
                 <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={5}>Saldo Akhir</TableCell>
                    <TableCell className="text-right">Rp -4.755.000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
