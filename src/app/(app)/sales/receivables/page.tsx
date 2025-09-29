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
import { MoreHorizontal, FileText, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const mockReceivables = [
    { id: 'INV-001', customer: 'Budi Santoso', date: '2024-07-20', due: '2024-08-19', total: 1250000, status: 'Belum Lunas' },
    { id: 'INV-002', customer: 'Citra Lestari', date: '2024-07-15', due: '2024-08-14', total: 750000, status: 'Lunas' },
    { id: 'INV-003', customer: 'Adi Prasetyo', date: '2024-06-25', due: '2024-07-25', total: 300000, status: 'Jatuh Tempo' },
];

export default function AccountsReceivablePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">
        Piutang Usaha (Accounts Receivable)
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Piutang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Invoice</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReceivables.map((receivable) => (
                  <TableRow key={receivable.id}>
                    <TableCell className="font-mono">{receivable.id}</TableCell>
                    <TableCell>{receivable.customer}</TableCell>
                    <TableCell>{receivable.due}</TableCell>
                    <TableCell>Rp {receivable.total.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                        <Badge variant={
                            receivable.status === 'Lunas' ? 'secondary' : receivable.status === 'Jatuh Tempo' ? 'destructive' : 'default'
                        }>{receivable.status}</Badge>
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
                            <FileText className="mr-2 h-4 w-4" /> Lihat Invoice
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
