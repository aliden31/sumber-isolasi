'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ProcurementItem, Product, PurchaseRequest, PurchaseRequestStatus, Supplier } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateId } from '@/lib/id';
import { CalendarPlus, CheckCircle2, ChevronDown, ClipboardList, MoreHorizontal, XCircle } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { createPurchaseRequest, updatePurchaseRequestStatus } from '../actions';

const NONE_VALUE = '__none__';
const DEPARTMENTS = ['Operasional', 'Produksi', 'Gudang', 'Penjualan', 'Lainnya'];
const STATUS_BADGE: Record<PurchaseRequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Draft: 'secondary',
  'Menunggu Persetujuan': 'outline',
  Disetujui: 'default',
  Ditolak: 'destructive',
};

interface ItemDraft {
  productId: string;
  quantity: number;
  notes: string;
}

export default function PurchaseRequestPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [neededBy, setNeededBy] = useState<Date | undefined>();
  const [itemDraft, setItemDraft] = useState<ItemDraft>({ productId: '', quantity: 1, notes: '' });
  const [draftItems, setDraftItems] = useState<ProcurementItem[]>([]);
  const [form, setForm] = useState({ requestedBy: '', department: '', supplierId: '', notes: '' });
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();
  const [isUpdatingStatus, startUpdateStatus] = useTransition();

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product)));
    });
    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      setSuppliers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Supplier)));
    });
    const unsubRequests = onSnapshot(collection(db, 'purchaseRequests'), (snapshot) => {
      const list = snapshot.docs
        .map((doc) => {
          const data = doc.data() as any;
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          const neededByValue = data.neededBy?.toDate
            ? data.neededBy.toDate().toISOString()
            : data.neededBy ?? undefined;
          return {
            id: doc.id,
            number: data.number ?? doc.id,
            requestedBy: data.requestedBy ?? '',
            department: data.department ?? '',
            supplierId: data.supplierId ?? undefined,
            supplierName: data.supplierName ?? undefined,
            neededBy: neededByValue,
            notes: data.notes ?? undefined,
            createdAt,
            status: (data.status as PurchaseRequestStatus) ?? 'Draft',
            items: Array.isArray(data.items) ? data.items : [],
          } satisfies PurchaseRequest;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(list);
    });

    return () => {
      unsubProducts();
      unsubSuppliers();
      unsubRequests();
    };
  }, []);

  const supplierMap = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers]);
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const addItemToDraft = () => {
    if (!itemDraft.productId) {
      toast({ title: 'Pilih produk', description: 'Produk wajib diisi sebelum ditambahkan.', variant: 'destructive' });
      return;
    }
    const product = productMap.get(itemDraft.productId);
    if (!product) {
      toast({ title: 'Produk tidak ditemukan', variant: 'destructive' });
      return;
    }
    if (itemDraft.quantity <= 0) {
      toast({ title: 'Jumlah tidak valid', description: 'Masukkan jumlah lebih dari nol.', variant: 'destructive' });
      return;
    }

    const newItem: ProcurementItem = {
      productId: product.id,
      productName: product.name,
      quantity: itemDraft.quantity,
      ...(itemDraft.notes.trim() ? { notes: itemDraft.notes.trim() } : {}),
    };

    setDraftItems((prev) => [...prev, newItem]);
    setItemDraft({ productId: '', quantity: 1, notes: '' });
  };

  const handleCreateRequest = () => {
    if (!form.requestedBy.trim() || !form.department) {
      toast({ title: 'Lengkapi data pemohon', description: 'Nama pemohon dan departemen wajib diisi.', variant: 'destructive' });
      return;
    }
    if (draftItems.length === 0) {
      toast({ title: 'Belum ada item', description: 'Tambahkan minimal satu produk ke permintaan.', variant: 'destructive' });
      return;
    }
    const supplierName = supplierMap.get(form.supplierId)?.name;

    startSaving(async () => {
      const noteLines = [
        supplierName ? `Pemasok direkomendasikan: ${supplierName}` : undefined,
        form.notes.trim() || undefined,
      ].filter(Boolean) as string[];

      const sanitizedItems = draftItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        ...(typeof item.unitPrice === 'number' ? { unitPrice: item.unitPrice } : {}),
        ...(item.notes ? { notes: item.notes } : {}),
      }));

      const result = await createPurchaseRequest({
        number: generateId('PR'),
        requestedBy: form.requestedBy.trim(),
        department: form.department,
        supplierId: form.supplierId || undefined,
        supplierName,
        neededBy,
        notes: noteLines.length ? noteLines.join('\n') : undefined,
        createdAt: new Date(),
        status: 'Menunggu Persetujuan',
        items: sanitizedItems,
      });

      if (result.error) {
        toast({ title: 'Gagal membuat permintaan', description: result.error, variant: 'destructive' });
        return;
      }

      toast({ title: 'Permintaan pembelian dibuat', description: 'Permintaan tersimpan di database.' });
      setForm({ requestedBy: '', department: '', supplierId: '', notes: '' });
      setItemDraft({ productId: '', quantity: 1, notes: '' });
      setNeededBy(undefined);
      setDraftItems([]);
    });
  };

  const updateStatus = (request: PurchaseRequest, status: PurchaseRequestStatus) => {
    startUpdateStatus(async () => {
      const result = await updatePurchaseRequestStatus(request.id, status);
      if (result.error) {
        toast({ title: 'Gagal memperbarui status', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Status diperbarui', description: `${request.number} sekarang ${status}.` });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Permintaan Pembelian</h1>
          <p className="text-muted-foreground">
            Catat kebutuhan barang dari setiap departemen dan kirim untuk persetujuan sebelum dibuatkan PO.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Permintaan Baru
          </CardTitle>
          <CardDescription>
            Tentukan pemohon, departemen, dan daftar barang yang dibutuhkan. Data akan langsung tersimpan di database Firebase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requested-by">Nama Pemohon</Label>
              <Input
                id="requested-by"
                placeholder="Contoh: Budi Santoso"
                value={form.requestedBy}
                onChange={(event) => setForm((prev) => ({ ...prev, requestedBy: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departemen</Label>
              <Select
                value={form.department}
                onValueChange={(value) => setForm((prev) => ({ ...prev, department: value }))}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Rekomendasi Pemasok (opsional)</Label>
              <Select
                value={form.supplierId || NONE_VALUE}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, supplierId: value === NONE_VALUE ? '' : value }))
                }
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Pilih pemasok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Tidak ada</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Butuh sebelum</Label>
              <DatePicker date={neededBy} setDate={setNeededBy} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Catatan tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Informasi tambahan untuk tim purchasing"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-semibold">Daftar Barang</h3>
                <p className="text-sm text-muted-foreground">
                  Tambahkan setiap produk yang dibutuhkan beserta jumlahnya.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="md:col-span-3 space-y-2">
                <Label>Produk</Label>
                <Select
                  value={itemDraft.productId}
                  onValueChange={(value) => setItemDraft((prev) => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} — Stok {product.stock.toLocaleString('id-ID')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="quantity">Jumlah</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={itemDraft.quantity}
                  onChange={(event) =>
                    setItemDraft((prev) => ({ ...prev, quantity: Number(event.target.value) || 0 }))
                  }
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="item-notes">Catatan Item</Label>
                <Input
                  id="item-notes"
                  placeholder="Spesifikasi, warna, dsb"
                  value={itemDraft.notes}
                  onChange={(event) => setItemDraft((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={addItemToDraft}>
                <CalendarPlus className="mr-2 h-4 w-4" /> Tambah ke daftar
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draftItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada item ditambahkan.
                    </TableCell>
                  </TableRow>
                ) : (
                  draftItems.map((item, index) => (
                    <TableRow key={`${item.productId}-${index}`}>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                        {productMap.get(item.productId) && (
                          <p className="text-sm text-muted-foreground">
                            Stok saat ini: {productMap.get(item.productId)!.stock.toLocaleString('id-ID')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="max-w-xs">{item.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDraftItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                          }
                        >
                          Hapus
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-muted/40">
          <Button onClick={handleCreateRequest} disabled={draftItems.length === 0 || isSaving}>
            {isSaving ? 'Menyimpan...' : 'Ajukan Permintaan'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Riwayat Permintaan</CardTitle>
          <CardDescription>Semua permintaan tersimpan di database sehingga dapat dilacak oleh tim purchasing.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Belum ada permintaan yang tercatat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Dibutuhkan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.number}</div>
                      <p className="text-xs text-muted-foreground">
                        Dibuat {new Date(request.createdAt).toLocaleString('id-ID')}
                      </p>
                    </TableCell>
                    <TableCell>{request.requestedBy}</TableCell>
                    <TableCell>{request.department}</TableCell>
                    <TableCell>
                      {request.neededBy ? (
                        new Date(request.neededBy).toLocaleDateString('id-ID')
                      ) : (
                        <span className="text-muted-foreground">Belum ditentukan</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[request.status]}>{request.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Detail
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detail {request.number}</DialogTitle>
                              <DialogDescription>
                                Permintaan oleh {request.requestedBy} • {request.department}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {(request.supplierName || request.notes) && (
                                <div className="space-y-2">
                                  {request.supplierName && (
                                    <div className="rounded-md bg-muted/40 p-3 text-sm">
                                      <span className="font-medium">Rekomendasi pemasok:</span> {request.supplierName}
                                    </div>
                                  )}
                                  {request.notes && (
                                    <div className="rounded-md bg-muted/60 p-3 text-sm whitespace-pre-line">
                                      {request.notes}
                                    </div>
                                  )}
                                </div>
                              )}
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Catatan</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {request.items.map((item) => (
                                    <TableRow key={`${request.id}-${item.productId}`}>
                                      <TableCell>{item.productName}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>{item.notes || '-'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ubah Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateStatus(request, 'Menunggu Persetujuan')}
                              disabled={isUpdatingStatus}
                            >
                              <ChevronDown className="mr-2 h-4 w-4" /> Tandai Menunggu
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus(request, 'Disetujui')}
                              disabled={isUpdatingStatus}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Setujui Permintaan
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus(request, 'Ditolak')}
                              disabled={isUpdatingStatus}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Tolak Permintaan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
