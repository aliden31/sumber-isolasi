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
import { deleteSingleCollection, deleteAllDataFromGroup } from './actions';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

const collectionGroups = {
    'Transaksional': ALL_COLLECTIONS.filter(c => c.group === 'Transaksional'),
    'Master': ALL_COLLECTIONS.filter(c => c.group === 'Master'),
    'Akuntansi': ALL_COLLECTIONS.filter(c => c.group === 'Akuntansi'),
}

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
                <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Koleksi Data "{collection.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini tidak dapat diurungkan. Ini akan menghapus semua dokumen di dalam koleksi <code className="bg-muted px-1 rounded-sm">{collection.name}</code> secara permanen. Stok produk akan dikembalikan ke kondisi sebelum transaksi terjadi (jika relevan).
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

function DeleteGroupAction({ groupName, collections }: { groupName: string, collections: { name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleConfirm = () => {
    startTransition(async () => {
      const collectionNames = collections.map(c => c.name);
      const result = await deleteAllDataFromGroup(collectionNames);
      if (result.error) {
        toast({ title: 'Gagal Menghapus Grup Data', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Berhasil', description: `Semua data di grup "${groupName}" telah berhasil dihapus.` });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="mr-2 h-4 w-4" /> Hapus Semua Data {groupName}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Semua Data Grup "{groupName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Anda akan menghapus semua data untuk {collections.length} koleksi di grup ini.
            Tindakan ini tidak dapat diurungkan dan akan menghapus data secara permanen.
            <br/><br/>
            <strong className="text-destructive">Peringatan:</strong> Tindakan ini TIDAK akan mengembalikan stok produk.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ya, Hapus Semua Data Grup Ini
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
            Tindakan di halaman ini akan menghapus data secara permanen dan tidak dapat diurungkan. Lakukan dengan sangat hati-hati.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {Object.entries(collectionGroups).map(([groupName, collections]) => (
            <Card key={groupName}>
                <CardHeader>
                    <CardTitle>{groupName}</CardTitle>
                    <CardDescription>
                        Kumpulan data {groupName.toLowerCase()}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            {collections.map(collection => (
                                <DeleteAction key={collection.name} collection={collection} />
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                     <DeleteGroupAction groupName={groupName} collections={collections} />
                </CardFooter>
            </Card>
        ))}
      </div>
    </div>
  );
}
