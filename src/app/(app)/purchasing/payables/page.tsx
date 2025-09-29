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
import { MoreHorizontal, Trash2, Edit, FileText, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const mockPayables = [
    { id: 'INV-SUP-001', supplier: 'PT Pangan Sejahtera', date: '2024-07-20', due: '2024-08-19', total: 5500000, status: 'Belum Lunas' },
    { id: 'INV-SUP-002', supplier: 'CV Sumber Roti', date: '2024-07-15', due: '2024-08-14', total: 2300000, status: 'Lunas' },
    { id: 'INV-SUP-003', supplier: 'Toko Bahan Kue Abadi', date: '2024-06-25', due: '2024-07-25', total: 850000, status: 'Jatuh Tempo' },
];

export default function AccountsPayablePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">
        Utang Usaha (Accounts Payable)
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Utang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Faktur</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPayables.map((payable) => (
                  <TableRow key={payable.id}>
                    <TableCell className="font-mono">{payable.id}</TableCell>
                    <TableCell>{payable.supplier}</TableCell>
                    <TableCell>{payable.due}</TableCell>
                    <TableCell>Rp {payable.total.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                        <Badge variant={
                            payable.status === 'Lunas' ? 'secondary' : payable.status === 'Jatuh Tempo' ? 'destructive' : 'default'
                        }>{payable.status}</Badge>
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
                            <CreditCard className="mr-2 h-4 w-4" /> Catat Pembayaran
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" /> Lihat Faktur
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
