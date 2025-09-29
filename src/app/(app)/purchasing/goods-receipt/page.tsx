'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GoodsReceipt, GoodsReceiptItem, LocalPurchaseOrder } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { generateId } from '@/lib/id';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import { PackageCheck, PackageOpen } from 'lucide-react';

const STATUS_BADGE: Record<GoodsReceipt['status'], 'outline' | 'default'> = {
  Draft: 'outline',
  Diposting: 'default',
};

export default function GoodsReceiptPage() {
  const [receipts, setReceipts] = usePersistentState<GoodsReceipt[]>('procurement:receipts', []);
  const [orders, setOrders] = useState<LocalPurchaseOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [receiptDate, setReceiptDate] = useState<Date | undefined>(new Date());
  const [items, setItems] = useState<GoodsReceiptItem[]>([]);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('procurement:orders');
      if (stored) {
        setOrders(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load orders from storage', error);
    }
  }, []);

  useEffect(() => {
    if (!selectedOrderId) {
      setItems([]);
      return;
    }
    const order = orders.find((po) => po.id === selectedOrderId);
    if (!order) return;
    const mapped: GoodsReceiptItem[] = order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      orderedQty: item.quantity,
      receivedQty: item.quantity,
      unitPrice: item.unitPrice,
    }));
    setItems(mapped);
  }, [orders, selectedOrderId]);

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.receivedQty * item.unitPrice, 0),
    [items]
  );

  const handleSaveReceipt = () => {
    if (!selectedOrderId) {
      toast({ title: 'Pilih PO terlebih dahulu', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'Tidak ada item diterima', variant: 'destructive' });
      return;
    }
    const order = orders.find((po) => po.id === selectedOrderId);
    if (!order) return;
    const newReceipt: GoodsReceipt = {
      id: generateId('GRN'),
      number: `GRN-${new Date().getFullYear()}${String(receipts.length + 1).padStart(4, '0')}`,
      supplierName: order.supplierName,
      receiptDate: (receiptDate ?? new Date()).toISOString(),
      purchaseOrderNumber: order.number,
      status: 'Diposting',
      notes: notes.trim() || undefined,
      items,
    };
    setReceipts([newReceipt, ...receipts]);
    setSelectedOrderId('');
    setNotes('');
    setItems([]);
    setReceiptDate(new Date());
    toast({ title: 'Penerimaan barang disimpan', description: newReceipt.number });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Penerimaan Barang</h1>
          <p className="text-muted-foreground">Catat barang yang masuk dari pemasok dan bandingkan dengan PO.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <PackageCheck className="h-5 w-5" /> Terima Barang
          </CardTitle>
          <CardDescription>Validasi jumlah diterima sebelum menambahkannya ke stok.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pilih PO</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih PO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-</SelectItem>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.number} • {order.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal penerimaan</Label>
              <DatePicker date={receiptDate} setDate={setReceiptDate} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Catatan pemeriksaan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan kondisi barang, nomor batch, dsb"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Dipesan</TableHead>
                <TableHead>Diterima</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Pilih PO untuk menampilkan daftar barang.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={`${item.productId}-${index}`}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.orderedQty}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={item.receivedQty}
                        onChange={(event) =>
                          setItems((prev) =>
                            prev.map((current, idx) =>
                              idx === index
                                ? { ...current, receivedQty: Number(event.target.value) || 0 }
                                : current
                            )
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>Rp {item.unitPrice.toLocaleString('id-ID')}</TableCell>
                    <TableCell>Rp {(item.receivedQty * item.unitPrice).toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Total nilai diterima</p>
              <p className="text-lg font-semibold">Rp {subtotal.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-muted/40">
          <Button onClick={handleSaveReceipt} disabled={!selectedOrderId || items.length === 0}>
            Simpan Penerimaan
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Riwayat GRN</CardTitle>
          <CardDescription>Pantau seluruh barang yang telah diterima dan status penempatannya.</CardDescription>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Belum ada penerimaan dicatat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      <div className="font-medium">{receipt.number}</div>
                      <p className="text-xs text-muted-foreground">PO {receipt.purchaseOrderNumber}</p>
                    </TableCell>
                    <TableCell>{receipt.supplierName}</TableCell>
                    <TableCell>{new Date(receipt.receiptDate).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      Rp
                      {receipt.items
                        .reduce((acc, item) => acc + item.receivedQty * item.unitPrice, 0)
                        .toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[receipt.status]}>{receipt.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <PackageOpen className="mr-2 h-4 w-4" /> Detail
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                          <DialogHeader>
                            <DialogTitle>{receipt.number}</DialogTitle>
                            <DialogDescription>
                              Diterima pada {new Date(receipt.receiptDate).toLocaleString('id-ID')}
                            </DialogDescription>
                          </DialogHeader>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead>Dipesan</TableHead>
                                <TableHead>Diterima</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {receipt.items.map((item, idx) => (
                                <TableRow key={`${receipt.id}-${item.productId}-${idx}`}>
                                  <TableCell>{item.productName}</TableCell>
                                  <TableCell>{item.orderedQty}</TableCell>
                                  <TableCell>{item.receivedQty}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
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
