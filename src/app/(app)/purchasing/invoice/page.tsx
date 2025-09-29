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
import { FilePlus, MoreHorizontal, Trash2, Edit, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const mockInvoices = [
    { id: 'INV-SUP-001', supplier: 'PT Pangan Sejahtera', date: '2024-07-20', due: '2024-08-19', total: 5500000, status: 'Belum Lunas' },
    { id: 'INV-SUP-002', supplier: 'CV Sumber Roti', date: '2024-07-15', due: '2024-08-14', total: 2300000, status: 'Lunas' },
    { id: 'INV-SUP-003', supplier: 'Toko Bahan Kue Abadi', date: '2024-06-25', due: '2024-07-25', total: 850000, status: 'Jatuh Tempo' },
];

export default function SupplierInvoicePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Faktur / Invoice Pemasok
        </h1>
        <Button>
          <FilePlus className="mr-2 h-4 w-4" /> Catat Faktur Baru
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Faktur Masuk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Faktur</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Tgl. Faktur</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.id}</TableCell>
                    <TableCell>{invoice.supplier}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.due}</TableCell>
                    <TableCell>Rp {invoice.total.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                        <Badge variant={
                            invoice.status === 'Lunas' ? 'secondary' : invoice.status === 'Jatuh Tempo' ? 'destructive' : 'default'
                        }>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Buka menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" /> Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
