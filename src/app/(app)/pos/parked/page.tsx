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
import { Trash2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const mockParked = [
  { id: 'PARK001', time: '10:15:30', items: 3, total: 150000, note: 'Pelanggan ambil uang' },
  { id: 'PARK002', time: '11:02:11', items: 1, total: 25000, note: '' },
  { id: 'PARK003', time: '11:25:40', items: 5, total: 88000, note: 'Tunggu teman' },
];

export default function ParkedTransactionsPage() {
    const router = useRouter();

  const handleResume = () => {
    // In a real app, you would load the parked cart state
    router.push('/pos');
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">
        Transaksi Terparkir
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Transaksi Tersimpan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Parkir</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockParked.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.id}</TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell>{item.note || '-'}</TableCell>
                    <TableCell>{item.items}</TableCell>
                    <TableCell className="font-medium">Rp {item.total.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                        <Button onClick={handleResume}>
                            Lanjutkan <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                      </div>
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
