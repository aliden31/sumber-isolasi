"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  collection,
  onSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { FileText, Loader2 } from "lucide-react";

import { db } from "@/lib/firebase";
import type { Supplier } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import {
  createPurchaseOrder,
  type PurchaseOrderLineInput,
} from "./actions";

const PO_NUMBER_PREFIX = "PO";

type PurchaseOrderItemForm = PurchaseOrderLineInput & {
  unit?: string;
  notes?: string;
};

type PurchaseRequest = {
  id: string;
  requestNumber: string;
  status?: string;
  requesterName?: string;
  department?: string;
  supplierId?: string;
  supplierName?: string;
  neededBy?: Date;
  createdAt?: Date;
  notes?: string;
  items: PurchaseOrderItemForm[];
};

type TimestampLike = {
  toDate: () => Date;
};

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TimestampLike).toDate === "function"
  ) {
    const parsed = (value as TimestampLike).toDate();
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

function sanitizeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 0 ? 0 : value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.,-]/g, "").replace(",", "."));
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return parsed < 0 ? 0 : parsed;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return 0;
}

function cloneRequestItems(items: PurchaseOrderItemForm[]): PurchaseOrderItemForm[] {
  return items.map((item) => ({ ...item }));
}

function areItemsEqual(
  a: PurchaseOrderItemForm[],
  b: PurchaseOrderItemForm[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => {
    const target = b[index];
    return (
      item.productId === target.productId &&
      item.productName === target.productName &&
      item.quantity === target.quantity &&
      item.unitPrice === target.unitPrice &&
      item.unit === target.unit &&
      item.notes === target.notes
    );
  });
}

function mapPurchaseRequest(
  doc: QueryDocumentSnapshot<DocumentData>,
): PurchaseRequest {
  const data = doc.data() as Record<string, unknown>;
  const requestNumber =
    (typeof data.requestNumber === "string" && data.requestNumber) ||
    (typeof data.referenceNumber === "string" && data.referenceNumber) ||
    (typeof data.prNumber === "string" && data.prNumber) ||
    doc.id;

  const requesterName =
    (typeof data.requesterName === "string" && data.requesterName) ||
    (typeof data.requestedBy === "string" && data.requestedBy) ||
    (typeof data.requester === "string" && data.requester) ||
    undefined;

  const department =
    (typeof data.department === "string" && data.department) ||
    (typeof data.division === "string" && data.division) ||
    undefined;

  const supplierId =
    (typeof data.supplierId === "string" && data.supplierId) || undefined;

  const supplierName =
    (typeof data.supplierName === "string" && data.supplierName) || undefined;

  const rawItems = Array.isArray(data.items) ? data.items : [];

  const items: PurchaseOrderItemForm[] = rawItems
    .map((item, index): PurchaseOrderItemForm | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const itemRecord = item as Record<string, unknown>;
      const productId =
        (typeof itemRecord.productId === "string" && itemRecord.productId) ||
        (typeof itemRecord.id === "string" && itemRecord.id) ||
        "";

      const productName =
        (typeof itemRecord.productName === "string" &&
          itemRecord.productName) ||
        (typeof itemRecord.name === "string" && itemRecord.name) ||
        `Item ${index + 1}`;

      const quantity = sanitizeNumber(
        itemRecord.quantity ?? itemRecord.requestedQuantity ?? 0,
      );

      const unitPrice = sanitizeNumber(
        itemRecord.unitPrice ?? itemRecord.price ?? itemRecord.estimatedPrice ?? 0,
      );

      const unit =
        (typeof itemRecord.unit === "string" && itemRecord.unit) || undefined;

      const note =
        (typeof itemRecord.notes === "string" && itemRecord.notes) || undefined;

      return {
        productId,
        productName,
        quantity,
        unitPrice,
        unit,
        notes: note,
      };
    })
    .filter((item): item is PurchaseOrderItemForm => Boolean(item));

  return {
    id: doc.id,
    requestNumber,
    status: typeof data.status === "string" ? data.status : undefined,
    requesterName,
    department,
    supplierId,
    supplierName,
    neededBy: toDate(data.neededBy),
    createdAt: toDate(data.createdAt),
    notes: typeof data.notes === "string" ? data.notes : undefined,
    items,
  };
}

