'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ImportSalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Impor Penjualan</h1>
      <Card className="max-w-2xl mx-auto w-full">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><FileSpreadsheet /> Impor Data Penjualan</CardTitle>
          <CardDescription>
            Impor data penjualan massal dari file CSV atau Excel, misalnya dari laporan marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="p-4 bg-primary/10 border-l-4 border-primary text-primary-foreground rounded-r-lg">
                <div className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    <p className="font-bold">Unduh Template Terlebih Dahulu</p>
                </div>
                <p className="text-sm mt-1">
                    Pastikan file yang akan diunggah sesuai dengan format template yang kami sediakan untuk menghindari error.
                </p>
                 <Button variant="link" className="p-0 h-auto text-primary font-bold">Unduh Template CSV</Button>
            </div>

           <div className="space-y-2">
            <Label htmlFor="marketplace">Sumber Marketplace (Opsional)</Label>
            <Select>
              <SelectTrigger id="marketplace">
                <SelectValue placeholder="Pilih marketplace jika ada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tokopedia">Tokopedia</SelectItem>
                <SelectItem value="shopee">Shopee</SelectItem>
                <SelectItem value="tiktok-shop">Tiktok Shop</SelectItem>
                <SelectItem value="lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sales-file">Pilih File untuk Diunggah</Label>
            <Input id="sales-file" type="file" />
            <p className="text-xs text-muted-foreground">
                Hanya file .csv dan .xlsx yang didukung.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4"/> Mulai Proses Impor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
