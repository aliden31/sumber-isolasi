'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  LocalPurchaseOrder,
  ProcurementItem,
  ProcurementOrderItem,
  Product,
  PurchaseOrderStatus,
  PurchaseRequest,
  PurchaseRequestStatus,
  Supplier,
} from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { generateId } from '@/lib/id';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarCheck2, FileText, MoreHorizontal } from 'lucide-react';
import { createPurchaseOrder, updatePurchaseOrderStatus } from '../actions';

const NONE_VALUE = '__none__';
const NO_SUPPLIER_VALUE = '__no_supplier__';

const STATUS_OPTIONS: PurchaseOrderStatus[] = [
  'Draft',
  'Dikirim ke Pemasok',
  'Diterima Parsial',
  'Selesai',
  'Dibatalkan',
];

export default function PurchaseOrderPage() {
  const [orders, setOrders] = useState<LocalPurchaseOrder[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [expectedDate, setExpectedDate] = useState<Date | undefined>();
  const [items, setItems] = useState<ProcurementOrderItem[]>([]);
  const [taxRate, setTaxRate] = useState<number>(11);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const [isSaving, startSaving] = useTransition();
  const [isUpdatingStatus, startUpdatingStatus] = useTransition();

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
            items: Array.isArray(data.items)
              ? data.items.map((item: ProcurementItem) => ({
                  productId: item.productId,
                  productName: item.productName,
                  quantity: item.quantity,
                  ...(typeof item.unitPrice === 'number' ? { unitPrice: item.unitPrice } : {}),
                  ...(item.notes ? { notes: item.notes } : {}),
                }))
              : [],
          } satisfies PurchaseRequest;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(list);
    });
    const unsubOrders = onSnapshot(collection(db, 'purchaseOrders'), (snapshot) => {
      const list = snapshot.docs
        .map((doc) => {
          const data = doc.data() as any;
          const orderDateValue = data.orderDate?.toDate ? data.orderDate.toDate().toISOString() : new Date().toISOString();
          const expectedDateValue = data.expectedDate?.toDate
            ? data.expectedDate.toDate().toISOString()
            : data.expectedDate ?? undefined;
          return {
            id: doc.id,
            number: data.number ?? doc.id,
            supplierId: data.supplierId ?? '',
            supplierName: data.supplierName ?? 'Pemasok',
            requestNumber: data.requestNumber ?? undefined,
            orderDate: orderDateValue,
            expectedDate: expectedDateValue,
            status: (data.status as PurchaseOrderStatus) ?? 'Draft',
            notes: data.notes ?? undefined,
            items: Array.isArray(data.items)
              ? data.items.map((item: ProcurementOrderItem) => ({
                  productId: item.productId,
                  productName: item.productName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice ?? 0,
                  ...(item.notes ? { notes: item.notes } : {}),
                }))
              : [],
            subtotal: Number(data.subtotal) || 0,
            tax: Number(data.tax) || 0,
            total: Number(data.total) || 0,
          } satisfies LocalPurchaseOrder;
        })
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      setOrders(list);
    });
    return () => {
      unsubProducts();
      unsubSuppliers();
      unsubRequests();
      unsubOrders();
    };
  }, []);

  useEffect(() => {
    if (!selectedRequestId) return;
    const request = requests.find((req) => req.id === selectedRequestId);
    if (!request) return;
    const generatedItems: ProcurementOrderItem[] = request.items.map((item) => {
      const product = products.find((product) => product.id === item.productId);
      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: product?.cost ?? 0,
        notes: item.notes,
      };
    });
    setItems(generatedItems);
    if (!supplierId) {
      if (request.supplierId && supplierMap.has(request.supplierId)) {
        setSupplierId(request.supplierId);
        return;
      }
      if (request.notes) {
        const patterns = [
          /Pemasok direkomendasikan: (.*)/i,
          /Pemasok yang disarankan: (.*)/i,
        ];
        for (const pattern of patterns) {
          const match = request.notes.match(pattern);
          if (match) {
            const supplier = suppliers.find((sup) => sup.name === match[1].trim());
            if (supplier) {
              setSupplierId(supplier.id);
              break;
            }
          }
        }
      }
    }
  }, [selectedRequestId, products, requests, supplierId, suppliers]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const supplierMap = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers]);

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    [items]
  );
  const tax = useMemo(() => (subtotal * (taxRate || 0)) / 100, [subtotal, taxRate]);
  const total = subtotal + tax;

  const updateItem = (index: number, next: Partial<ProcurementOrderItem>) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...next } : item))
    );
  };

  const handleSaveOrder = () => {
    if (!supplierId) {
      toast({ title: 'Pilih pemasok terlebih dahulu', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'Tidak ada item PO', description: 'Tambahkan minimal satu item ke PO.', variant: 'destructive' });
      return;
    }
    const request = requests.find((req) => req.id === selectedRequestId);
    const supplierName = supplierMap.get(supplierId)?.name ?? 'Pemasok';
    const orderNumber = generateId('PO');
    const sanitizedItems = items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      ...(item.notes ? { notes: item.notes } : {}),
    }));

    startSaving(async () => {
      const result = await createPurchaseOrder({
        number: orderNumber,
        supplierId,
        supplierName,
        requestNumber: request?.number,
        orderDate: orderDate ?? new Date(),
        expectedDate,
        status: 'Draft',
        notes: notes.trim() || undefined,
        items: sanitizedItems,
        subtotal,
        tax,
        total,
      });

      if (result.error) {
        toast({ title: 'Gagal menyimpan PO', description: result.error, variant: 'destructive' });
        return;
      }

      toast({ title: 'PO disimpan', description: orderNumber });
      setSelectedRequestId('');
      setItems([]);
      setSupplierId('');
      setNotes('');
      setOrderDate(new Date());
      setExpectedDate(undefined);
    });
  };

  const updateStatus = (id: string, status: PurchaseOrderStatus) => {
    startUpdatingStatus(async () => {
      const result = await updatePurchaseOrderStatus(id, status);
      if (result.error) {
        toast({ title: 'Gagal memperbarui status', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Status diperbarui', description: `PO sekarang ${status}.` });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Pesanan Pembelian</h1>
          <p className="text-muted-foreground">
            Konversi permintaan menjadi PO resmi dan pantau status pemesanan ke pemasok.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5" /> PO Baru
          </CardTitle>
          <CardDescription>Gunakan permintaan pembelian yang telah disetujui untuk membuat PO.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Referensi Permintaan</Label>
              <Select
                value={selectedRequestId || NONE_VALUE}
                onValueChange={(value) => setSelectedRequestId(value === NONE_VALUE ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih permintaan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Tidak ada</SelectItem>
                  {requests.map((request) => (
                    <SelectItem key={request.id} value={request.id}>
                      {request.number} • {request.requestedBy}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pemasok</Label>
              <Select
                value={supplierId || NONE_VALUE}
                onValueChange={(value) => setSupplierId(value === NONE_VALUE ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pemasok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Tidak ada</SelectItem>
                  {suppliers.length === 0 && (
                    <SelectItem value={NO_SUPPLIER_VALUE} disabled>
                      Belum ada pemasok
                    </SelectItem>
                  )}
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal PO</Label>
              <DatePicker date={orderDate} setDate={setOrderDate} />
            </div>
            <div className="space-y-2">
              <Label>Perkiraan Tiba</Label>
              <DatePicker date={expectedDate} setDate={setExpectedDate} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="po-notes">Catatan ke pemasok</Label>
              <Textarea
                id="po-notes"
                placeholder="Informasi tambahan atau syarat pembayaran"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-semibold">Item Pemesanan</h3>
              <p className="text-sm text-muted-foreground">Sesuaikan jumlah dan harga beli jika diperlukan.</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga Beli</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Pilih permintaan atau tambahkan item secara manual dari referensi.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={`${item.productId}-${index}`}>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                        {productMap.get(item.productId) && (
                          <p className="text-xs text-muted-foreground">
                            Stok saat ini: {productMap.get(item.productId)!.stock.toLocaleString('id-ID')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, { quantity: Number(event.target.value) || 0 })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(index, { unitPrice: Number(event.target.value) || 0 })
                          }
                        />
                      </TableCell>
                      <TableCell>Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-md p-4 bg-muted/40">
              <div className="flex items-center gap-3">
                <Label htmlFor="tax-rate">PPN (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  value={taxRate}
                  onChange={(event) => setTaxRate(Number(event.target.value) || 0)}
                  className="w-24"
                />
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm text-muted-foreground">Subtotal: Rp {subtotal.toLocaleString('id-ID')}</p>
                <p className="text-sm text-muted-foreground">PPN: Rp {tax.toLocaleString('id-ID')}</p>
                <p className="text-lg font-semibold">Total: Rp {total.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-muted/40">
          <Button onClick={handleSaveOrder} disabled={items.length === 0 || !supplierId || isSaving}>
            Simpan PO
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar PO</CardTitle>
          <CardDescription>Lihat status pemesanan dan detail barang yang dipesan.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Belum ada PO yang dibuat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.number}</div>
                      {order.requestNumber && (
                        <p className="text-xs text-muted-foreground">Referensi {order.requestNumber}</p>
                      )}
                    </TableCell>
                    <TableCell>{order.supplierName}</TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>Rp {order.total.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'Selesai' ? 'default' : order.status === 'Dibatalkan' ? 'destructive' : 'outline'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileText className="mr-2 h-4 w-4" /> Detail
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{order.number}</DialogTitle>
                              <DialogDescription>
                                PO kepada {order.supplierName} • Total Rp {order.total.toLocaleString('id-ID')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {order.notes && (
                                <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-line">{order.notes}</div>
                              )}
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Harga</TableHead>
                                    <TableHead>Subtotal</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map((item, idx) => (
                                    <TableRow key={`${order.id}-${item.productId}-${idx}`}>
                                      <TableCell>{item.productName}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>Rp {item.unitPrice.toLocaleString('id-ID')}</TableCell>
                                      <TableCell>
                                        Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}
                                      </TableCell>
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
                            <DropdownMenuLabel>Ubah status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {STATUS_OPTIONS.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                disabled={isUpdatingStatus}
                                onClick={() => updateStatus(order.id, status)}
                              >
                                {status}
                              </DropdownMenuItem>
                            ))}
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
