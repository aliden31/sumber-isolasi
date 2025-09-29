'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import type { GoodsReceipt, GoodsReceiptItem, PurchaseReturn } from '@/lib/types';
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
import { Label } from '@/components/ui/label';
import { generateId } from '@/lib/id';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import { RotateCcw } from 'lucide-react';
import { db } from '@/lib/firebase';
import { createPurchaseReturn } from '../actions';

const NONE_VALUE = '__none__';

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState('');
  const [returnDate, setReturnDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('Kualitas tidak sesuai');
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    const unsubReceipts = onSnapshot(collection(db, 'goodsReceipts'), (snapshot) => {
      const list = snapshot.docs
        .map((doc) => {
          const data = doc.data() as any;
          const receiptDateValue = data.receiptDate?.toDate
            ? data.receiptDate.toDate().toISOString()
            : data.receiptDate ?? new Date().toISOString();
          return {
            id: doc.id,
            number: data.number ?? doc.id,
            supplierName: data.supplierName ?? 'Pemasok',
            supplierId: data.supplierId ?? undefined,
            receiptDate: receiptDateValue,
            purchaseOrderNumber: data.purchaseOrderNumber ?? '-',
            status: data.status ?? 'Draft',
            notes: data.notes ?? undefined,
            items: Array.isArray(data.items)
              ? data.items.map((item: GoodsReceiptItem) => ({
                  productId: item.productId,
                  productName: item.productName,
                  orderedQty: item.orderedQty,
                  receivedQty: item.receivedQty,
                  unitPrice: item.unitPrice,
                }))
              : [],
          } satisfies GoodsReceipt;
        })
        .sort((a, b) => new Date(b.receiptDate).getTime() - new Date(a.receiptDate).getTime());
      setReceipts(list);
    });

    const unsubReturns = onSnapshot(collection(db, 'purchaseReturns'), (snapshot) => {
      const list = snapshot.docs
        .map((doc) => {
          const data = doc.data() as any;
          const returnDateValue = data.returnDate?.toDate
            ? data.returnDate.toDate().toISOString()
            : data.returnDate ?? new Date().toISOString();
          return {
            id: doc.id,
            number: data.number ?? doc.id,
            supplierName: data.supplierName ?? 'Pemasok',
            supplierId: data.supplierId ?? undefined,
            referenceNumber: data.referenceNumber ?? '-',
            returnDate: returnDateValue,
            total: Number(data.total) || 0,
            reason: data.reason ?? '-',
            notes: data.notes ?? undefined,
          } satisfies PurchaseReturn;
        })
        .sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());
      setReturns(list);
    });

    return () => {
      unsubReceipts();
      unsubReturns();
    };
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
    const returnNumber = generateId('PRET');

    startSaving(async () => {
      const result = await createPurchaseReturn({
        number: returnNumber,
        supplierId: selectedReceipt.supplierId,
        supplierName: selectedReceipt.supplierName,
        referenceNumber: selectedReceipt.number,
        returnDate: returnDate ?? new Date(),
        total: totalReturn,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });

      if (result.error) {
        toast({ title: 'Gagal menyimpan retur', description: result.error, variant: 'destructive' });
        return;
      }

      toast({ title: 'Retur pembelian tercatat', description: returnNumber });
      setSelectedReceiptId('');
      setReturnDate(new Date());
      setReason('Kualitas tidak sesuai');
      setNotes('');
    });
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
              <Select
                value={selectedReceiptId || NONE_VALUE}
                onValueChange={(value) => setSelectedReceiptId(value === NONE_VALUE ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih GRN" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>-</SelectItem>
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
          <Button onClick={handleCreateReturn} disabled={!selectedReceipt || isSaving}>
            Simpan Retur
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Riwayat Retur</CardTitle>
          <CardDescription>Semua retur terekam di database untuk kebutuhan audit dan penagihan.</CardDescription>
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
                      <div className="space-y-1">
                        <Badge variant="outline">{entry.reason}</Badge>
                        {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
                      </div>
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
