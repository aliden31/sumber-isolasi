'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';

const mockPurchases = [
    { po: 'PO-2024-07-001', supplier: 'PT Pangan Sejahtera', date: '2024-07-18', total: 5500000 },
    { po: 'PO-2024-07-002', supplier: 'CV Sumber Roti', date: '2024-07-15', total: 2300000 },
    { po: 'PO-2024-06-005', supplier: 'Toko Bahan Kue Abadi', date: '2024-06-25', total: 850000 },
];

const totalPurchases = mockPurchases.reduce((sum, item) => sum + item.total, 0);

export default function PurchasingReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Pembelian</h1>
         <div className="flex items-center gap-2">
            <DateRangePicker />
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Ekspor ke PDF
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Ringkasan Pembelian</CardTitle>
          <CardDescription>
            Total pembelian untuk periode yang dipilih:{' '}
            <span className="font-bold text-primary">Rp {totalPurchases.toLocaleString('id-ID')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor PO</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPurchases.map(purchase => (
                  <TableRow key={purchase.po}>
                    <TableCell className="font-mono">{purchase.po}</TableCell>
                    <TableCell>{purchase.supplier}</TableCell>
                    <TableCell>{purchase.date}</TableCell>
                    <TableCell className="text-right">Rp {purchase.total.toLocaleString('id-ID')}</TableCell>
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
