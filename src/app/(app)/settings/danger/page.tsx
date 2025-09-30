
'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { deleteTransactionalData, deleteMasterData, deleteCoaData } from './actions';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COLLECTIONS = {
    TRANSACTIONAL: [
        "transactions", "journals", "salesReturns", "parkedTransactions",
        "purchaseRequests", "purchaseOrders", "goodsReceipts", "supplierInvoices",
        "purchasePayments", "purchaseReturns", "stockTransfers", "periodClosings",
        "stockOpnames"
    ],
    MASTER: [
        "products", "customers", "suppliers", "productCategories", 
        "warehouses", "taxes", "currencies", "marketplaceStores"
    ],
    ACCOUNTING: ["coa"],
}

interface ResetActionProps {
  title: string;
  description: string;
  buttonLabel: string;
  onConfirm: () => Promise<any>;
  collectionsToDelete: string[];
}

function ResetAction({ title, description, buttonLabel, onConfirm, collectionsToDelete }: ResetActionProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await onConfirm();
      if (result.error) {
        toast({ title: 'Gagal Menghapus Data', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Berhasil', description: 'Data yang dipilih telah berhasil dihapus.' });
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="mt-2 sm:mt-0">
            <Trash2 className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat diurungkan. Ini akan menghapus data berikut secara permanen:
            </AlertDialogDescription>
            <div className="flex flex-wrap gap-1 pt-2">
                {collectionsToDelete.map(col => (
                    <Badge key={col} variant="outline" className="font-mono">{col}</Badge>
                ))}
            </div>
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


export default function DangerZonePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Data &amp; Reset</h1>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="font-headline text-destructive flex items-center gap-2">
            <AlertTriangle />
            Zona Berbahaya
          </CardTitle>
          <CardDescription>
            Hapus grup data secara permanen. Tindakan ini tidak dapat diurungkan. Lakukan dengan hati-hati.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResetAction
            title="Hapus Data Transaksional"
            description="Menghapus semua transaksi, jurnal, retur, dan piutang. Data master (produk, pelanggan) tidak akan terhapus."
            buttonLabel="Hapus Data Transaksional"
            onConfirm={deleteTransactionalData}
            collectionsToDelete={COLLECTIONS.TRANSACTIONAL}
          />
          <ResetAction
            title="Hapus Data Master"
            description="Menghapus semua produk, pelanggan, dan supplier. Data transaksi akan tetap ada tetapi mungkin kehilangan referensi."
            buttonLabel="Hapus Data Master"
            onConfirm={deleteMasterData}
            collectionsToDelete={COLLECTIONS.MASTER}
          />
          <ResetAction
            title="Hapus Bagan Akun (COA)"
            description="Menghapus seluruh struktur bagan akun Anda. Tindakan ini akan merusak penjurnalan otomatis. Anda perlu melakukan seed ulang."
            buttonLabel="Hapus Bagan Akun"
            onConfirm={deleteCoaData}
            collectionsToDelete={COLLECTIONS.ACCOUNTING}
          />
        </CardContent>
      </Card>
    </div>
  );
}
