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
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';


const mockBalanceSheet = {
    assets: [
        { name: 'Kas dan Setara Kas', amount: 15000000 },
        { name: 'Piutang Usaha', amount: 5000000 },
        { name: 'Persediaan', amount: 12000000 },
    ],
    liabilities: [
        { name: 'Utang Usaha', amount: 8000000 },
    ],
    equity: [
        { name: 'Modal Disetor', amount: 20000000 },
        { name: 'Laba Ditahan', amount: 4000000 },
    ]
}

export default function FinancialReportsPage() {

  const totalAssets = mockBalanceSheet.assets.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = mockBalanceSheet.liabilities.reduce((sum, item) => sum + item.amount, 0);
  const totalEquity = mockBalanceSheet.equity.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Keuangan</h1>
        <div className="flex items-center gap-2">
            <DatePicker placeholder="Pilih Periode" />
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Ekspor ke PDF
            </Button>
        </div>
      </div>

      <Tabs defaultValue="balance-sheet" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
          <TabsTrigger value="balance-sheet">Neraca</TabsTrigger>
          <TabsTrigger value="income-statement">Laba Rugi</TabsTrigger>
          <TabsTrigger value="cash-flow">Arus Kas</TabsTrigger>
        </TabsList>
        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Laporan Posisi Keuangan (Neraca)</CardTitle>
              <CardDescription>
                Per 31 Juli 2024
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Aset */}
                <div>
                    <h3 className="font-bold text-lg mb-2 border-b pb-2 font-headline">Aset</h3>
                    <Table>
                        <TableBody>
                            {mockBalanceSheet.assets.map(item => (
                                <TableRow key={item.name}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right">Rp {item.amount.toLocaleString('id-ID')}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell>Total Aset</TableCell>
                                <TableCell className="text-right">Rp {totalAssets.toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                {/* Liabilitas & Ekuitas */}
                <div>
                    <h3 className="font-bold text-lg mb-2 border-b pb-2 font-headline">Liabilitas dan Ekuitas</h3>
                    <p className="font-semibold mt-4">Liabilitas</p>
                    <Table>
                        <TableBody>
                            {mockBalanceSheet.liabilities.map(item => (
                                <TableRow key={item.name}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right">Rp {item.amount.toLocaleString('id-ID')}</TableCell>
                                </TableRow>
                            ))}
                             <TableRow className="font-bold bg-muted/50">
                                <TableCell>Total Liabilitas</TableCell>
                                <TableCell className="text-right">Rp {totalLiabilities.toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <p className="font-semibold mt-4">Ekuitas</p>
                     <Table>
                        <TableBody>
                            {mockBalanceSheet.equity.map(item => (
                                <TableRow key={item.name}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right">Rp {item.amount.toLocaleString('id-ID')}</TableCell>
                                </TableRow>
                            ))}
                             <TableRow className="font-bold bg-muted/50">
                                <TableCell>Total Ekuitas</TableCell>
                                <TableCell className="text-right">Rp {totalEquity.toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                     <Table className="mt-4">
                        <TableBody>
                             <TableRow className="font-bold bg-primary/10">
                                <TableCell>Total Liabilitas dan Ekuitas</TableCell>
                                <TableCell className="text-right">Rp {(totalLiabilities + totalEquity).toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="income-statement">
             <Card className="flex items-center justify-center min-h-[400px]">
                 <CardContent>
                     <p className="text-muted-foreground">Laporan Laba Rugi akan ditampilkan di sini.</p>
                 </CardContent>
             </Card>
        </TabsContent>
         <TabsContent value="cash-flow">
             <Card className="flex items-center justify-center min-h-[400px]">
                 <CardContent>
                     <p className="text-muted-foreground">Laporan Arus Kas akan ditampilkan di sini.</p>
                 </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
