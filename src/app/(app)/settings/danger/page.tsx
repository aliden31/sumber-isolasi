
'use client';

import React, { useState, useTransition, useRef } from 'react';
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
import { deleteSingleCollection, backupAllData, restoreAllData } from './actions';
import { Loader2, Trash2, AlertTriangle, Download, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

const ALL_COLLECTIONS = [
    { name: "transactions", group: 'Transaksional', description: 'Semua riwayat penjualan.' },
    { name: "journals", group: 'Transaksional', description: 'Semua entri jurnal akuntansi.' },
    { name: "salesReturns", group: 'Transaksional', description: 'Semua riwayat retur penjualan.' },
    { name: "parkedTransactions", group: 'Transaksional', description: 'Semua transaksi kasir yang diparkir.' },
    { name: "purchaseRequests", group: 'Transaksional', description: 'Semua permintaan pembelian.' },
    { name: "purchaseOrders", group: 'Transaksional', description: 'Semua pesanan pembelian (PO).' },
    { name: "goodsReceipts", group: 'Transaksional', description: 'Semua penerimaan barang (GRN).' },
    { name: "supplierInvoices", group: 'Transaksional', description: 'Semua faktur dari pemasok.' },
    { name: "purchasePayments", group: 'Transaksional', description: 'Semua pembayaran utang.' },
    { name: "purchaseReturns", group: 'Transaksional', description: 'Semua riwayat retur pembelian.' },
    { name: "stockTransfers", group: 'Transaksional', description: 'Semua riwayat transfer stok.' },
    { name: "periodClosings", group: 'Transaksional', description: 'Semua riwayat tutup buku.' },
    { name: "stockOpnames", group: 'Transaksional', description: 'Semua riwayat stock opname.' },
    { name: "products", group: 'Master', description: 'Semua data produk.' },
    { name: "customers", group: 'Master', description: 'Semua data pelanggan.' },
    { name: "suppliers", group: 'Master', description: 'Semua data pemasok.' },
    { name: "productCategories", group: 'Master', description: 'Semua kategori produk.' },
    { name: "warehouses", group: 'Master', description: 'Semua data gudang.' },
    { name: "taxes", group: 'Master', description: 'Semua tarif pajak.' },
    { name: "currencies", group: 'Master', description: 'Semua data mata uang.' },
    { name: "marketplaceStores", group: 'Master', description: 'Semua pengaturan toko marketplace.' },
    { name: "coa", group: 'Akuntansi', description: 'Seluruh Bagan Akun (Chart of Accounts).' },
];

interface DeleteActionProps {
  collection: { name: string; group: string; description: string };
}

function DeleteAction({ collection }: DeleteActionProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteSingleCollection(collection.name);
      if (result.error) {
        toast({ title: 'Gagal Menghapus Data', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Berhasil', description: `Koleksi data "${collection.name}" telah berhasil dihapus.` });
      }
    });
  };

  return (
    <TableRow>
        <TableCell><Badge variant="secondary" className="font-mono">{collection.name}</Badge></TableCell>
        <TableCell>{collection.description}</TableCell>
        <TableCell>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Koleksi Data "{collection.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat diurungkan. Ini akan menghapus semua dokumen di dalam koleksi <code className="bg-muted px-1 rounded-sm">{collection.name}</code> secara permanen.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ya, Hapus Koleksi
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TableCell>
    </TableRow>
  );
}


export default function DangerZonePage() {
  const [isBackupPending, startBackupTransition] = useTransition();
  const [isRestorePending, startRestoreTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    startBackupTransition(async () => {
      const result = await backupAllData();
      if (result.error) {
        toast({ title: 'Backup Gagal', description: result.error, variant: 'destructive'});
      } else {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `tokokilat_backup_${new Date().toISOString()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast({ title: 'Backup Berhasil', description: 'Data Anda telah diunduh sebagai file JSON.' });
      }
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        startRestoreTransition(async () => {
          const result = await restoreAllData(data);
          if (result.error) {
            toast({ title: 'Restore Gagal', description: result.error, variant: 'destructive'});
          } else {
            toast({ title: 'Restore Berhasil', description: 'Semua data telah berhasil dipulihkan.' });
          }
        });
        
      } catch (err) {
        const e = err as Error;
        toast({ title: 'File Tidak Valid', description: `File backup tidak valid: ${e.message}`, variant: 'destructive'});
      }
    };
    reader.readAsText(file);
    // Reset file input
    if(fileInputRef.current) fileInputRef.current.value = "";
  };


  return (
    <div className="flex flex-col gap-6">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="font-headline text-destructive flex items-center gap-2">
            <AlertTriangle />
            Zona Berbahaya
          </CardTitle>
          <CardDescription>
            Tindakan di area ini dapat menyebabkan kehilangan data permanen. Lakukan dengan sangat hati-hati.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Backup & Restore</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Buat cadangan lengkap dari seluruh data aplikasi Anda, atau pulihkan dari file backup sebelumnya.
                <strong className="text-destructive"> Peringatan: Restore akan menimpa semua data yang ada saat ini.</strong>
              </p>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBackup} disabled={isBackupPending}>
                      {isBackupPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                      Backup Semua Data
                  </Button>
                  <Button variant="destructive" onClick={() => fileInputRef.current?.click()} disabled={isRestorePending}>
                      {isRestorePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                      Restore dari File...
                  </Button>
                  <Input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept="application/json"
                  />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Hapus Koleksi Data Individual</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Hapus seluruh data dari satu koleksi tertentu. Tindakan ini tidak dapat diurungkan.
              </p>
               <div className="border rounded-md">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Koleksi</TableHead>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead>Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ALL_COLLECTIONS.map(collection => (
                            <DeleteAction key={collection.name} collection={collection} />
                        ))}
                    </TableBody>
                </Table>
              </div>
            </div>

        </CardContent>
      </Card>
    </div>
  );
}
