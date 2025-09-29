'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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

export default function GeneralJournalPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Jurnal Umum</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Buat Entri Jurnal Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="journal-date">Tanggal</Label>
              <DatePicker />
            </div>
            <div className="space-y-2">
              <Label htmlFor="journal-number">No. Referensi</Label>
              <Input id="journal-number" placeholder="Otomatis jika kosong" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" placeholder="Deskripsi transaksi jurnal" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Akun</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Kredit</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Input placeholder="Pilih akun" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" placeholder="0" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" placeholder="0" />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Input placeholder="Pilih akun" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" placeholder="0" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" placeholder="0" />
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
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Baris
          </Button>
          <div className="flex justify-between items-center font-bold text-lg pt-4 border-t">
              <div>Total</div>
              <div className="grid grid-cols-2 gap-4 w-1/2">
                <div>Rp 0</div>
                <div>Rp 0</div>
              </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" /> Simpan Jurnal
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
