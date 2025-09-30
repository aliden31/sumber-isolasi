
'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, BookLock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { performPeriodClosing } from './actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('id-ID', { month: 'long' });
}

export default function PeriodClosingPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth()); // Default to last month
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // If current month is January, default to December of last year.
    React.useEffect(() => {
      const today = new Date();
      if (today.getMonth() === 0) { // January
        setMonth(12);
        setYear(today.getFullYear() - 1);
      } else {
        setMonth(today.getMonth());
      }
    }, []);

    const handleClosing = () => {
        if (month === 0) {
            toast({
                title: 'Bulan tidak valid',
                description: 'Silakan pilih bulan yang valid.',
                variant: 'destructive',
            });
            return;
        }

        startTransition(async () => {
            const result = await performPeriodClosing({ year, month });
            if (result.error) {
                toast({
                    title: 'Gagal Melakukan Tutup Buku',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Tutup Buku Berhasil!',
                    description: `Jurnal penutup untuk periode ${getMonthName(month)} ${year} telah berhasil dibuat.`,
                });
            }
        });
    };
    
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl md:text-3xl font-headline font-bold">Tutup Buku Periode</h1>
            <Card className="max-w-xl mx-auto w-full">
                <CardHeader>
                    <CardTitle>Proses Tutup Buku</CardTitle>
                    <CardDescription>
                        Fitur ini akan membuat jurnal penutup untuk semua akun pendapatan dan beban pada periode yang dipilih, lalu mentransfer laba bersih ke akun Laba Ditahan.
                        <br/><strong className="text-destructive">Peringatan:</strong> Proses ini tidak dapat diurungkan. Pastikan semua transaksi pada periode tersebut sudah final.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="month">Bulan</Label>
                            <Select value={String(month)} onValueChange={(val) => setMonth(Number(val))}>
                                <SelectTrigger id="month">
                                    <SelectValue placeholder="Pilih bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <SelectItem key={m} value={String(m)}>
                                            {getMonthName(m)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="year">Tahun</Label>
                             <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
                                <SelectTrigger id="year">
                                    <SelectValue placeholder="Pilih tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                        <SelectItem key={y} value={String(y)}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={month === 0}>
                                <BookLock className="mr-2 h-4 w-4" /> Mulai Proses Tutup Buku
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Tutup Buku</AlertDialogTitle>
                            <AlertDialogDescription>
                                Anda akan melakukan tutup buku untuk periode <strong>{getMonthName(month)} {year}</strong>.
                                Tindakan ini bersifat permanen dan akan membuat jurnal penutup. Pastikan semua data sudah benar. Lanjutkan?
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClosing} disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ya, Lanjutkan'}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    );
}
