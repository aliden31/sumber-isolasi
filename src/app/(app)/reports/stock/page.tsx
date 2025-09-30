
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, ProductCategory } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Archive, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StockReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), orderBy('name'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Product)));
      setLoading(false);
    });

    const qCategories = query(collection(db, 'productCategories'), orderBy('name'));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCategory)))
    });


    return () => {
        unsubscribeProducts();
        unsubscribeCategories();
    };
  }, []);

  const categoryOptions = useMemo(() => {
    return ['all', ...categories.map(c => c.name)];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(filter.toLowerCase());
      const categoryMatch = categoryFilter === 'all' || p.category === categoryFilter;
      return nameMatch && categoryMatch;
    });
  }, [products, filter, categoryFilter]);

  const totalInventoryValue = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + (p.cost || 0) * p.stock, 0);
  }, [filteredProducts]);
  
  const totalStockCount = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + p.stock, 0);
  }, [filteredProducts]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Laporan Stok</h1>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nilai Persediaan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalInventoryValue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">Berdasarkan harga pokok produk</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unit Persediaan</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStockCount.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">Jumlah semua item di gudang</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Nilai Persediaan</CardTitle>
          <CardDescription>Daftar semua produk beserta stok dan nilainya saat ini.</CardDescription>
           <div className="flex items-center gap-4 pt-4">
              <Input
                placeholder="Cari nama produk..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-sm"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'Semua Kategori' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Harga Pokok</TableHead>
                <TableHead className="text-right">Total Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Tidak ada produk ditemukan.</TableCell></TableRow>
              ) : (
                filteredProducts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{p.stock}</TableCell>
                    <TableCell className="text-right font-mono">Rp {(p.cost || 0).toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right font-bold font-mono">Rp {((p.cost || 0) * p.stock).toLocaleString('id-ID')}</TableCell>
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
