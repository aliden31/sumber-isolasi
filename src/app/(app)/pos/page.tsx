"use client";

import React, { useState, useMemo } from 'react';
import { PlusCircle, MinusCircle, X, Search, Printer, DollarSign } from 'lucide-react';
import { mockProducts, mockTransactions } from '@/lib/data';
import type { Product, CartItem, Transaction } from '@/lib/types';
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
} from '@/components/ui/dialog';

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    mockTransactions.filter(tx => new Date(tx.date).toDateString() === new Date().toDateString())
  );
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

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
      if(itemToUpdate && quantity > itemToUpdate.product.stock) {
        toast({
          title: 'Stok tidak mencukupi',
          description: `Stok untuk ${itemToUpdate.product.name} hanya tersisa ${itemToUpdate.product.stock}.`,
          variant: 'destructive',
        });
        return prevCart.map(item =>
          item.product.id === productId ? { ...item, quantity: itemToUpdate.product.stock } : item
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

  const completeTransaction = (paymentMethod: 'Tunai' | 'Transfer') => {
    if (cart.length === 0) {
      toast({ title: 'Keranjang kosong', description: 'Tambahkan produk ke keranjang terlebih dahulu.', variant: 'destructive' });
      return;
    }
    const newTransaction: Transaction = {
      id: `TRX${Date.now()}`,
      date: new Date(),
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      total: cartTotal,
      paymentMethod,
    };
    
    // In a real app, you would update product stock in the database here.
    
    setRecentTransactions(prev => [newTransaction, ...prev]);
    setReceipt(newTransaction);
    setCart([]);
    toast({ title: 'Transaksi Berhasil', description: `Total: Rp ${cartTotal.toLocaleString('id-ID')}` });
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-6rem)]">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Card>
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
          <CardContent className="h-[calc(100vh-20rem)] overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => addToCart(product)}>
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <p className="font-semibold text-sm">{product.name}</p>
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
      <div className="flex flex-col gap-4">
        <Card className="flex-grow flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline">Keranjang</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center">Keranjang belanja kosong.</p>
            ) : (
              <Table>
                <TableBody>
                  {cart.map(item => (
                    <TableRow key={item.product.id}>
                      <TableCell>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">Rp {item.product.price.toLocaleString('id-ID')}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 0)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <Separator />
          <CardFooter className="flex flex-col gap-4 p-4">
            <div className="flex justify-between w-full text-lg font-bold">
              <span>Total</span>
              <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button onClick={() => completeTransaction('Tunai')}>
                <DollarSign className="mr-2 h-4 w-4" /> Tunai
              </Button>
              <Button onClick={() => completeTransaction('Transfer')} variant="secondary">
                Transfer
              </Button>
            </div>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-base">Riwayat Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="max-h-48 overflow-y-auto">
             <Table>
                <TableBody>
                  {recentTransactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <p className="font-medium">{tx.id}</p>
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
                            {mockProducts.find(p => p.id === item.productId)?.name}
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
