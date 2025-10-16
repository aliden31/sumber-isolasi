
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Database, Loader2 } from 'lucide-react';
import React, { useTransition } from 'react';
import { handleSeedAll } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const features = [
    "Bagan Akun (COA) Standar PSAK",
    "Data Contoh Pelanggan",
    "Data Contoh Pemasok",
    "Pemetaan Akun Otomatis",
]

export default function SetupPage() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleStart = () => {
        startTransition(async () => {
            const result = await handleSeedAll();
            if (result.error) {
                toast({
                    title: 'Gagal Memulai Pengaturan',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Pengaturan Awal Berhasil!',
                    description: 'Data standar telah berhasil diimpor. Anda akan diarahkan ke dashboard.',
                });
                router.push('/dashboard');
            }
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-center">Selamat Datang di Toko Kilat!</CardTitle>
                    <CardDescription className="text-center">
                        Satu langkah lagi untuk memulai. Untuk memastikan pembukuan sesuai Standar Akuntansi Keuangan (PSAK),
                        mari kita siapkan data dasar yang diperlukan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg border">
                        <h3 className="font-semibold mb-2">Data yang Akan Diimpor:</h3>
                        <ul className="space-y-2">
                           {features.map(feature => (
                             <li key={feature} className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-green-500"/>
                                <span>{feature}</span>
                            </li>
                           ))}
                        </ul>
                    </div>
                     <p className="text-xs text-muted-foreground text-center">
                        Anda dapat mengubah atau menghapus data ini nanti melalui menu Pengaturan.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" size="lg" onClick={handleStart} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Database className="mr-2 h-5 w-5" />
                        )}
                        Mulai Pengaturan & Impor Data
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
