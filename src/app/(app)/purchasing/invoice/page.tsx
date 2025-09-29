'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GoodsReceipt, PurchaseInvoice, PurchaseInvoiceStatus } from '@/lib/types';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { generateId } from '@/lib/id';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileCheck, FileSpreadsheet, MoreHorizontal } from 'lucide-react';

const STATUS_OPTIONS: PurchaseInvoiceStatus[] = ['Draft', 'Belum Dibayar', 'Sebagian Dibayar', 'Lunas'];

export default function PurchaseInvoicePage() {
  const [invoices, setInvoices] = usePersistentState<PurchaseInvoice[]>('procurement:invoices', []);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
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

  const selectedReceipts = useMemo(
    () => receipts.filter((receipt) => selectedReceiptIds.includes(receipt.id)),
    [receipts, selectedReceiptIds]
  );

  const subtotal = useMemo(
    () =>
      selectedReceipts.reduce(
        (acc, receipt) =>
          acc + receipt.items.reduce((sum, item) => sum + item.receivedQty * item.unitPrice, 0),
        0
      ),
    [selectedReceipts]
  );

  const tax = useMemo(() => subtotal * 0.11, [subtotal]);
  const total = subtotal + tax;

  const handleToggleReceipt = (id: string) => {
    setSelectedReceiptIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleCreateInvoice = () => {
    if (!supplierName.trim()) {
      toast({ title: 'Nama pemasok wajib diisi', variant: 'destructive' });
      return;
    }
    if (selectedReceipts.length === 0) {
      toast({ title: 'Pilih minimal satu GRN', variant: 'destructive' });
      return;
    }
    const newInvoice: PurchaseInvoice = {
      id: generateId('PINV'),
      number: `PINV-${new Date().getFullYear()}${String(invoices.length + 1).padStart(4, '0')}`,
      supplierName: supplierName.trim(),
      invoiceDate: (invoiceDate ?? new Date()).toISOString(),
      dueDate: dueDate?.toISOString() ?? new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      referenceNumbers: selectedReceipts.map((receipt) => receipt.number),
      subtotal,
      tax,
      total,
      paidAmount,
      status: paidAmount >= total ? 'Lunas' : paidAmount > 0 ? 'Sebagian Dibayar' : 'Belum Dibayar',
      notes: notes.trim() || undefined,
    };
    setInvoices([newInvoice, ...invoices]);
    setSupplierName('');
    setSelectedReceiptIds([]);
    setNotes('');
    setPaidAmount(0);
    setInvoiceDate(new Date());
    setDueDate(undefined);
    toast({ title: 'Faktur pembelian dibuat', description: newInvoice.number });
  };

  const updateStatus = (id: string, status: PurchaseInvoiceStatus) => {
    setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? { ...invoice, status } : invoice)));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Faktur Pemasok</h1>
          <p className="text-muted-foreground">Rekam tagihan pemasok berdasarkan barang yang diterima.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Buat Faktur
          </CardTitle>
          <CardDescription>Pilih penerimaan barang yang ingin ditagih dan tentukan status pembayarannya.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">Nama Pemasok</Label>
              <Input
                id="supplier-name"
                placeholder="Contoh: PT Sumber Makmur"
                value={supplierName}
                onChange={(event) => setSupplierName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Faktur</Label>
              <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
            </div>
            <div className="space-y-2">
              <Label>Jatuh Tempo</Label>
              <DatePicker date={dueDate} setDate={setDueDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid-amount">Pembayaran yang sudah dilakukan</Label>
              <Input
                id="paid-amount"
                type="number"
                min={0}
                value={paidAmount}
                onChange={(event) => setPaidAmount(Number(event.target.value) || 0)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="invoice-notes">Catatan</Label>
              <Textarea
                id="invoice-notes"
                placeholder="Catatan tambahan mengenai faktur"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
          <div>
            <h3 className="font-headline font-semibold mb-2">Pilih Penerimaan Barang</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {receipts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Belum ada penerimaan barang.</p>
              ) : (
                receipts.map((receipt) => {
                  const checked = selectedReceiptIds.includes(receipt.id);
                  const value = receipt.items.reduce((acc, item) => acc + item.receivedQty * item.unitPrice, 0);
                  return (
                    <label
                      key={receipt.id}
                      className={`rounded-md border p-4 flex flex-col gap-1 cursor-pointer transition hover:border-primary ${
                        checked ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{receipt.number}</p>
                          <p className="text-xs text-muted-foreground">PO {receipt.purchaseOrderNumber}</p>
                        </div>
                        <Input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleReceipt(receipt.id)}
                          className="h-5 w-5"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {receipt.supplierName} • {new Date(receipt.receiptDate).toLocaleDateString('id-ID')}
                      </p>
                      <p className="text-sm font-semibold">Rp {value.toLocaleString('id-ID')}</p>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-md p-4 bg-muted/40">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal GRN</p>
              <p className="text-lg font-semibold">Rp {subtotal.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PPN (11%)</p>
              <p className="text-lg font-semibold">Rp {tax.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Faktur</p>
              <p className="text-xl font-bold">Rp {total.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-muted/40">
          <Button onClick={handleCreateInvoice} disabled={selectedReceipts.length === 0 || !supplierName.trim()}>
            Simpan Faktur
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Faktur</CardTitle>
          <CardDescription>Kelola status pembayaran tagihan pemasok.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Belum ada faktur tercatat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-medium">{invoice.number}</div>
                      <p className="text-xs text-muted-foreground">
                        Referensi {invoice.referenceNumbers.join(', ')}
                      </p>
                    </TableCell>
                    <TableCell>{invoice.supplierName}</TableCell>
                    <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>Rp {invoice.total.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'Lunas' ? 'default' : invoice.status === 'Sebagian Dibayar' ? 'secondary' : 'outline'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Perbarui Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {STATUS_OPTIONS.map((status) => (
                            <DropdownMenuItem key={status} onClick={() => updateStatus(invoice.id, status)}>
                              {status}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
