
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
import { Badge } from '@/components/ui/badge';

type ActionType = 'transactional' | 'master' | 'coa' | 'all';

const COLLECTIONS = {
    TRANSACTIONAL: [
        "transactions", "journals", "salesReturns", "parkedTransactions",
        "purchaseRequests", "purchaseOrders", "goodsReceipts", "supplierInvoices",
        "purchasePayments", "purchaseReturns", "stockTransfers"
    ],
    MASTER: [
        "products", "customers", "suppliers", "productCategories", 
        "warehouses", "taxes", "currencies", "marketplaceStores"
    ],
    ACCOUNTING: ["coa"],
}

export default function DangerZonePage() {
  const { toast } = useToast();
  
  const handleAction = async (actionType: ActionType) => {
    let result: { error: string | null };
    let successMessage = '';
    
    switch (actionType) {
        case 'transactional':
            result = await deleteTransactionalData();
            successMessage = "Semua data transaksional berhasil dihapus.";
            break;
        case 'master':
            result = await deleteMasterData();
            successMessage = "Semua data master berhasil dihapus.";
            break;
        case 'coa':
            result = await deleteCoaData();
            successMessage = "Bagan Akun (COA) berhasil dihapus.";
            break;
        case 'all':
            result = await deleteAllData();
            successMessage = "Semua data aplikasi berhasil di-reset.";
            break;
        default:
            return;
    }

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
            actionType="transactional"
            onConfirm={handleAction}
            collectionsToDelete={COLLECTIONS.TRANSACTIONAL}
          />
          <ResetAction
            title="Hapus Data Master"
            description="Menghapus semua produk, pelanggan, dan supplier. Data transaksi akan tetap ada tetapi mungkin kehilangan referensi."
            buttonText="Hapus Data Master"
            actionType="master"
            onConfirm={handleAction}
            collectionsToDelete={COLLECTIONS.MASTER}
          />
           <ResetAction
            title="Hapus Bagan Akun (COA)"
            description="Menghapus seluruh struktur bagan akun Anda. Tindakan ini akan merusak penjurnalan otomatis. Anda perlu melakukan seed ulang."
            buttonText="Hapus Bagan Akun"
            actionType="coa"
            onConfirm={handleAction}
            collectionsToDelete={COLLECTIONS.ACCOUNTING}
          />
          <ResetAction
            title="Reset Pabrik (Factory Reset)"
            description="Menghapus SEMUA data aplikasi (transaksi dan master). Mengembalikan aplikasi ke kondisi kosong."
            buttonText="Reset Semua Data"
            actionType="all"
            onConfirm={handleAction}
            collectionsToDelete={[...COLLECTIONS.TRANSACTIONAL, ...COLLECTIONS.MASTER, ...COLLECTIONS.ACCOUNTING]}
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
  actionType: ActionType;
  onConfirm: (actionType: ActionType) => Promise<void>;
  collectionsToDelete: string[];
}

function ResetAction({ title, description, buttonText, actionType, onConfirm, collectionsToDelete }: ResetActionProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm(actionType);
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
              <p>Tindakan ini tidak dapat diurungkan. Ini akan menghapus data berikut secara permanen:</p>
              <div className="flex flex-wrap gap-1 py-2">
                {collectionsToDelete.map(col => (
                  <Badge key={col} variant="outline" className="font-mono">{col}</Badge>
                ))}
              </div>
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
