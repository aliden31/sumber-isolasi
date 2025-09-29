'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bell, Package, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const mockNotifications = [
  { product: 'Teh Melati', stock: 7, minStock: 10, status: 'Stok Menipis' },
  { product: 'Jus Jeruk 1L', stock: 4, minStock: 5, status: 'Stok Kritis' },
];

export default function StockNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Notifikasi Stok
        </h1>
        <Button>
          Atur Batas Minimum Stok
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <AlertTriangle className="text-destructive" />
            Peringatan Stok Rendah
          </CardTitle>
          <CardDescription>
            Produk berikut telah mencapai atau berada di bawah batas stok minimum yang telah Anda tetapkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Stok Saat Ini</TableHead>
                  <TableHead>Stok Minimum</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockNotifications.map((item) => (
                  <TableRow key={item.product}>
                    <TableCell className="font-medium">{item.product}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>{item.minStock}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{item.status}</Badge>
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
