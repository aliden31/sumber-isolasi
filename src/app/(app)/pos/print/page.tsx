
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTransaction } from '../actions';
import type { Transaction } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

export default function PrintReceiptPage() {
  const [txId, setTxId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const handleSearch = () => {
    if (!txId) {
      toast({ title: 'ID Transaksi diperlukan', variant: 'destructive' });
      return;
    }
    startTransition(async () => {
      const result = await getTransaction(txId);
      if (result.error) {
        toast({ title: 'Gagal mencari transaksi', description: result.error, variant: 'destructive' });
        setReceipt(null);
      } else {
        setReceipt(result.data as Transaction);
      }
    });
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Cetak Ulang Struk</h1>
        <Card className="max-w-xl mx-auto w-full">
          <CardHeader>
            <CardTitle>Cari Transaksi</CardTitle>
            <CardDescription>Masukkan ID transaksi untuk mencari dan mencetak ulang struk.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="tx-id">ID Transaksi</Label>
              <div className="flex gap-2">
                <Input
                  id="tx-id"
                  placeholder="Masukkan ID transaksi dari struk"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  disabled={isPending}
                />
                <Button onClick={handleSearch} disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {receipt && (
         <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
          <DialogContent className="max-w-[80mm] print:max-w-full print:shadow-none print:border-none print:p-0">
             <DialogHeader>
                <DialogTitle className="sr-only">Struk Transaksi</DialogTitle>
                <DialogDescription className="sr-only">Cetak ulang struk untuk transaksi #{receipt.id}</DialogDescription>
            </DialogHeader>
            <div className="printable-area font-mono text-xs p-2">
              <div className="text-center space-y-1 mb-4">
                <h2 className="text-base font-bold font-headline">Toko Kilat</h2>
                <p>{new Date(receipt.date).toLocaleString('id-ID')}</p>
                <p>#{receipt.id}</p>
              </div>

              <div className="space-y-1 border-t border-dashed pt-2">
                {receipt.items.map(item => (
                  <div key={item.productId}>
                    <p>{item.productName}</p>
                    <div className="flex justify-between">
                      <span>{item.quantity} x {item.price.toLocaleString('id-ID')}</span>
                      <span>{(item.quantity * item.price).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>Rp {receipt.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pembayaran</span>
                  <span>{receipt.paymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-dashed my-2"></div>
              
              <p className="text-center mt-4">Terima kasih telah berbelanja!</p>
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
           body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
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
            margin: 0;
            padding: 0;
            border: none;
            font-size: 10px !important;
          }
        }
      `}</style>
    </>
  );
}

    