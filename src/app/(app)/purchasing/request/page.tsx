'use client';

import React, { useState, useMemo, useTransition, useEffect } from 'react';
import { Plus, Save, Loader2, PlusCircle, MinusCircle, X, ChevronsUpDown, Check, ArrowLeft, Send, Eye, CheckCircle, XCircle } from 'lucide-react';
import type { Product, PurchaseRequest, PurchaseRequestItem, NewPurchaseRequest } from '@/lib/types';
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
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { addPurchaseRequest, updatePurchaseRequestStatus } from '../actions';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
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
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';


export default function PurchaseRequestPage() {
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prUnsub = onSnapshot(collection(db, "purchaseRequests"), (snapshot) => {
      const prs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      } as PurchaseRequest)).sort((a,b) => b.date.getTime() - a.date.getTime());
      setPurchaseRequests(prs);
      setLoading(false);
    });

    return () => prUnsub();
  }, []);

  const handleViewDetail = (pr: PurchaseRequest) => {
    setSelectedRequest(pr);
    setView('detail');
  }

  if (view === 'new') {
    return <NewPurchaseRequestForm onBack={() => setView('list')} />;
  }
  
  if (view === 'detail' && selectedRequest) {
    return <PurchaseRequestDetail pr={selectedRequest} onBack={() => setView('list')} />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Permintaan Pembelian (Purchase Request)</h1>
        <Button onClick={() => setView('new')}>
          <Plus className="mr-2 h-4 w-4" /> Buat PR Baru
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Purchase Request</CardTitle>
          <CardDescription>Daftar semua permintaan pembelian yang pernah dibuat.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. PR</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
              ) : purchaseRequests.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Belum ada Purchase Request.</TableCell></TableRow>
              ) : (
                purchaseRequests.map(pr => (
                  <TableRow key={pr.id}>
                    <TableCell>{format(pr.date, "dd MMM yyyy", { locale: id })}</TableCell>
                    <TableCell className="font-mono text-xs">{pr.id}</TableCell>
                    <TableCell>{pr.requestedBy}</TableCell>
                    <TableCell><PRStatusBadge status={pr.status} /></TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetail(pr)}>
                            <Eye className="mr-2 h-4 w-4"/> Lihat
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


function NewPurchaseRequestForm({ onBack }: { onBack: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseRequestItem[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [requestedBy, setRequestedBy] = useState('');
  const [notes, setNotes] = useState('');

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const productsUnsub = onSnapshot(collection(db, "products"), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => productsUnsub();
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

  const resetForm = () => {
    setItems([]);
    setDate(new Date());
    setRequestedBy('');
    setNotes('');
    onBack();
  };

  const handleSavePR = () => {
    if (items.length === 0 || !requestedBy || !date) {
      toast({ title: 'Data tidak lengkap', description: 'Nama pemohon, tanggal, dan minimal satu produk harus diisi.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const newPR: NewPurchaseRequest = {
        date,
        items,
        requestedBy,
        notes,
        status: 'Pending Approval',
      };

      const result = await addPurchaseRequest(newPR);
      
      if (result.error) {
        toast({ title: 'Gagal Menyimpan PR', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Purchase Request Berhasil Dibuat', description: `PR dari ${requestedBy} telah dibuat dan menunggu persetujuan.` });
        resetForm();
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
        <Button variant="ghost" onClick={onBack} className="w-fit -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Buat Purchase Request Baru</h1>
        <Card>
          <CardHeader>
            <CardTitle>Detail Permintaan Pembelian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Pemohon</Label>
                <Input value={requestedBy} onChange={e => setRequestedBy(e.target.value)} placeholder="Contoh: Dept. Marketing"/>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Permintaan</Label>
                <DatePicker date={date} setDate={setDate} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan / Alasan</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contoh: Untuk kebutuhan event bulan depan"/>
            </div>
            <div className="space-y-2">
               <Label>Item yang Diminta</Label>
               {items.length > 0 && (
                  <div className="border rounded-md">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Produk</TableHead>
                                  <TableHead className="w-[120px]">Jumlah</TableHead>
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
               <ProductPicker products={products} onSelect={addItem} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSavePR} disabled={isPending || items.length === 0 || !requestedBy}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Kirim untuk Persetujuan
            </Button>
          </CardFooter>
        </Card>
    </div>
  );
}

function PurchaseRequestDetail({ pr, onBack }: { pr: PurchaseRequest, onBack: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleUpdateStatus = (status: 'Approved' | 'Rejected') => {
        startTransition(async () => {
            const result = await updatePurchaseRequestStatus(pr.id, status);
            if (result.error) {
                toast({ title: 'Gagal Memperbarui Status', description: result.error, variant: 'destructive'});
            } else {
                toast({ title: 'Status Berhasil Diperbarui' });
                onBack();
            }
        });
    }
    
    return (
    <div className="flex flex-col gap-6">
        <Button variant="ghost" onClick={onBack} className="w-fit -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
        </Button>
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Detail PR #{pr.id}</h1>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Permintaan dari: {pr.requestedBy}</CardTitle>
                        <CardDescription>
                            Tanggal: {format(pr.date, "dd MMMM yyyy", { locale: id })}
                        </CardDescription>
                    </div>
                    <PRStatusBadge status={pr.status}/>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {pr.notes && (
                    <div className="space-y-2">
                        <Label>Catatan/Alasan Permintaan</Label>
                        <p className="text-sm p-3 bg-muted rounded-md">{pr.notes}</p>
                    </div>
                )}
                 <div className="space-y-2">
                    <Label>Item yang Diminta</Label>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pr.items.map(item => (
                                <TableRow key={item.productId}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
            {pr.status === 'Pending Approval' && (
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="destructive" onClick={() => handleUpdateStatus('Rejected')} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4" />}
                        Tolak
                    </Button>
                    <Button onClick={() => handleUpdateStatus('Approved')} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Setujui
                    </Button>
                </CardFooter>
            )}
        </Card>
    </div>
    )
}


function ProductPicker({ products, onSelect }: { products: Product[], onSelect: (product: Product) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          Tambah Produk...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Cari produk..." onValueChange={setValue} />
          <CommandList>
            <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === product.name ? "opacity-100" : "opacity-0")} />
                  {product.name} (Stok: {product.stock})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


function PRStatusBadge({ status }: { status: PurchaseRequest['status'] }) {
    const variants = {
        Draft: 'default',
        'Pending Approval': 'secondary',
        'Approved': 'outline',
        'Rejected': 'destructive',
        'Processed': 'default'
    } as const;
    
    const variantColors: {[key: string]: string} = {
        'Pending Approval': 'bg-yellow-500 text-white',
        'Approved': 'bg-green-500 text-white',
        'Rejected': 'bg-red-500 text-white'
    }

    return <Badge className={cn(variantColors[status])} variant={variants[status] || 'default'}>{status}</Badge>
}