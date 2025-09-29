'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ManualSalesInputPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Input Penjualan Manual</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Buat Transaksi Penjualan Baru</CardTitle>
          <CardDescription>Catat transaksi penjualan yang terjadi di luar sistem kasir (misalnya, penjualan korporat atau online).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sales-date">Tanggal</Label>
              <DatePicker />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">Pelanggan</Label>
              <Select>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Pilih pelanggan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUST001">Budi Santoso</SelectItem>
                  <SelectItem value="CUST002">Citra Lestari</SelectItem>
                  <SelectItem value="walk-in">Pelanggan Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sales-number">No. Invoice</Label>
              <Input id="sales-number" placeholder="Otomatis jika kosong" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Produk</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Input placeholder="Pilih produk" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" placeholder="0" className="w-24"/>
                  </TableCell>
                  <TableCell>
                    <Input type="number" placeholder="0" />
                  </TableCell>
                   <TableCell className="font-medium">Rp 0</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
           <Button variant="outline" className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Produk
          </Button>
          <div className="grid md:grid-cols-2 gap-8 pt-4 border-t">
              <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea id="notes" placeholder="Catatan internal untuk transaksi ini"/>
              </div>
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <span>Subtotal</span>
                      <span className="font-medium">Rp 0</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span>Pajak (11%)</span>
                      <span className="font-medium">Rp 0</span>
                  </div>
                   <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span className="font-medium">Rp 0</span>
                  </div>
              </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" /> Simpan Penjualan
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
