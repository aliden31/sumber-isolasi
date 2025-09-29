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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

const mockValuation = [
    { product: 'Kopi Arabika', stock: 48, cost: 40000, value: 1920000 },
    { product: 'Roti Gandum', stock: 120, cost: 18000, value: 2160000 },
    { product: 'Susu UHT Full Cream 1L', stock: 80, cost: 15000, value: 1200000 },
];

const totalValue = mockValuation.reduce((sum, item) => sum + item.value, 0);

export default function StockReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Stok</h1>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Ekspor ke PDF
        </Button>
      </div>

      <Tabs defaultValue="valuation" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto sm:h-10">
          <TabsTrigger value="valuation">Valuasi Persediaan</TabsTrigger>
          <TabsTrigger value="movement">Kartu Stok</TabsTrigger>
        </TabsList>
        <TabsContent value="valuation">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Laporan Valuasi Persediaan</CardTitle>
              <CardDescription>
                Total nilai persediaan saat ini:{' '}
                <span className="font-bold text-primary">Rp {totalValue.toLocaleString('id-ID')}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Harga Pokok Rata-rata</TableHead>
                      <TableHead className="text-right">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockValuation.map(item => (
                      <TableRow key={item.product}>
                        <TableCell>{item.product}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell>Rp {item.cost.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right">Rp {item.value.toLocaleString('id-ID')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="movement">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Laporan Kartu Stok</CardTitle>
              <CardDescription>Pilih produk untuk melihat pergerakan stoknya.</CardDescription>
               <div className="pt-2">
                <Input placeholder="Cari produk..." className="max-w-sm" />
              </div>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-10">
                    <p>Silakan pilih produk untuk melihat kartu stoknya.</p>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
