'use client';

import React, { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ProductActions() {
  return (
    <ProductFormDialog>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Produk
      </Button>
    </ProductFormDialog>
  );
}

export function ProductRowActions({ product }: { product: Product }) {
  return (
    <ProductFormDialog product={product}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Hapus</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ProductFormDialog>
  );
}


function ProductFormDialog({ children, product }: { children: React.ReactNode, product?: Product }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || '');
  const [price, setPrice] = useState(product?.price || 0);
  const [stock, setStock] = useState(product?.stock || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd call a server action here to save the product.
    toast({
      title: `Produk ${product ? 'diperbarui' : 'ditambahkan'}`,
      description: `${name} telah berhasil disimpan.`,
    });
    setOpen(false);
  };
  
  const isEditing = !!product;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form on close
      setName(product?.name || '');
      setCategory(product?.category || '');
      setPrice(product?.price || 0);
      setStock(product?.stock || 0);
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Perbarui detail produk di bawah ini.' : 'Isi detail untuk produk baru.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nama
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Kategori
              </Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Harga
              </Label>
              <Input id="price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stok
              </Label>
              <Input id="stock" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
