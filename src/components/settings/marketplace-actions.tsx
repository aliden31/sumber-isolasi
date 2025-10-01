
'use client';

import React, { useState, useTransition } from 'react';
import { Plus, MoreHorizontal, Loader2, Edit, Trash2 } from 'lucide-react';
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
import type { MarketplaceStore } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { addMarketplaceStore, updateMarketplaceStore, deleteMarketplaceStore } from '@/app/(app)/settings/marketplace/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MARKETPLACE_OPTIONS = ['Tokopedia', 'Shopee', 'TikTok', 'Lazada', 'BigSeller', 'Lainnya'];

export function MarketplaceActions() {
  return (
    <MarketplaceStoreFormDialog>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Toko
      </Button>
    </MarketplaceStoreFormDialog>
  );
}

export function MarketplaceRowActions({ store }: { store: MarketplaceStore }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteMarketplaceStore(store.id);
      if (result.error) {
        toast({ title: 'Gagal Menghapus', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Toko Dihapus', description: `Toko ${store.storeName} telah berhasil dihapus.` });
        setIsDeleteDialogOpen(false);
      }
    });
  }

  return (
     <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             <MarketplaceStoreFormDialog store={store}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
            </MarketplaceStoreFormDialog>
            <DropdownMenuItem className="text-destructive" onSelect={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anda yakin?</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus toko <span className="font-semibold">{store.storeName}</span> secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={isPending}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MarketplaceStoreFormDialog({ children, store }: { children: React.ReactNode, store?: MarketplaceStore }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [marketplace, setMarketplace] = useState(store?.marketplace || '');
  const [storeName, setStoreName] = useState(store?.storeName || '');
  const [nickname, setNickname] = useState(store?.nickname || '');
  
  const isEditing = !!store;
  const isDropdownItem = React.isValidElement(children) && (children.type as any).displayName === 'DropdownMenuItem';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const data = { 
        marketplace: marketplace as MarketplaceStore['marketplace'], 
        storeName, 
        nickname 
      };
      const result = isEditing
        ? await updateMarketplaceStore(store.id, data)
        : await addMarketplaceStore(data);

      if (result.error) {
        toast({ title: `Gagal menyimpan`, description: result.error, variant: 'destructive' });
      } else {
        toast({ title: `Toko berhasil disimpan.` });
        setOpen(false);
      }
    });
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (isPending) return;
    if (!isOpen) {
      setMarketplace(store?.marketplace || '');
      setStoreName(store?.storeName || '');
      setNickname(store?.nickname || '');
    }
    setOpen(isOpen);
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isDropdownItem ? <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"><Edit className="mr-2 h-4 w-4" /> Edit</div> : children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? 'Edit Toko Marketplace' : 'Tambah Toko Marketplace'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="marketplace">Marketplace</Label>
               <Select onValueChange={setMarketplace} defaultValue={marketplace} required>
                    <SelectTrigger id="marketplace" disabled={isPending}>
                        <SelectValue placeholder="Pilih marketplace" />
                    </SelectTrigger>
                    <SelectContent>
                        {MARKETPLACE_OPTIONS.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeName">Nama Toko Marketplace</Label>
              <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} required disabled={isPending} placeholder="Nama toko resmi di marketplace"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Nama Panggilan Toko (Internal)</Label>
              <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required disabled={isPending} placeholder="Contoh: BigSeller, Toko Shopee Utama"/>
            </div>
          <DialogFooter>
             <Button type="submit" disabled={isPending || !marketplace || !storeName || !nickname}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
