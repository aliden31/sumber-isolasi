'use client';

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
import { Download, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function FinancialReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Keuangan</h1>
        <div className="flex items-center gap-2">
            <Select defaultValue="2024-07">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-07">Juli 2024</SelectItem>
                <SelectItem value="2024-06">Juni 2024</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Ekspor ke PDF
            </Button>
        </div>
      </div>

      <Tabs defaultValue="profit-loss" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
          <TabsTrigger value="profit-loss">Laba Rugi</TabsTrigger>
          <TabsTrigger value="balance-sheet">Neraca</TabsTrigger>
          <TabsTrigger value="cash-flow">Arus Kas</TabsTrigger>
        </TabsList>
        <TabsContent value="profit-loss">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Laporan Laba Rugi</CardTitle>
              <CardDescription>Periode: Juli 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center py-20 text-muted-foreground">
                    <p>Fungsionalitas Laporan Laba Rugi sedang dalam pengembangan.</p>
                    <p className="text-sm">Data akan ditarik dari jurnal umum dan buku besar.</p>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="balance-sheet">
            <Card>
            <CardHeader>
              <CardTitle className="font-headline">Laporan Neraca</CardTitle>
              <CardDescription>Per: 31 Juli 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center py-20 text-muted-foreground">
                    <p>Fungsionalitas Laporan Neraca sedang dalam pengembangan.</p>
                    <p className="text-sm">Data akan ditarik dari saldo akhir setiap akun.</p>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="cash-flow">
            <Card>
            <CardHeader>
              <CardTitle className="font-headline">Laporan Arus Kas</CardTitle>
              <CardDescription>Periode: Juli 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center py-20 text-muted-foreground">
                    <p>Fungsionalitas Laporan Arus Kas sedang dalam pengembangan.</p>
                    <p className="text-sm">Data akan dianalisis dari pergerakan akun kas dan bank.</p>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
