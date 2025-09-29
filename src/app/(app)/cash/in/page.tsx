'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';

export default function CashInPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Kas Masuk</h1>
      <Card className="max-w-3xl mx-auto w-full">
        <CardHeader>
          <CardTitle className="font-headline">Catat Pemasukan Kas</CardTitle>
          <CardDescription>
            Gunakan form ini untuk mencatat semua pemasukan kas di luar dari transaksi penjualan utama (POS atau Sales).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="cash-in-from">Masuk Dari Akun</Label>
            <Select>
              <SelectTrigger id="cash-in-from">
                <SelectValue placeholder="Pilih akun asal dana" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modal">3-10000 - Modal Disetor</SelectItem>
                <SelectItem value="piutang">1-12000 - Piutang Lain-lain</SelectItem>
                <SelectItem value="pendapatan">8-10000 - Pendapatan Lain-lain</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label htmlFor="cash-in-to">Masuk Ke Akun</Label>
            <Select>
              <SelectTrigger id="cash-in-to">
                <SelectValue placeholder="Pilih akun kas/bank tujuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kas">1-10000 - Kas</SelectItem>
                <SelectItem value="bank-bca">1-10100 - Bank BCA</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah</Label>
              <Input id="amount" type="number" placeholder="Masukkan jumlah pemasukan" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="transaction-date">Tanggal Transaksi</Label>
               <DatePicker />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" placeholder="Contoh: Setoran modal awal dari pemilik" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" /> Simpan Transaksi
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
