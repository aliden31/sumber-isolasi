'use client';

import React, { useState, useMemo, useTransition, useEffect } from 'react';
import { PlusCircle, MinusCircle, X, Save, Loader2, Plus } from 'lucide-react';
import type { Product, Supplier, PurchaseOrderItem, NewPurchaseOrder, PurchaseOrder } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { addPurchaseOrder } from '../actions';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function PurchaseOrderPage() {
  const [isNewPO, setIsNewPO] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const poUnsub = onSnapshot(collection(db, "purchaseOrders"), (snapshot) => {
      const pos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      } as PurchaseOrder)).sort((a,b) => b.date.getTime() - a.date.getTime());
      setPurchaseOrders(pos);
      setLoading(false);
    });

    return () => poUnsub();
  }, []);

  if (isNewPO) {
    return <NewPurchaseOrderForm onBack={() => setIsNewPO(false)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Pesanan Pembelian (Purchase Order)</h1>
        <Button onClick={() => setIsNewPO(true)}>
          <Plus className="mr-2 h-4 w-4" /> Buat PO Baru
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Purchase Order</CardTitle>
          <CardDescription>Daftar semua pesanan pembelian yang pernah dibuat.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. PO</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin"/></TableCell></TableRow>
              ) : purchaseOrders.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Belum ada Purchase Order.</TableCell></TableRow>
              ) : (
                purchaseOrders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell>{format(po.date, "dd MMM yyyy", { locale: id })}</TableCell>
                    <TableCell className="font-mono text-xs">{po.id}</TableCell>
                    <TableCell>{po.supplierName}</TableCell>
                    <TableCell><Badge variant="secondary">{po.status}</Badge></TableCell>
                    <TableCell className="text-right font-medium">Rp {po.total.toLocaleString('id-ID')}</TableCell>
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

function NewPurchaseOrderForm({ onBack }: { onBack: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const productsUnsub = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    const suppliersUnsub = onSnapshot(collection(db, "suppliers"), (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    });
    return () => {
      productsUnsub();
      suppliersUnsub();
    };
  }, []);
  
  const addItem = (product: Product) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        cost: product.cost || 0 
      }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems(prev => {
      if (quantity <= 0) return prev.filter(item => item.productId !== productId);
      return prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  };

  const totalPO = useMemo(() => {
    return items.reduce((total, item) => total + item.cost * item.quantity, 0);
  }, [items]);

  const resetForm = () => {
    setItems([]);
    setSelectedSupplier(null);
    setDate(new Date());
    onBack();
  };

  const handleSavePO = () => {
    if (items.length === 0 || !selectedSupplier || !date) {
      toast({ title: 'Data tidak lengkap', description: 'Supplier, tanggal, dan minimal satu produk harus dipilih.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const newPO: NewPurchaseOrder = {
        date,
        items: items,
        total: totalPO,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        status: 'Draft',
      };

      const result = await addPurchaseOrder(newPO);
      
      if (result.error) {
        toast({ title: 'Gagal Menyimpan PO', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Purchase Order Berhasil Disimpan', description: `PO untuk ${selectedSupplier.name} telah dibuat.` });
        resetForm();
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Buat Purchase Order Baru</h1>
        <Button variant="ghost" onClick={onBack}>Kembali</Button>
      </div>
        <Card>
          <CardHeader>
            <CardTitle>Detail Pesanan Pembelian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pemasok (Supplier)</Label>
                <DataPicker data={suppliers} selected={selectedSupplier} onSelect={setSelectedSupplier} placeholder="Pilih pemasok..." nameKey="name" />
              </div>
              <div className="space-y-2">
                <Label>Tanggal PO</Label>
                <DatePicker date={date} setDate={setDate} />
              </div>
            </div>
            <div className="space-y-2">
               <Label>Item Pesanan</Label>
               {items.length > 0 && (
                  <div className="border rounded-md">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Produk</TableHead>
                                  <TableHead className="w-[120px]">Jumlah</TableHead>
                                  <TableHead>Harga Pokok</TableHead>
                                  <TableHead className="text-right">Subtotal</TableHead>
                                  <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {items.map(item => (
                              <TableRow key={item.productId}>
                                  <TableCell className="font-medium">{item.productName}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                                        <MinusCircle className="h-4 w-4" />
                                      </Button>
                                      <span>{item.quantity}</span>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                                        <PlusCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>Rp {(item.cost).toLocaleString('id-ID')}</TableCell>
                                  <TableCell className="text-right">Rp {(item.cost * item.quantity).toLocaleString('id-ID')}</TableCell>
                                  <TableCell>
                                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, 0)}>
                                      <X className="h-4 w-4 text-destructive" />
                                  </Button>
                                  </TableCell>
                              </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
               )}
               <DataPicker data={products} onSelect={addItem} placeholder="Tambah Produk..." nameKey="name" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center bg-muted/50 p-6">
              <div className="text-lg font-bold">
                  Total PO: Rp {totalPO.toLocaleString('id-ID')}
              </div>
            <Button onClick={handleSavePO} disabled={isPending || !selectedSupplier || items.length === 0}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Purchase Order
            </Button>
          </CardFooter>
        </Card>
    </div>
  );
}

function DataPicker<T extends {id: string; [key: string]: any}>({ data, selected, onSelect, placeholder, nameKey }: { data: T[], selected?: T | null, onSelect: (item: T | null) => void, placeholder: string, nameKey: keyof T }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selected ? selected[nameKey] : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Cari..." />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item[nameKey]}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selected?.id === item.id ? "opacity-100" : "opacity-0")} />
                  {item[nameKey]}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}