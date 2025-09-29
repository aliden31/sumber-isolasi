'use client';

import { useMemo, useState } from 'react';
import type { PayableSummary, PurchaseInvoice } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Wallet2 } from 'lucide-react';

const FILTERS = ['Semua', 'Belum Jatuh Tempo', 'Jatuh Tempo', 'Lewat Jatuh Tempo', 'Lunas'] as const;

type FilterOption = (typeof FILTERS)[number];

function computeStatus(invoice: PurchaseInvoice): PayableSummary['status'] {
  if (invoice.status === 'Lunas' || invoice.paidAmount >= invoice.total) {
    return 'Lunas';
  }
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  if (dueDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    return 'Lewat Jatuh Tempo';
  }
  const diff = dueDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (24 * 3600 * 1000));
  return days <= 3 ? 'Jatuh Tempo' : 'Belum Jatuh Tempo';
}

export default function PayablesPage() {
  const [invoices, setInvoices] = usePersistentState<PurchaseInvoice[]>('procurement:invoices', []);
  const [filter, setFilter] = useState<FilterOption>('Semua');
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const { toast } = useToast();

  const summaries = useMemo<PayableSummary[]>(
    () =>
      invoices.map((invoice) => ({
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        supplierName: invoice.supplierName,
        dueDate: invoice.dueDate,
        total: invoice.total,
        paidAmount: invoice.paidAmount,
        status: computeStatus(invoice),
      })),
    [invoices]
  );

  const filtered = useMemo(() => {
    if (filter === 'Semua') return summaries;
    return summaries.filter((summary) => summary.status === filter);
  }, [filter, summaries]);

  const totalOutstanding = useMemo(
    () =>
      summaries.reduce((acc, summary) => acc + Math.max(summary.total - summary.paidAmount, 0), 0),
    [summaries]
  );

  const handleRegisterPayment = () => {
    if (!selectedInvoice) return;
    const newPaid = Math.min(selectedInvoice.total, selectedInvoice.paidAmount + paymentAmount);
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === selectedInvoice.id
          ? {
              ...invoice,
              paidAmount: newPaid,
              status: newPaid >= invoice.total ? 'Lunas' : invoice.status === 'Draft' ? 'Belum Dibayar' : invoice.status,
            }
          : invoice
      )
    );
    toast({ title: 'Pembayaran dicatat', description: selectedInvoice.number });
    setSelectedInvoice(null);
    setPaymentAmount(0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Utang Usaha</h1>
          <p className="text-muted-foreground">Lacak faktur yang belum dibayar dan pantau jadwal jatuh tempo.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Ringkasan
          </CardTitle>
          <CardDescription>Total utang yang belum dibayar dan filter berdasarkan status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-bold">Rp {totalOutstanding.toLocaleString('id-ID')}</p>
          </div>
          <div className="space-y-2">
            <LabelStatusFilter filter={filter} setFilter={setFilter} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Utang</CardTitle>
          <CardDescription>Gunakan tombol "Catat Pembayaran" untuk memperbarui saldo.</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Tidak ada data utang untuk filter ini.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faktur</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Dibayar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((summary) => (
                  <TableRow key={summary.invoiceId}>
                    <TableCell>{summary.invoiceNumber}</TableCell>
                    <TableCell>{summary.supplierName}</TableCell>
                    <TableCell>{new Date(summary.dueDate).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>Rp {summary.total.toLocaleString('id-ID')}</TableCell>
                    <TableCell>Rp {summary.paidAmount.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          summary.status === 'Lunas'
                            ? 'default'
                            : summary.status === 'Lewat Jatuh Tempo'
                            ? 'destructive'
                            : summary.status === 'Jatuh Tempo'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {summary.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={selectedInvoice?.id === summary.invoiceId} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const invoice = invoices.find((item) => item.id === summary.invoiceId);
                              if (invoice) {
                                setSelectedInvoice(invoice);
                                setPaymentAmount(invoice.total - invoice.paidAmount);
                              }
                            }}
                            disabled={summary.status === 'Lunas'}
                          >
                            <Wallet2 className="mr-2 h-4 w-4" /> Catat Pembayaran
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Pembayaran {summary.invoiceNumber}</DialogTitle>
                            <DialogDescription>
                              Tentukan jumlah yang dibayar untuk memperbarui saldo utang.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Input
                              type="number"
                              min={0}
                              max={summary.total - summary.paidAmount}
                              value={paymentAmount}
                              onChange={(event) => setPaymentAmount(Number(event.target.value) || 0)}
                            />
                            <p className="text-sm text-muted-foreground">
                              Sisa setelah pembayaran: Rp{' '}
                              {Math.max(summary.total - summary.paidAmount - paymentAmount, 0).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleRegisterPayment}>Simpan</Button>
                          </DialogFooter>
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

function LabelStatusFilter({ filter, setFilter }: { filter: FilterOption; setFilter: (value: FilterOption) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Filter status</label>
      <Select value={filter} onValueChange={(value: FilterOption) => setFilter(value)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTERS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
