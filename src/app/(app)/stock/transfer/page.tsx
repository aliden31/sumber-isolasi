'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Trash2, Save, ArrowRightLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

export default function StockTransferPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Transfer Stok Antar Gudang</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Buat Bukti Transfer Stok</CardTitle>
          <CardDescription>Pindahkan stok barang dari satu lokasi gudang ke gudang lainnya.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Dari Gudang</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Pilih gudang asal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="utama">Gudang Utama</SelectItem>
                  <SelectItem value="toko">Gudang Toko</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-center">
                <ArrowRightLeft className="w-8 h-8 text-muted-foreground"/>
            </div>
            <div className="space-y-2">
              <Label>Ke Gudang</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Pilih gudang tujuan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="utama">Gudang Utama</SelectItem>
                  <SelectItem value="toko">Gudang Toko</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
           <div className="space-y-2">
              <Label>Tanggal Transfer</Label>
              <DatePicker />
            </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Produk</TableHead>
                  <TableHead>Stok Tersedia</TableHead>
                  <TableHead>Jumlah Transfer</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Input placeholder="Pilih produk" />
                  </TableCell>
                  <TableCell>48</TableCell>
                  <TableCell>
                    <Input type="number" placeholder="0" className="w-24"/>
                  </TableCell>
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
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" /> Simpan Bukti Transfer
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
