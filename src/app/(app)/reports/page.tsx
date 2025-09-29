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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer
} from 'recharts';
import { ChartTooltip, ChartTooltipContent, ChartContainer } from "@/components/ui/chart";
import { mockTransactions, mockTopProducts, mockMonthlyRevenue } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export default function ReportsPage() {
    const { toast } = useToast();
    
    const handleExport = () => {
        toast({
            title: "Fitur Dalam Pengembangan",
            description: "Ekspor laporan ke PDF akan segera tersedia."
        })
    }
  const dailySales = mockTransactions.filter(tx => new Date(tx.date).toDateString() === new Date().toDateString());
  const totalDailySales = dailySales.reduce((sum, tx) => sum + tx.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan</h1>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Ekspor ke PDF
        </Button>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
          <TabsTrigger value="daily">Penjualan Harian</TabsTrigger>
          <TabsTrigger value="top-products">Produk Terlaris</TabsTrigger>
          <TabsTrigger value="monthly">Pendapatan Bulanan</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Laporan Penjualan Harian</CardTitle>
              <CardDescription>
                Total penjualan hari ini: <span className="font-bold text-primary">Rp {totalDailySales.toLocaleString('id-ID')}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>ID Transaksi</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySales.map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell>{new Date(tx.date).toLocaleTimeString('id-ID')}</TableCell>
                        <TableCell className="font-mono">{tx.id}</TableCell>
                        <TableCell>{tx.paymentMethod}</TableCell>
                        <TableCell className="text-right">Rp {tx.total.toLocaleString('id-ID')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="top-products">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Laporan Produk Terlaris</CardTitle>
              <CardDescription>Produk yang paling banyak terjual.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peringkat</TableHead>
                      <TableHead>Nama Produk</TableHead>
                      <TableHead className="text-right">Jumlah Terjual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTopProducts.sort((a,b) => b.sold - a.sold).map((product, index) => (
                      <TableRow key={product.name}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right font-bold">{product.sold}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Ringkasan Pendapatan Bulanan</CardTitle>
              <CardDescription>Grafik pendapatan selama beberapa bulan terakhir.</CardDescription>
            </CardHeader>
            <CardContent className="pl-0 sm:pl-2">
              <ChartContainer config={{}} className="min-h-[250px] sm:min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={mockMonthlyRevenue}>
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `Rp${Number(value) / 1000000}jt`}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
