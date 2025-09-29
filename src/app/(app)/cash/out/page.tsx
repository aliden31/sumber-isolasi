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

export default function CashOutPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Kas Keluar</h1>
      <Card className="max-w-3xl mx-auto w-full">
        <CardHeader>
          <CardTitle className="font-headline">Catat Pengeluaran Kas</CardTitle>
          <CardDescription>
            Gunakan form ini untuk mencatat semua pengeluaran kas operasional atau pembelian non-inventaris.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="cash-out-from">Keluar Dari Akun Kas/Bank</Label>
            <Select>
              <SelectTrigger id="cash-out-from">
                <SelectValue placeholder="Pilih akun kas/bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kas">1-10000 - Kas</SelectItem>
                <SelectItem value="bank-bca">1-10100 - Bank BCA</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label htmlFor="cash-out-to">Untuk Akun Beban</Label>
            <Select>
              <SelectTrigger id="cash-out-to">
                <SelectValue placeholder="Pilih akun beban tujuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gaji">6-10100 - Beban Gaji</SelectItem>
                <SelectItem value="sewa">6-10200 - Beban Sewa</SelectItem>
                <SelectItem value="listrik">6-10300 - Beban Listrik & Air</SelectItem>
                <SelectItem value="atk">6-10400 - Beban Alat Tulis Kantor</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah</Label>
              <Input id="amount" type="number" placeholder="Masukkan jumlah pengeluaran" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="transaction-date">Tanggal Transaksi</Label>
               <DatePicker />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" placeholder="Contoh: Pembayaran gaji karyawan bulan Juli" />
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
