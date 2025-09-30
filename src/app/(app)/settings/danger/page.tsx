'use client';

import React, { useState, useTransition, useMemo } from 'react';
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
import { handleCustomDelete } from './actions';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const DATA_GROUPS = {
  transactional: {
    id: 'transactional',
    label: 'Data Transaksional',
    description: 'Semua transaksi, jurnal, retur, dan piutang. Data master (produk, pelanggan) tidak akan terhapus.',
    collections: ["transactions", "journals", "salesReturns", "parkedTransactions", "purchaseRequests", "purchaseOrders", "goodsReceipts", "supplierInvoices", "purchasePayments", "purchaseReturns", "stockTransfers", "periodClosings"],
  },
  master: {
    id: 'master',
    label: 'Data Master',
    description: 'Semua produk, pelanggan, supplier, kategori, gudang, dll. Data transaksi akan tetap ada tetapi bisa kehilangan referensi.',
    collections: ["products", "customers", "suppliers", "productCategories", "warehouses", "taxes", "currencies", "marketplaceStores"],
  },
  coa: {
    id: 'coa',
    label: 'Bagan Akun (COA)',
    description: 'Seluruh struktur bagan akun Anda. Tindakan ini akan merusak penjurnalan otomatis.',
    collections: ["coa"],
  },
};

export default function DangerZonePage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selections, setSelections] = useState({
    transactional: false,
    master: false,
    coa: false,
  });

  const handleCheckboxChange = (id: keyof typeof selections, checked: boolean) => {
    setSelections(prev => ({ ...prev, [id]: checked }));
  };

  const selectedCount = useMemo(() => Object.values(selections).filter(Boolean).length, [selections]);

  const collectionsToDelete = useMemo(() => {
    return Object.entries(selections)
      .filter(([, isSelected]) => isSelected)
      .flatMap(([key]) => DATA_GROUPS[key as keyof typeof DATA_GROUPS].collections);
  }, [selections]);

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await handleCustomDelete(selections);
      if (result.error) {
        toast({ title: 'Gagal Menghapus Data', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Berhasil', description: 'Data yang dipilih telah berhasil dihapus.' });
        setSelections({ transactional: false, master: false, coa: false });
      }
    });
  };

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
            Pilih grup data yang ingin Anda hapus secara permanen. Tindakan ini tidak dapat diurungkan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.values(DATA_GROUPS).map(group => (
            <div key={group.id} className="flex items-start space-x-3 rounded-lg border p-4">
              <Checkbox 
                id={group.id} 
                checked={selections[group.id as keyof typeof selections]}
                onCheckedChange={(checked) => handleCheckboxChange(group.id as keyof typeof selections, Boolean(checked))}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor={group.id} className="font-semibold cursor-pointer">
                  {group.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {group.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={selectedCount === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus {selectedCount > 0 ? `${selectedCount} Grup Data` : 'Data Terpilih'}
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
        </CardFooter>
      </Card>
    </div>
  );
}