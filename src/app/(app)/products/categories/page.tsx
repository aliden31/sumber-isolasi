'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, ProductCategory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generateId } from '@/lib/id';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { PlusCircle, Edit3, Tag, Shapes, Trash2 } from 'lucide-react';

interface CategoryForm {
  name: string;
  color: string;
  description: string;
}

export default function ProductCategoriesPage() {
  const [categories, setCategories] = usePersistentState<ProductCategory[]>('inventory:categories', []);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<CategoryForm>({ name: '', color: '#0ea5e9', description: '' });
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(list);
    });
    return () => unsub();
  }, []);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((product) => map.set(product.id, product));
    return map;
  }, [products]);

  const handleCreateCategory = () => {
    if (!form.name.trim()) {
      toast({ title: 'Nama kategori wajib diisi', variant: 'destructive' });
      return;
    }
    const newCategory: ProductCategory = {
      id: generateId('CAT'),
      name: form.name.trim(),
      color: form.color,
      description: form.description.trim() || undefined,
      productIds: [],
    };
    setCategories([newCategory, ...categories]);
    setForm({ name: '', color: '#0ea5e9', description: '' });
    toast({ title: 'Kategori berhasil dibuat', description: newCategory.name });
  };

  const handleSaveCategory = (updated: ProductCategory) => {
    setCategories((prev) => prev.map((cat) => (cat.id === updated.id ? updated : cat)));
    setSelectedCategory(null);
    toast({ title: 'Kategori diperbarui', description: updated.name });
  };

  const handleDeleteCategory = (id: string) => {
    const target = categories.find((cat) => cat.id === id);
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    toast({ title: 'Kategori dihapus', description: target?.name });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Kategori Produk</h1>
          <p className="text-muted-foreground">Kelompokkan produk untuk memudahkan pencarian, pelaporan, dan analisis.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><PlusCircle className="h-5 w-5" /> Tambah Kategori</CardTitle>
          <CardDescription>Buat kategori baru dan tentukan warna penanda untuk membedakan di laporan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nama Kategori</Label>
              <Input
                id="category-name"
                placeholder="Contoh: Minuman"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-color">Warna</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="category-color"
                  type="color"
                  value={form.color}
                  onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                  className="h-10 w-16 p-1"
                />
                <div className="flex-1">
                  <Input value={form.color} onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))} />
                </div>
              </div>
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="category-description">Deskripsi</Label>
              <Textarea
                id="category-description"
                placeholder="Catatan singkat mengenai kategori ini"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleCreateCategory}>
              <PlusCircle className="mr-2 h-4 w-4" /> Simpan Kategori
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Shapes className="h-5 w-5" /> Daftar Kategori</CardTitle>
          <CardDescription>Lihat kategori yang ada dan atur penugasan produk.</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">Belum ada kategori. Tambahkan kategori pertama Anda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Produk Terkait</TableHead>
                  <TableHead>Warna</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium flex items-center gap-2">
                          <Tag className="h-4 w-4" style={{ color: category.color }} /> {category.name}
                        </p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {category.productIds.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Belum ada produk</span>
                        ) : (
                          category.productIds.map((id) => (
                            <Badge key={id} variant="outline">
                              {productMap.get(id)?.name || 'Produk tidak ditemukan'}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: category.color }} />
                        <span className="text-sm text-muted-foreground">{category.color.toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog open={selectedCategory?.id === category.id} onOpenChange={(open) => !open && setSelectedCategory(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedCategory(category)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Kelola
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Kelola Kategori {selectedCategory?.name}</DialogTitle>
                            <DialogDescription>
                              Perbarui detail kategori dan tetapkan produk yang termasuk di dalamnya.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedCategory && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Nama Kategori</Label>
                                  <Input
                                    value={selectedCategory.name}
                                    onChange={(event) =>
                                      setSelectedCategory((prev) =>
                                        prev ? { ...prev, name: event.target.value } : prev
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Warna</Label>
                                  <div className="flex items-center gap-3">
                                    <Input
                                      type="color"
                                      value={selectedCategory.color}
                                      onChange={(event) =>
                                        setSelectedCategory((prev) =>
                                          prev ? { ...prev, color: event.target.value } : prev
                                        )
                                      }
                                      className="h-10 w-16 p-1"
                                    />
                                    <Input
                                      value={selectedCategory.color}
                                      onChange={(event) =>
                                        setSelectedCategory((prev) =>
                                          prev ? { ...prev, color: event.target.value } : prev
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Deskripsi</Label>
                                  <Textarea
                                    value={selectedCategory.description ?? ''}
                                    onChange={(event) =>
                                      setSelectedCategory((prev) =>
                                        prev ? { ...prev, description: event.target.value } : prev
                                      )
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-3">
                                <Label>Produk dalam Kategori Ini</Label>
                                <Separator />
                                <div className="max-h-[280px] overflow-y-auto pr-2 space-y-3">
                                  {products.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Belum ada data produk untuk ditampilkan.</p>
                                  ) : (
                                    products.map((product) => {
                                      const checked = selectedCategory.productIds.includes(product.id);
                                      return (
                                        <label
                                          key={product.id}
                                          className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/50"
                                        >
                                          <Checkbox
                                            checked={checked}
                                            onCheckedChange={(value) =>
                                              setSelectedCategory((prev) => {
                                                if (!prev) return prev;
                                                const nextIds = new Set(prev.productIds);
                                                if (value) {
                                                  nextIds.add(product.id);
                                                } else {
                                                  nextIds.delete(product.id);
                                                }
                                                return { ...prev, productIds: Array.from(nextIds) };
                                              })
                                            }
                                          />
                                          <div className="space-y-1">
                                            <p className="font-medium leading-none">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                              Stok: {product.stock.toLocaleString('id-ID')} • Harga jual: Rp{' '}
                                              {product.price.toLocaleString('id-ID')}
                                            </p>
                                          </div>
                                        </label>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          <DialogFooter className="flex justify-between items-center">
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                handleDeleteCategory(category.id);
                                setSelectedCategory(null);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus Kategori
                            </Button>
                            <Button
                              type="button"
                              onClick={() => selectedCategory && handleSaveCategory(selectedCategory)}
                              disabled={!selectedCategory?.name}
                            >
                              <Edit3 className="mr-2 h-4 w-4" /> Simpan Perubahan
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
