'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RefreshCcw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';


export default function SalesReturnsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Retur Penjualan (Non-POS)</h1>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Proses Pengembalian Barang</CardTitle>
          <CardDescription>Cari invoice penjualan berdasarkan nomornya untuk memulai proses retur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2 max-w-md">
            <Input id="invoice-id" placeholder="Masukkan Nomor Invoice" />
            <Button>
                <Search className="mr-2 h-4 w-4"/> Cari Invoice
            </Button>
          </div>
          
          <div className="border rounded-lg p-4 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold font-headline">Detail Invoice: INV-001</h3>
                <p className="text-sm text-muted-foreground">
                    Pelanggan: Budi Santoso. Pilih produk dan jumlah yang akan diretur.
                </p>
              </div>
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Jumlah Beli</TableHead>
                      <TableHead>Jumlah Retur</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead className="text-right">Subtotal Retur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell>Susu UHT Full Cream 1L</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell><Input type="number" defaultValue="2" className="w-20" /></TableCell>
                      <TableCell><Input placeholder="Kemasan rusak" /></TableCell>
                      <TableCell className="text-right">Rp 36.000</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center font-bold text-lg pt-4 border-t">
                  <span>Total Pengembalian Dana/Kredit</span>
                  <span className="text-primary">Rp 36.000</span>
              </div>
          </div>
        </CardContent>
         <CardFooter className="flex justify-end">
          <Button>
            <RefreshCcw className="mr-2 h-4 w-4" /> Proses Retur
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
