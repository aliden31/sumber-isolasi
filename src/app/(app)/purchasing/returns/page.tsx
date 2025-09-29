'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GoodsReceipt, PurchaseReturn } from '@/lib/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { generateId } from '@/lib/id';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import { RotateCcw } from 'lucide-react';

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = usePersistentState<PurchaseReturn[]>('procurement:returns', []);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState('');
  const [returnDate, setReturnDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('Kualitas tidak sesuai');
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('procurement:receipts');
      if (stored) {
        setReceipts(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load receipts', error);
    }
  }, []);

  const selectedReceipt = useMemo(
    () => receipts.find((receipt) => receipt.id === selectedReceiptId),
    [receipts, selectedReceiptId]
  );

  const totalReturn = useMemo(() => {
    if (!selectedReceipt) return 0;
    return selectedReceipt.items.reduce((acc, item) => acc + item.unitPrice * item.receivedQty, 0);
  }, [selectedReceipt]);

  const handleCreateReturn = () => {
    if (!selectedReceipt) {
      toast({ title: 'Pilih penerimaan yang akan diretur', variant: 'destructive' });
      return;
    }
    const newReturn: PurchaseReturn = {
      id: generateId('PRET'),
      number: `PRET-${new Date().getFullYear()}${String(returns.length + 1).padStart(4, '0')}`,
      supplierName: selectedReceipt.supplierName,
      referenceNumber: selectedReceipt.number,
      returnDate: (returnDate ?? new Date()).toISOString(),
      total: totalReturn,
      reason,
    };
    setReturns([newReturn, ...returns]);
    setSelectedReceiptId('');
    setReturnDate(new Date());
    setReason('Kualitas tidak sesuai');
    setNotes('');
    toast({ title: 'Retur pembelian tercatat', description: newReturn.number });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Retur Pembelian</h1>
          <p className="text-muted-foreground">Catat pengembalian barang ke pemasok dan nilai kompensasinya.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <RotateCcw className="h-5 w-5" /> Retur Baru
          </CardTitle>
          <CardDescription>Pilih penerimaan barang yang ingin dikembalikan kepada pemasok.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Penerimaan Barang</Label>
              <Select value={selectedReceiptId} onValueChange={setSelectedReceiptId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih GRN" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-</SelectItem>
                  {receipts.map((receipt) => (
                    <SelectItem key={receipt.id} value={receipt.id}>
                      {receipt.number} • {receipt.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Retur</Label>
              <DatePicker date={returnDate} setDate={setReturnDate} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">Alasan Retur</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan mengenai barang yang dikembalikan"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
          {selectedReceipt ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Jumlah Diterima</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedReceipt.items.map((item, index) => (
                  <TableRow key={`${item.productId}-${index}`}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.receivedQty}</TableCell>
                    <TableCell>Rp {item.unitPrice.toLocaleString('id-ID')}</TableCell>
                    <TableCell>Rp {(item.unitPrice * item.receivedQty).toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Pilih GRN untuk melihat detail barang.</p>
          )}
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Nilai retur</p>
              <p className="text-lg font-semibold">Rp {totalReturn.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-muted/40">
          <Button onClick={handleCreateReturn} disabled={!selectedReceipt}>
            Simpan Retur
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Riwayat Retur</CardTitle>
          <CardDescription>Data retur pembelian tersimpan di browser untuk keperluan audit.</CardDescription>
        </CardHeader>
        <CardContent>
          {returns.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Belum ada retur dicatat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Alasan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.number}</TableCell>
                    <TableCell>{entry.supplierName}</TableCell>
                    <TableCell>{new Date(entry.returnDate).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{entry.referenceNumber}</TableCell>
                    <TableCell>Rp {entry.total.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.reason}</Badge>
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
