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
import { deleteSingleCollection } from './actions';
import { Loader2, Trash2, AlertTriangle, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123qwe') {
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Kata sandi salah. Akses ditolak.');
    }
  };

  if (!isAuthorized) {
    return (
        <div className="flex flex-col gap-6 items-center justify-center h-[60vh]">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound/> Autentikasi Diperlukan
                    </CardTitle>
                    <CardDescription>
                        Anda harus memasukkan kata sandi untuk mengakses halaman ini.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Kata Sandi</Label>
                            <Input 
                                id="password" 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Masuk</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
  }

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
            Hapus koleksi data secara individual dan permanen. Tindakan ini tidak dapat diurungkan. Lakukan dengan sangat hati-hati.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}