
'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteAllData, deleteMasterData, deleteTransactionalData, deleteCoaData } from './actions';
import { Loader2, Trash2 } from 'lucide-react';

export default function DangerZonePage() {
  const { toast } = useToast();
  
  const handleAction = async (action: () => Promise<{ error: string | null }>, successMessage: string) => {
    const result = await action();
    if (result.error) {
      toast({ title: 'Gagal', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: successMessage });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Data & Reset</h1>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="font-headline text-destructive">Zona Berbahaya</CardTitle>
          <CardDescription>
            Tindakan di bawah ini bersifat permanen dan tidak dapat diurungkan. Lakukan dengan hati-hati.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResetAction
            title="Hapus Data Transaksional"
            description="Menghapus semua transaksi, jurnal, retur, dan piutang. Data master seperti produk dan pelanggan akan tetap ada."
            buttonText="Hapus Data Transaksional"
            successMessage="Semua data transaksional berhasil dihapus."
            action={() => handleAction(deleteTransactionalData, "Semua data transaksional berhasil dihapus.")}
          />
          <ResetAction
            title="Hapus Data Master"
            description="Menghapus semua produk, pelanggan, dan supplier. Data transaksi akan tetap ada tetapi mungkin kehilangan referensi."
            buttonText="Hapus Data Master"
            successMessage="Semua data master berhasil dihapus."
            action={() => handleAction(deleteMasterData, "Semua data master berhasil dihapus.")}
          />
           <ResetAction
            title="Hapus Bagan Akun (COA)"
            description="Menghapus seluruh struktur bagan akun Anda. Tindakan ini akan merusak penjurnalan otomatis. Anda perlu melakukan seed ulang."
            buttonText="Hapus Bagan Akun"
            successMessage="Bagan Akun berhasil dihapus."
            action={() => handleAction(deleteCoaData, "Bagan Akun (COA) berhasil dihapus.")}
          />
          <ResetAction
            title="Reset Pabrik (Factory Reset)"
            description="Menghapus SEMUA data aplikasi (transaksi dan master). Mengembalikan aplikasi ke kondisi kosong."
            buttonText="Reset Semua Data"
            successMessage="Semua data aplikasi berhasil di-reset."
            action={() => handleAction(deleteAllData, "Semua data aplikasi berhasil dihapus.")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface ResetActionProps {
  title: string;
  description: string;
  buttonText: string;
  successMessage: string;
  action: () => Promise<void>;
}

function ResetAction({ title, description, buttonText, action }: ResetActionProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await action();
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start justify-between rounded-lg border border-border p-4 gap-4">
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full sm:w-auto">
            <Trash2 className="mr-2 h-4 w-4" />
            {buttonText}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat diurungkan. Ini akan menghapus data secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
