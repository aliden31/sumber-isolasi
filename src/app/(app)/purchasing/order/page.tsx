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
import type { PurchaseOrder } from '@/lib/types';

const mockOrders: PurchaseOrder[] = [
    { id: 'PO-2024-07-001', supplier: 'PT Pangan Sejahtera', date: '2024-07-18', total: 5500000, status: 'Terkirim Sebagian', items: [] },
    { id: 'PO-2024-07-002', supplier: 'CV Sumber Roti', date: '2024-07-15', total: 2300000, status: 'Selesai', items: [] },
    { id: 'PO-2024-06-005', supplier: 'Toko Bahan Kue Abadi', date: '2024-06-25', total: 850000, status: 'Menunggu Persetujuan', items: [] },
];

export default function PurchaseOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Pesanan Pembelian (PO)
        </h1>
        <Button>
          <FilePlus className="mr-2 h-4 w-4" /> Buat PO Baru
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar PO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor PO</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.id}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>Rp {order.total.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                        <Badge variant={
                            order.status === 'Selesai' ? 'secondary' : order.status === 'Menunggu Persetujuan' ? 'destructive' : 'default'
                        }>{order.status}</Badge>
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
