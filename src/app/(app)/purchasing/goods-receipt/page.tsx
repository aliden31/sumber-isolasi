'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, PackageCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function GoodsReceiptPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Penerimaan Barang (GRN)</h1>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Buat Good Receipt Note (GRN)</CardTitle>
          <CardDescription>Cari Pesanan Pembelian (PO) untuk mencatat barang yang diterima.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2 max-w-md">
            <Input id="po-number" placeholder="Masukkan Nomor PO" />
            <Button>
                <Search className="mr-2 h-4 w-4"/> Cari PO
            </Button>
          </div>
          
          <div className="border rounded-lg p-4 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold font-headline">Detail PO: PO-2024-07-001</h3>
                <p className="text-sm text-muted-foreground">
                    Supplier: PT Pangan Sejahtera. Masukkan jumlah yang diterima.
                </p>
              </div>
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Jumlah Dipesan</TableHead>
                      <TableHead>Jumlah Diterima</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Kopi Arabika</TableCell>
                      <TableCell>50</TableCell>
                      <TableCell><Input type="number" defaultValue="50" className="w-24" /></TableCell>
                      <TableCell><Input placeholder="Kondisi baik" /></TableCell>
                    </TableRow>
                     <TableRow>
                      <TableCell>Teh Melati</TableCell>
                      <TableCell>20</TableCell>
                      <TableCell><Input type="number" defaultValue="20" className="w-24" /></TableCell>
                      <TableCell><Input /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
          </div>
        </CardContent>
         <CardFooter className="flex justify-end">
          <Button>
            <PackageCheck className="mr-2 h-4 w-4" /> Konfirmasi Penerimaan
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
