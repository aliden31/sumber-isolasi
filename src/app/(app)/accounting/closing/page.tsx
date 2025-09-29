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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

export default function PeriodClosingPage() {
  const { toast } = useToast();

  const handleClosePeriod = () => {
    toast({
      title: 'Proses Tutup Buku Dimulai',
      description: 'Sistem akan memproses dan mengunci periode yang dipilih.',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">
        Tutup Buku Periode
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Finalisasi Laporan Keuangan</CardTitle>
          <CardDescription>
            Lakukan proses tutup buku bulanan atau tahunan untuk finalisasi
            laporan keuangan. Setelah ditutup, transaksi pada periode tersebut
            tidak dapat diubah.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 max-w-md">
          <div className="space-y-2">
            <label htmlFor="period-type" className="text-sm font-medium">
              Tipe Periode
            </label>
            <Select defaultValue="monthly">
              <SelectTrigger id="period-type">
                <SelectValue placeholder="Pilih tipe periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="yearly">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="period" className="text-sm font-medium">
              Pilih Periode
            </label>
            <Select>
              <SelectTrigger id="period">
                <SelectValue placeholder="Pilih periode yang akan ditutup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-06">Juni 2024</SelectItem>
                <SelectItem value="2024-05">Mei 2024</SelectItem>
                <SelectItem value="2024-04">April 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 bg-destructive/10 border-l-4 border-destructive text-destructive-foreground rounded-r-lg">
            <p className="font-bold">Peringatan Penting</p>
            <p className="text-sm">
              Proses ini tidak dapat dibatalkan. Pastikan semua transaksi pada
              periode yang dipilih sudah benar dan tervalidasi.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={handleClosePeriod}
              className="w-full sm:w-auto"
            >
              <Lock className="mr-2 h-4 w-4" />
              Tutup Periode
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
