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
import type { Supplier } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '../ui/textarea';

export function SupplierActions() {
  return (
    <SupplierFormDialog>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Supplier
      </Button>
    </SupplierFormDialog>
  );
}

export function SupplierRowActions({ supplier }: { supplier: Supplier }) {
  return (
    <SupplierFormDialog supplier={supplier}>
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
    </SupplierFormDialog>
  );
}


function SupplierFormDialog({ children, supplier }: { children: React.ReactNode, supplier?: Supplier }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [name, setName] = useState(supplier?.name || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [address, setAddress] = useState(supplier?.address || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd call a server action here to save the supplier.
    toast({
      title: `Supplier ${supplier ? 'diperbarui' : 'ditambahkan'}`,
      description: `${name} telah berhasil disimpan.`,
    });
    setOpen(false);
  };
  
  const isEditing = !!supplier;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form on close
      setName(supplier?.name || '');
      setEmail(supplier?.email || '');
      setPhone(supplier?.phone || '');
      setAddress(supplier?.address || '');
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Perbarui detail supplier di bawah ini.' : 'Isi detail untuk supplier baru.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="name">Nama Supplier</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
             <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">No. Telepon</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="address">Alamat</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
          <DialogFooter>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
