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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const mockSales = [
    { inv: 'INV-001', date: '2024-07-28', customer: 'Budi Santoso', total: 1250000 },
    { inv: 'INV-002', date: '2024-07-27', customer: 'Pelanggan Umum', total: 75000 },
    { inv: 'INV-003', date: '2024-07-26', customer: 'Citra Lestari', total: 300000 },
];

const totalSales = mockSales.reduce((sum, item) => sum + item.total, 0);

export default function SalesReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Penjualan</h1>
         <div className="flex items-center gap-2">
            <DateRangePicker />
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Ekspor ke PDF
            </Button>
        </div>
      </div>
      
       <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto sm:h-10">
          <TabsTrigger value="summary">Ringkasan Penjualan</TabsTrigger>
          <TabsTrigger value="best-seller">Produk Terlaris</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Ringkasan Penjualan</CardTitle>
              <CardDescription>
                Total penjualan untuk periode yang dipilih:{' '}
                <span className="font-bold text-primary">Rp {totalSales.toLocaleString('id-ID')}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Invoice</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSales.map(sale => (
                      <TableRow key={sale.inv}>
                        <TableCell className="font-mono">{sale.inv}</TableCell>
                        <TableCell>{sale.date}</TableCell>
                        <TableCell>{sale.customer}</TableCell>
                        <TableCell className="text-right">Rp {sale.total.toLocaleString('id-ID')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="best-seller">
           <Card>
            <CardHeader>
              <CardTitle className="font-headline">Laporan Produk Terlaris</CardTitle>
              <CardDescription>
                Produk yang paling banyak terjual pada periode yang dipilih.
              </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center py-20 text-muted-foreground">
                    <p>Fungsionalitas Laporan Produk Terlaris sedang dalam pengembangan.</p>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
