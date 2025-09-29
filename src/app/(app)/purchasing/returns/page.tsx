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


export default function PurchaseReturnsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Retur Pembelian</h1>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Proses Pengembalian Barang ke Pemasok</CardTitle>
          <CardDescription>Cari GRN (Good Receipt Note) berdasarkan nomornya untuk memulai proses retur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2 max-w-md">
            <Input id="grn-id" placeholder="Masukkan Nomor GRN" />
            <Button>
                <Search className="mr-2 h-4 w-4"/> Cari GRN
            </Button>
          </div>
          
          <div className="border rounded-lg p-4 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold font-headline">Detail Penerimaan: GRN-2024-07-001</h3>
                <p className="text-sm text-muted-foreground">
                    Pilih produk dan jumlah yang akan dikembalikan.
                </p>
              </div>
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Jumlah Diterima</TableHead>
                      <TableHead>Jumlah Retur</TableHead>
                      <TableHead>Alasan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell>Kopi Arabika</TableCell>
                      <TableCell>50</TableCell>
                      <TableCell><Input type="number" defaultValue="5" className="w-20" /></TableCell>
                      <TableCell><Input placeholder="Kemasan rusak" /></TableCell>
                    </TableRow>
                     <TableRow>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell>Teh Melati</TableCell>
                      <TableCell>20</TableCell>
                      <TableCell><Input type="number" defaultValue="0" className="w-20" /></TableCell>
                      <TableCell><Input /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
          </div>
        </CardContent>
         <CardFooter className="flex justify-end">
          <Button>
            <RefreshCcw className="mr-2 h-4 w-4" /> Proses Retur Pembelian
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
