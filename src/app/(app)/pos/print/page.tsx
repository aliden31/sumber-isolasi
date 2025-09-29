'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Printer } from 'lucide-react';

export default function PrintReceiptPage() {

  const handlePrint = () => {
      // Logic to find and print receipt
      window.print();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Cetak Ulang Struk</h1>
      <Card className="max-w-md mx-auto w-full">
        <CardHeader>
          <CardTitle className="font-headline">Cari Transaksi</CardTitle>
          <CardDescription>
            Masukkan ID Transaksi untuk mencari dan mencetak ulang struk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-id">ID Transaksi</Label>
            <div className="flex gap-2">
                <Input id="transaction-id" placeholder="Contoh: TRX123456789" />
                <Button variant="outline" size="icon">
                    <Search className="h-4 w-4"/>
                </Button>
            </div>
          </div>

          {/* This section would be shown after a transaction is found */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50 mt-6">
              <div className='space-y-1'>
                <h3 className="font-semibold">Hasil Pencarian</h3>
                <div className="text-sm text-muted-foreground">
                    <p>ID: <span className="font-mono">TRX001</span></p>
                    <p>Tanggal: <span className="font-mono">28 Jul 2024, 10:30</span></p>
                    <p>Total: <span className="font-semibold text-primary">Rp 105.000</span></p>
                </div>
              </div>
              <Button className="w-full" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4"/> Cetak Struk
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
