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
import { Save, ArrowRightLeft } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';

export default function CashTransferPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Transfer Antar Kas/Bank</h1>
      <Card className="max-w-3xl mx-auto w-full">
        <CardHeader>
          <CardTitle className="font-headline">Catat Perpindahan Dana</CardTitle>
          <CardDescription>
            Form ini digunakan untuk mencatat perpindahan dana antar rekening kas atau bank internal perusahaan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="transfer-from">Transfer Dari</Label>
            <Select>
              <SelectTrigger id="transfer-from">
                <SelectValue placeholder="Pilih akun asal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kas">1-10000 - Kas</SelectItem>
                <SelectItem value="bank-bca">1-10100 - Bank BCA</SelectItem>
                <SelectItem value="bank-mandiri">1-10101 - Bank Mandiri</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-center">
            <ArrowRightLeft className="w-8 h-8 text-muted-foreground"/>
          </div>
           <div className="space-y-2">
            <Label htmlFor="transfer-to">Transfer Ke</Label>
            <Select>
              <SelectTrigger id="transfer-to">
                <SelectValue placeholder="Pilih akun tujuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kas">1-10000 - Kas</SelectItem>
                <SelectItem value="bank-bca">1-10100 - Bank BCA</SelectItem>
                <SelectItem value="bank-mandiri">1-10101 - Bank Mandiri</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah</Label>
              <Input id="amount" type="number" placeholder="Masukkan jumlah yang ditransfer" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="transaction-date">Tanggal Transfer</Label>
               <DatePicker />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" placeholder="Contoh: Transfer dari Bank ke Kas untuk operasional" />
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
