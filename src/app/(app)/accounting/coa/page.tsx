'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FilePlus, FileUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const mockCoa = [
  { code: '1-10000', name: 'Kas', type: 'Aset Lancar' },
  { code: '1-10100', name: 'Bank BCA', type: 'Aset Lancar' },
  { code: '1-12000', name: 'Piutang Usaha', type: 'Aset Lancar' },
  { code: '1-21000', name: 'Persediaan Barang', type: 'Aset Lancar' },
  { code: '2-10000', name: 'Utang Usaha', type: 'Kewajiban' },
  { code: '4-10000', name: 'Pendapatan Penjualan', type: 'Pendapatan' },
  { code: '5-10000', name: 'Harga Pokok Penjualan', type: 'Beban Pokok Penjualan' },
  { code: '6-10100', name: 'Beban Gaji', type: 'Beban Operasional' },
  { code: '6-10200', name: 'Beban Sewa', type: 'Beban Operasional' },
];

export default function ChartOfAccountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Bagan Akun (Chart of Accounts)
        </h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileUp className="mr-2 h-4 w-4" /> Impor
          </Button>
          <Button>
            <FilePlus className="mr-2 h-4 w-4" /> Tambah Akun
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Akun</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Tipe Akun</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCoa.map((account) => (
                  <TableRow key={account.code}>
                    <TableCell className="font-mono">{account.code}</TableCell>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{account.type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