function generatePoNumber(reference?: string | null) {
  if (reference && reference.trim().length > 0) {
    return `${PO_NUMBER_PREFIX}-${reference.trim().replace(/\s+/g, "-")}`;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${PO_NUMBER_PREFIX}-${year}${month}${day}-${hours}${minutes}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("id-ID");
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function getStatusVariant(status?: string): BadgeVariant {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized.includes("reject") || normalized.includes("tolak")) {
    return "destructive";
  }
  if (normalized.includes("approve") || normalized.includes("setuju")) {
    return "default";
  }
  if (normalized.includes("pending") || normalized.includes("menunggu")) {
    return "secondary";
  }
  return "outline";
}

export default function PurchaseOrderPage() {
  const { toast } = useToast();

  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(
    null,
  );

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [fallbackSupplierName, setFallbackSupplierName] = useState("");

  const [orderItems, setOrderItems] = useState<PurchaseOrderItemForm[]>([]);
  const [itemsDirty, setItemsDirty] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [poNumber, setPoNumber] = useState(() => generatePoNumber());
  const [poNumberDirty, setPoNumberDirty] = useState(false);
  const [poDate, setPoDate] = useState<Date | undefined>(new Date());
  const [expectedDate, setExpectedDate] = useState<Date | undefined>();

  const [isPending, startTransition] = useTransition();

  const previousRequestId = useRef<string | null>(null);

  useEffect(() => {
    setRequestsLoading(true);
    setRequestError(null);

    const requestsRef = collection(db, "purchaseRequests");
    const unsubscribe = onSnapshot(
      requestsRef,
      (snapshot) => {
        const mapped = snapshot.docs.map(mapPurchaseRequest);
        mapped.sort((a, b) => {
          const aTime = a.createdAt?.getTime() ?? 0;
          const bTime = b.createdAt?.getTime() ?? 0;
          return bTime - aTime;
        });
        setPurchaseRequests(mapped);
        setRequestsLoading(false);
        setRequestError(null);
      },
      (error) => {
        console.error("Failed to load purchase requests", error);
        setRequestError("Gagal memuat permintaan pembelian.");
        setRequestsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setSuppliersLoading(true);
    setSupplierError(null);

    const suppliersRef = collection(db, "suppliers");
    const unsubscribe = onSnapshot(
      suppliersRef,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => {
          const data = doc.data() as Partial<Supplier>;
          return {
            id: doc.id,
            name: data.name ?? "Tanpa Nama",
            email: data.email ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
          } satisfies Supplier;
        });
        list.sort((a, b) => a.name.localeCompare(b.name, "id"));
        setSuppliers(list);
        setSuppliersLoading(false);
        setSupplierError(null);
      },
      (error) => {
        console.error("Failed to load suppliers", error);
        setSupplierError("Gagal memuat data supplier.");
        setSuppliersLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (
      selectedRequestId &&
      !purchaseRequests.some((req) => req.id === selectedRequestId)
    ) {
      setSelectedRequestId("");
    }
  }, [purchaseRequests, selectedRequestId]);

  useEffect(() => {
    const nextSelected =
      purchaseRequests.find((request) => request.id === selectedRequestId) ??
      null;
    setSelectedRequest(nextSelected);

    const isNewSelection = nextSelected?.id !== previousRequestId.current;

    if (!nextSelected) {
      setOrderItems([]);
      setFallbackSupplierName("");
      if (isNewSelection) {
        setSelectedSupplierId("");
        setNotes("");
        setNotesDirty(false);
        setItemsDirty(false);
        if (!poNumberDirty) {
          setPoNumber(generatePoNumber());
        }
        setPoNumberDirty(false);
      }
      previousRequestId.current = null;
      return;
    }

    const clonedItems = cloneRequestItems(nextSelected.items);

    if (isNewSelection) {
      setItemsDirty(false);
      setNotesDirty(false);
      setPoNumberDirty(false);
      setOrderItems(clonedItems);
      setNotes(nextSelected.notes ?? "");
      setFallbackSupplierName(nextSelected.supplierName ?? "");
      if (nextSelected.supplierId) {
        setSelectedSupplierId(nextSelected.supplierId);
      } else {
        setSelectedSupplierId("");
      }
      if (!poNumberDirty) {
        setPoNumber(generatePoNumber(nextSelected.requestNumber));
      }
    } else {
      if (!itemsDirty && !areItemsEqual(orderItems, clonedItems)) {
        setOrderItems(clonedItems);
      }
      if (!notesDirty && typeof nextSelected.notes === "string") {
        setNotes(nextSelected.notes);
      }
      if (nextSelected.supplierId && nextSelected.supplierId !== selectedSupplierId) {
        setSelectedSupplierId(nextSelected.supplierId);
      }
      if (
        nextSelected.supplierName &&
        nextSelected.supplierName !== fallbackSupplierName
      ) {
        setFallbackSupplierName(nextSelected.supplierName);
      }
    }

    previousRequestId.current = nextSelected.id;
  }, [
    fallbackSupplierName,
    itemsDirty,
    notesDirty,
    orderItems,
    poNumberDirty,
    purchaseRequests,
    selectedRequestId,
    selectedSupplierId,
  ]);

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === selectedSupplierId) ?? null,
    [selectedSupplierId, suppliers],
  );

  const poTotal = useMemo(
    () =>
      orderItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      ),
    [orderItems],
  );

  const handleQuantityChange = (index: number, value: string) => {
    const numeric = sanitizeNumber(value);
    setOrderItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              quantity: numeric,
            }
          : item,
      ),
    );
    setItemsDirty(true);
  };

  const handleUnitPriceChange = (index: number, value: string) => {
    const numeric = sanitizeNumber(value);
    setOrderItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              unitPrice: numeric,
            }
          : item,
      ),
    );
    setItemsDirty(true);
  };

  const resetForm = () => {
    setSelectedRequestId("");
    setSelectedSupplierId("");
    setFallbackSupplierName("");
    setOrderItems([]);
    setItemsDirty(false);
    setNotes("");
    setNotesDirty(false);
    setPoNumber(generatePoNumber());
    setPoNumberDirty(false);
    setPoDate(new Date());
    setExpectedDate(undefined);
    previousRequestId.current = null;
  };

  const handleSubmit = () => {
    const trimmedPoNumber = poNumber.trim();
    if (!trimmedPoNumber) {
      toast({
        variant: "destructive",
        title: "Nomor PO wajib diisi",
        description:
          "Mohon masukkan nomor pesanan pembelian sebelum menyimpan.",
      });
      return;
    }

    if (!poDate) {
      toast({
        variant: "destructive",
        title: "Tanggal PO belum dipilih",
        description: "Pilih tanggal penerbitan pesanan pembelian.",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Item pesanan kosong",
        description:
          "Tambahkan minimal satu item dari permintaan pembelian untuk membuat PO.",
      });
      return;
    }

    if (orderItems.some((item) => item.quantity <= 0)) {
      toast({
        variant: "destructive",
        title: "Jumlah item tidak valid",
        description:
          "Pastikan setiap item memiliki jumlah lebih dari nol.",
      });
      return;
    }

    if (orderItems.some((item) => item.unitPrice < 0)) {
      toast({
        variant: "destructive",
        title: "Harga satuan tidak valid",
        description: "Harga satuan tidak boleh bernilai negatif.",
      });
      return;
    }

    const supplierName = selectedSupplier?.name || fallbackSupplierName;

    if (!selectedSupplierId && !supplierName) {
      toast({
        variant: "destructive",
        title: "Supplier belum dipilih",
        description:
          "Pilih supplier tujuan atau pastikan permintaan referensi memiliki informasi supplier.",
      });
      return;
    }

    startTransition(async () => {
      const result = await createPurchaseOrder({
        poNumber: trimmedPoNumber,
        supplierId: selectedSupplierId || null,
        supplierName,
        requestId: selectedRequest?.id ?? null,
        requestNumber: selectedRequest?.requestNumber ?? null,
        issueDate: poDate,
        expectedDate: expectedDate ?? null,
        notes: notes.trim() || undefined,
        items: orderItems.map(({ productId, productName, quantity, unitPrice }) => ({
          productId,
          productName,
          quantity,
          unitPrice,
        })),
      });

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Gagal menyimpan PO",
          description: result.error,
        });
        return;
      }

      toast({
        title: "Pesanan pembelian tersimpan",
        description: `PO ${trimmedPoNumber} berhasil dibuat.`,
      });

      resetForm();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold">
            Pesanan Pembelian (Purchase Order)
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Konversi permintaan pembelian yang telah disetujui menjadi dokumen
            pesanan resmi untuk pemasok. Data permintaan terbaru akan muncul
            otomatis tanpa perlu memuat ulang halaman.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Buat Pesanan Pembelian
              </CardTitle>
              <CardDescription>
                Pilih referensi permintaan pembelian lalu lengkapi detail PO
                sebelum dikirim ke pemasok.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="purchase-request">
                    Referensi Permintaan Pembelian
                  </Label>
                  <Select
                    value={selectedRequestId || undefined}
                    onValueChange={setSelectedRequestId}
                    disabled={requestsLoading && purchaseRequests.length === 0}
                  >
                    <SelectTrigger id="purchase-request">
                      <SelectValue
                        placeholder={
                          requestsLoading
                            ? "Memuat permintaan pembelian..."
                            : "Pilih permintaan yang akan dikonversi"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {purchaseRequests.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {requestsLoading
                            ? "Mengambil data dari Firestore..."
                            : "Belum ada permintaan pembelian yang siap dikonversi."}
                        </div>
                      ) : (
                        purchaseRequests.map((request) => (
                          <SelectItem key={request.id} value={request.id}>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">
                                {request.requestNumber}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {request.requesterName || "Tanpa nama pemohon"}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Data permintaan akan terus sinkron dengan Firestore secara
                    real-time.
                  </p>
                  {requestError && (
                    <p className="text-xs text-destructive">{requestError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select
                    value={selectedSupplierId || undefined}
                    onValueChange={(value) => {
                      setSelectedSupplierId(value);
                      setFallbackSupplierName("");
                    }}
                    disabled={suppliersLoading && suppliers.length === 0}
                  >
                    <SelectTrigger id="supplier">
                      <SelectValue
                        placeholder={
                          suppliersLoading
                            ? "Memuat daftar supplier..."
                            : "Pilih supplier tujuan"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {suppliers.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {suppliersLoading
                            ? "Mengambil data supplier..."
                            : "Belum ada data supplier. Tambahkan di menu Supplier."}
                        </div>
                      ) : (
                        suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{supplier.name}</span>
                              {supplier.email && (
                                <span className="text-xs text-muted-foreground">
                                  {supplier.email}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {selectedSupplier ? (
                      <>
                        {selectedSupplier.phone && (
                          <p>Telp: {selectedSupplier.phone}</p>
                        )}
                        {selectedSupplier.address && (
                          <p className="line-clamp-2">
                            Alamat: {selectedSupplier.address}
                          </p>
                        )}
                      </>
                    ) : fallbackSupplierName ? (
                      <p>
                        Referensi dari PR: <span className="font-medium">{fallbackSupplierName}</span>
                      </p>
                    ) : null}
                    {supplierError && (
                      <p className="text-destructive">{supplierError}</p>
                    )}
                  </div>
                </div>
              </div>

              {selectedRequest && (
                <div className="space-y-3 rounded-lg border border-dashed bg-muted/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusVariant(selectedRequest.status)}>
                      {selectedRequest.status ?? "Status tidak tersedia"}
                    </Badge>
                    <span className="font-semibold">
                      PR {selectedRequest.requestNumber}
                    </span>
                    {selectedRequest.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        Dibuat {" "}
                        {format(selectedRequest.createdAt, "dd MMM yyyy", {
                          locale: id,
                        })}
                      </span>
                    )}
                    {selectedRequest.neededBy && (
                      <span className="text-xs text-muted-foreground">
                        Target pemenuhan {" "}
                        {format(selectedRequest.neededBy, "dd MMM yyyy", {
                          locale: id,
                        })}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    {selectedRequest.requesterName && (
                      <p>
                        Diminta oleh: <span className="font-medium">{selectedRequest.requesterName}</span>
                      </p>
                    )}
                    {selectedRequest.department && (
                      <p>
                        Departemen: <span className="font-medium">{selectedRequest.department}</span>
                      </p>
                    )}
                  </div>
                  {selectedRequest.notes && (
                    <p className="text-xs text-muted-foreground/80">
                      Catatan PR: {selectedRequest.notes}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <Label>Item Pesanan</Label>
                {orderItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                    {selectedRequestId
                      ? "Permintaan ini belum memiliki item yang dapat dikonversi."
                      : "Pilih permintaan pembelian untuk menampilkan item yang akan dipesan."}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead className="w-[120px]">Jumlah</TableHead>
                          <TableHead className="w-[150px]">Harga Satuan</TableHead>
                          <TableHead className="text-right w-[150px]">
                            Subtotal
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item, index) => (
                          <TableRow key={`${item.productId}-${index}`}>
                            <TableCell>
                              <div className="font-medium">
                                {item.productName || "Item tanpa nama"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.productId ? `ID: ${item.productId}` : "ID produk belum tersedia"}
                                {item.unit && ` • ${item.unit}`}
                              </div>
                              {item.notes && (
                                <div className="text-xs text-muted-foreground/80">
                                  Catatan: {item.notes}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={Number.isFinite(item.quantity) ? item.quantity : 0}
                                onChange={(event) =>
                                  handleQuantityChange(index, event.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="100"
                                value={
                                  Number.isFinite(item.unitPrice)
                                    ? item.unitPrice
                                    : 0
                                }
                                onChange={(event) =>
                                  handleUnitPriceChange(index, event.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              Rp {formatCurrency(item.quantity * item.unitPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="po-number">Nomor PO</Label>
                <Input
                  id="po-number"
                  value={poNumber}
                  onChange={(event) => {
                    setPoNumber(event.target.value);
                    setPoNumberDirty(true);
                  }}
                  placeholder="Masukkan nomor pesanan"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal PO</Label>
                <DatePicker
                  date={poDate}
                  setDate={(date) => setPoDate(date ?? undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label>Perkiraan Tanggal Penerimaan</Label>
                <DatePicker
                  date={expectedDate}
                  setDate={(date) => setExpectedDate(date ?? undefined)}
                  placeholder="Opsional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="po-notes">Catatan untuk Supplier</Label>
                <Textarea
                  id="po-notes"
                  value={notes}
                  onChange={(event) => {
                    setNotes(event.target.value);
                    setNotesDirty(true);
                  }}
                  rows={6}
                  placeholder="Sertakan instruksi tambahan untuk supplier jika diperlukan"
                />
                <p className="text-xs text-muted-foreground">
                  Catatan ini akan disimpan bersama dokumen pesanan pembelian.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-muted/50 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Nilai Pesanan</p>
            <p className="text-2xl font-bold text-primary">
              Rp {formatCurrency(poTotal)}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={isPending}
            >
              Reset Form
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || orderItems.length === 0}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Pesanan Pembelian"
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
