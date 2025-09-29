
"use client";

import React, { useState, useMemo, useTransition, useEffect } from 'react';
import { PlusCircle, MinusCircle, X, Search, Printer, DollarSign, Loader2, ParkingSquare } from 'lucide-react';
import type { Product, CartItem, Transaction, NewTransaction, TransactionItem, NewParkedTransaction } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { createTransaction, parkTransaction } from './actions';
import { collection, getDocs, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // For parking transaction
  const [parkName, setParkName] = useState('');
  const [isParkDialogOpen, setIsParkDialogOpen] = useState(false);

  useEffect(() => {
    // Resume cart from local storage if exists
    const resumedCart = localStorage.getItem('resumedCart');
    if (resumedCart) {
      try {
        setCart(JSON.parse(resumedCart));
      } catch (e) {
        console.error("Failed to parse resumed cart", e)
      }
      localStorage.removeItem('resumedCart');
    }

    const productsCol = collection(db, "products");
    const unsubscribeProducts = onSnapshot(productsCol, (snapshot) => {
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productList);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    const transactionsCol = collection(db, "transactions");
    const q = query(transactionsCol, where("date", ">=", todayTimestamp));
     const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
        const transactionList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate(),
            } as Transaction;
        }).sort((a, b) => b.date.getTime() - a.date.getTime());
       setRecentTransactions(transactionList);
    });

    return () => {
        unsubscribeProducts();
        unsubscribeTransactions();
    }
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map(item =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          toast({
            title: 'Stok tidak mencukupi',
            description: `Stok untuk ${product.name} hanya tersisa ${product.stock}.`,
            variant: 'destructive',
          });
          return prevCart;
        }
      }
      if (product.stock > 0) {
        return [...prevCart, { product, quantity: 1 }];
      } else {
        toast({
          title: 'Stok habis',
          description: `Produk ${product.name} sedang habis.`,
          variant: 'destructive',
        });
        return prevCart;
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => item.product.id !== productId);
      }
      const itemToUpdate = prevCart.find(item => item.product.id === productId);
      const productInStock = products.find(p => p.id === productId);
      
      if(itemToUpdate && productInStock && quantity > productInStock.stock) {
        toast({
          title: 'Stok tidak mencukupi',
          description: `Stok untuk ${productInStock.name} hanya tersisa ${productInStock.stock}.`,
          variant: 'destructive',
        });
        return prevCart.map(item =>
          item.product.id === productId ? { ...item, quantity: productInStock.stock } : item
        );
      }
      return prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }, [cart]);

  const handleParkTransaction = () => {
    if (cart.length === 0) {
      toast({ title: 'Keranjang kosong', description: 'Tidak ada yang bisa diparkir.', variant: 'destructive' });
      return;
    }
    const defaultName = `Diparkir pada ${new Date().toLocaleTimeString('id-ID')}`;
    setParkName(defaultName);
    setIsParkDialogOpen(true);
  }

  const confirmParkTransaction = () => {
      startTransition(async () => {
        const newParkedTx: NewParkedTransaction = {
            name: parkName,
            cart: cart,
            createdAt: new Date(),
        };
        const result = await parkTransaction(newParkedTx);
        if (result.error) {
            toast({ title: 'Gagal Memarkir', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Transaksi Berhasil Diparkir' });
            setCart([]);
            setIsParkDialogOpen(false);
            setParkName('');
        }
      });
  }

  const completeTransaction = (paymentMethod: 'Tunai' | 'Transfer') => {
    if (cart.length === 0) {
      toast({ title: 'Keranjang kosong', description: 'Tambahkan produk ke keranjang terlebih dahulu.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const newTransaction: NewTransaction = {
        date: new Date(),
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          cost: item.product.cost,
        })),
        total: cartTotal,
        paymentMethod,
      };

      const result = await createTransaction(newTransaction);
      
      if (result.error) {
        toast({
          title: 'Transaksi Gagal',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        const generatedReceipt: Transaction = {
            id: result.id!,
            ...newTransaction,
            status: 'Lunas',
        };
        setReceipt(generatedReceipt);
        setCart([]);
        toast({ title: 'Transaksi Berhasil', description: `Total: Rp ${cartTotal.toLocaleString('id-ID')}` });
      }
    });
  };

  const printReceipt = () => {
    window.print();
  };
  
  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Produk Dihapus';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full lg:h-[calc(100vh-6rem)]">
      <div className="lg:col-span-3 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 h-0 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => addToCart(product)}>
                  <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
                    <p className="font-semibold text-xs sm:text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Rp {product.price.toLocaleString('id-ID')}</p>
                    <Badge className="mt-2" variant={product.stock > 0 ? 'secondary' : 'destructive'}>
                      Stok: {product.stock}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card className="flex-grow flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline">Keranjang</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-0 sm:p-6">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center p-6 sm:p-0">Keranjang belanja kosong.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    {cart.map(item => (
                      <TableRow key={item.product.id}>
                        <TableCell className="px-2 sm:px-4">
                          <p className="font-medium text-sm sm:text-base">{item.product.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Rp {item.product.price.toLocaleString('id-ID')}</p>
                        </TableCell>
                        <TableCell className="px-1 sm:px-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span className="text-sm sm:text-base">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium px-2 sm:px-4 text-sm sm:text-base">
                          Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="px-1 sm:px-4">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 0)}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <Separator />
          <CardFooter className="flex flex-col gap-4 p-4">
            <div className="flex justify-between w-full text-md sm:text-lg font-bold">
              <span>Total</span>
              <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
            </div>
             <Button variant="outline" className="w-full" onClick={handleParkTransaction} disabled={cart.length === 0 || isPending}>
                <ParkingSquare className="mr-2 h-4 w-4"/> Parkir Transaksi
             </Button>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button onClick={() => completeTransaction('Tunai')} disabled={cart.length === 0 || isPending}>
                 {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />} Tunai
              </Button>
              <Button onClick={() => completeTransaction('Transfer')} variant="secondary" disabled={cart.length === 0 || isPending}>
                 {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Transfer
              </Button>
            </div>
          </CardFooter>
        </Card>
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle className="font-headline text-base">Riwayat Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="max-h-48 overflow-y-auto">
             <Table>
                <TableBody>
                  {recentTransactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <p className="font-medium font-mono text-xs">{tx.id}</p>
                        <p className="text-sm text-muted-foreground">{new Date(tx.date).toLocaleTimeString('id-ID')}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-medium">Rp {tx.total.toLocaleString('id-ID')}</p>
                        <Badge variant="outline">{tx.paymentMethod}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Park transaction dialog */}
      <Dialog open={isParkDialogOpen} onOpenChange={setIsParkDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Parkir Transaksi</DialogTitle>
                <DialogDescription>Beri nama untuk keranjang ini agar mudah ditemukan nanti.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
                <Label htmlFor="park-name">Nama Parkir</Label>
                <Input id="park-name" value={parkName} onChange={(e) => setParkName(e.target.value)} />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsParkDialogOpen(false)}>Batal</Button>
                <Button onClick={confirmParkTransaction} disabled={isPending || !parkName}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {receipt && (
        <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
          <DialogContent className="max-w-sm print:shadow-none print:border-none">
            <div className="printable-area">
              <DialogHeader className="text-center">
                <DialogTitle className="font-headline text-2xl mx-auto">Toko Kilat</DialogTitle>
                <DialogDescription>
                  {new Date(receipt.date).toLocaleString('id-ID')} <br/>
                  #{receipt.id}
                </DialogDescription>
              </DialogHeader>
              <div className="my-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.items.map(item => (
                       <TableRow key={item.productId}>
                          <TableCell>
                            {item.productName}
                            <div className="text-muted-foreground">
                              {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                          </TableCell>
                       </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Separator className="my-2" />
               <div className="flex justify-between w-full text-md font-bold my-2">
                <span>Total</span>
                <span>Rp {receipt.total.toLocaleString('id-ID')}</span>
              </div>
               <div className="flex justify-between w-full text-sm">
                <span>Metode Pembayaran</span>
                <span>{receipt.paymentMethod}</span>
              </div>
              <p className="text-center text-muted-foreground text-sm mt-6">Terima kasih telah berbelanja!</p>
            </div>
            <DialogFooter className="print:hidden">
              <Button onClick={printReceipt} className="w-full">
                <Printer className="mr-2 h-4 w-4"/> Cetak Struk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
