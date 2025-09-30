'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StockNotificationsPage() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      const lowStock = allProducts.filter(p => p.stock <= (p.minStockThreshold || 10));
      setLowStockProducts(lowStock);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Notifikasi Stok Menipis</h1>
        <Button asChild variant="outline">
          <Link href="/products">
            Atur Batas Minimum
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="text-destructive" />
            <span>Produk yang Perlu Segera Dipesan Ulang</span>
          </CardTitle>
          <CardDescription>
            Daftar ini berisi produk yang jumlah stoknya telah mencapai atau di bawah batas stok minimum yang Anda tetapkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Sisa Stok</TableHead>
                <TableHead className="text-center">Batas Min.</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    <Loader2 className="animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : lowStockProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Tidak ada produk yang stoknya menipis saat ini.
                  </TableCell>
                </TableRow>
              ) : (
                lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                    <TableCell className="text-center font-bold">
                      <Badge variant="destructive">{product.stock}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{product.minStockThreshold || 10}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link href="/purchasing/order">Buat Pesanan</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}