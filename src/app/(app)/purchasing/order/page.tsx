'use client';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  collection,
  onSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

const NEW_NOTE_PREFIX = 'Recommended supplier from request:';
const LEGACY_NOTE_PREFIXES = [
  'Recommended supplier:',
  'Supplier recommendation:',
  'Suggested supplier:',
  'Recommended vendor:',
  'Rekomendasi supplier:',
  'Rekomendasi pemasok:',
];
const FALLBACK_NOTE_PATTERN =
  /(recommended|suggested|rekomendasi)\s+(supplier|vendor|pemasok)(?:\s+(?:from|dari)\s+(?:request|permintaan))?[:\-–—•]\s*(.+)$/i;

type SupplierSummary = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type PurchaseRequestItem = {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit?: string;
};

type PurchaseRequest = {
  id: string;
  reference: string;
  status: string;
  requestedAt?: Date;
  note?: string;
  recommendedSupplierNote?: string;
  recommendedSupplierId?: string;
  recommendedSupplierName?: string;
  items: PurchaseRequestItem[];
};

type RecommendationSource =
  | 'direct-id'
  | 'direct-name'
  | 'note-new'
  | 'note-legacy'
  | 'note-fallback';

type ExtractedSupplier = {
  supplierId?: string;
  supplierName?: string;
  matchedPrefix: string;
  rawValue: string;
};

type RecommendedSupplierResult = {
  supplier: SupplierSummary | null;
  source: RecommendationSource | null;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return 0;
}

function normaliseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  if (typeof value === 'object' && value) {
    const maybeDate = (value as { toDate?: () => Date }).toDate?.();
    if (maybeDate instanceof Date && !Number.isNaN(maybeDate.getTime())) {
      return maybeDate;
    }
    const seconds = (value as { seconds?: number }).seconds;
    if (typeof seconds === 'number') {
      const nanos = (value as { nanoseconds?: number }).nanoseconds ?? 0;
      const date = new Date(seconds * 1000 + nanos / 1_000_000);
      return Number.isNaN(date.getTime()) ? undefined : date;
    }
  }
  return undefined;
}

function parseSupplierIdentifier(value: string): Pick<ExtractedSupplier, 'supplierId' | 'supplierName'> {
  let supplierId: string | undefined;
  let supplierName = value.trim();

  const parenthesisMatch = value.match(/\((?:ID|Id|id)[:=]\s*([^)]*)\)/);
  if (parenthesisMatch?.[1]) {
    supplierId = parenthesisMatch[1].trim();
    supplierName = supplierName.replace(parenthesisMatch[0], '').trim();
  }

  if (!supplierId) {
    const bracketMatch = value.match(/\[id[:=]?\s*([^\]]+)\]/i);
    if (bracketMatch?.[1]) {
      supplierId = bracketMatch[1].trim();
      supplierName = supplierName.replace(bracketMatch[0], '').trim();
    }
  }

  if (!supplierId) {
    const pipeMatch = value.match(/\bID[:=]\s*([A-Za-z0-9_-]+)/i);
    if (pipeMatch?.[1]) {
      supplierId = pipeMatch[1].trim();
      supplierName = supplierName.replace(pipeMatch[0], '').trim();
    }
  }

  if (!supplierId) {
    const hashMatch = value.match(/#([A-Za-z0-9_-]{6,})/);
    if (hashMatch?.[1]) {
      supplierId = hashMatch[1].trim();
      supplierName = supplierName.replace(hashMatch[0], '').trim();
    }
  }

  if (!supplierId) {
    const pipeSeparatorMatch = value.match(/(.+?)[|\-–—]\s*(?:ID|Id|id)[:=]?\s*([A-Za-z0-9_-]+)/);
    if (pipeSeparatorMatch?.[2]) {
      supplierId = pipeSeparatorMatch[2].trim();
      supplierName = pipeSeparatorMatch[1].trim();
    }
  }

  supplierName = supplierName
    .replace(/\((?:ID|Id|id)[:=]\s*[^)]*\)/g, '')
    .replace(/\[id[:=]?\s*[^\]]+\]/gi, '')
    .replace(/\bID[:=]\s*[A-Za-z0-9_-]+\b/gi, '')
    .replace(/#([A-Za-z0-9_-]{6,})/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[|•\-–—]\s*$/, '')
    .trim();

  return {
    supplierId: supplierId && supplierId.length > 0 ? supplierId : undefined,
    supplierName: supplierName.length > 0 ? supplierName : undefined,
  };
}

function extractRecommendedSupplierFromNote(note?: string | null): ExtractedSupplier | null {
  if (!note) return null;
  const trimmed = note.trim();
  if (!trimmed) return null;

  const prefixes = [NEW_NOTE_PREFIX, ...LEGACY_NOTE_PREFIXES];
  for (const prefix of prefixes) {
    const regex = new RegExp(`^${escapeRegex(prefix)}\s*(.+)$`, 'i');
    const match = trimmed.match(regex);
    if (match?.[1]) {
      const payload = match[1].trim();
      if (!payload) return null;
      return {
        ...parseSupplierIdentifier(payload),
        matchedPrefix: prefix,
        rawValue: payload,
      };
    }
  }

  const fallbackMatch = trimmed.match(FALLBACK_NOTE_PATTERN);
  if (fallbackMatch?.[3]) {
    const payload = fallbackMatch[3].trim();
    if (!payload) return null;
    return {
      ...parseSupplierIdentifier(payload),
      matchedPrefix: 'fallback',
      rawValue: payload,
    };
  }

  return null;
}

function mapPurchaseRequest(doc: QueryDocumentSnapshot<DocumentData>): PurchaseRequest {
  const data = doc.data() ?? {};

  const recommendedSupplierNoteCandidates = [
    data.recommendedSupplierNote,
    data.supplierRecommendationNote,
    data.recommendedNote,
    data.recommendedSupplierText,
    data.recommendation,
    data.notes,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  const recommendedSupplierNote = recommendedSupplierNoteCandidates.find((value) =>
    value.toLowerCase().includes('supplier') || value.toLowerCase().includes('vendor')
  );

  const directSupplierIdCandidates = [
    data.recommendedSupplierId,
    data.supplierRecommendationId,
    data.recommendedSupplier?.id,
    data.recommendedVendorId,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  const directSupplierNameCandidates = [
    data.recommendedSupplierName,
    data.supplierRecommendationName,
    data.recommendedSupplier?.name,
    data.recommendedVendorName,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  const generalNoteCandidates = [
    data.generalNote,
    data.internalNote,
    data.note,
    data.notes,
    data.description,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  let generalNote = generalNoteCandidates.find((value) => value.trim() !== recommendedSupplierNote?.trim());

  if (!generalNote && typeof data.note === 'string' && data.note.trim().length > 0) {
    const candidate = data.note.trim();
    if (candidate !== recommendedSupplierNote?.trim()) {
      generalNote = candidate;
    }
  }

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: PurchaseRequestItem[] = rawItems.map((item: any, index: number) => {
    const productName =
      typeof item.productName === 'string'
        ? item.productName
        : typeof item.name === 'string'
          ? item.name
          : `Item ${index + 1}`;

    return {
      id: String(item.id ?? item.productId ?? index),
      productId:
        typeof item.productId === 'string' && item.productId.trim().length > 0
          ? item.productId
          : undefined,
      productName,
      quantity: safeNumber(item.quantity ?? item.qty ?? item.requestedQuantity),
      unit:
        typeof item.unit === 'string' && item.unit.trim().length > 0
          ? item.unit
          : typeof item.uom === 'string' && item.uom.trim().length > 0
            ? item.uom
            : undefined,
    };
  });

  return {
    id: doc.id,
    reference:
      typeof data.requestNumber === 'string' && data.requestNumber.trim().length > 0
        ? data.requestNumber
        : typeof data.reference === 'string' && data.reference.trim().length > 0
          ? data.reference
          : typeof data.code === 'string' && data.code.trim().length > 0
            ? data.code
            : typeof data.number === 'string' && data.number.trim().length > 0
              ? data.number
              : `PR-${doc.id.slice(-6).toUpperCase()}`,
    status:
      typeof data.status === 'string' && data.status.trim().length > 0
        ? data.status
        : typeof data.state === 'string' && data.state.trim().length > 0
          ? data.state
          : 'Draft',
    requestedAt: normaliseDate(
      data.requestedAt ?? data.requestDate ?? data.createdAt ?? data.date ?? data.timestamp
    ),
    note: generalNote,
    recommendedSupplierNote,
    recommendedSupplierId: directSupplierIdCandidates[0],
    recommendedSupplierName: directSupplierNameCandidates[0],
    items,
  };
}

function mapSupplier(doc: QueryDocumentSnapshot<DocumentData>): SupplierSummary {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    name:
      typeof data.name === 'string' && data.name.trim().length > 0
        ? data.name
        : `Supplier ${doc.id.slice(-4).toUpperCase()}`,
    email: typeof data.email === 'string' ? data.email : undefined,
    phone: typeof data.phone === 'string' ? data.phone : undefined,
  };
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalised = status.toLowerCase();
  if (['approved', 'disetujui', 'completed', 'selesai'].includes(normalised)) {
    return 'default';
  }
  if (['submitted', 'pending', 'waiting approval', 'menunggu'].includes(normalised)) {
    return 'secondary';
  }
  if (['rejected', 'cancelled', 'ditolak', 'dibatalkan'].includes(normalised)) {
    return 'destructive';
  }
  return 'outline';
}

function findRecommendedSupplier(
  request: PurchaseRequest,
  suppliers: SupplierSummary[],
): RecommendedSupplierResult {
  if (!suppliers.length) {
    return { supplier: null, source: null };
  }

  if (request.recommendedSupplierId) {
    const match = suppliers.find((supplier) => supplier.id === request.recommendedSupplierId);
    if (match) {
      return { supplier: match, source: 'direct-id' };
    }
  }

  if (request.recommendedSupplierName) {
    const match = suppliers.find(
      (supplier) => supplier.name.toLowerCase() === request.recommendedSupplierName?.toLowerCase(),
    );
    if (match) {
      return { supplier: match, source: 'direct-name' };
    }
  }

  const extraction = extractRecommendedSupplierFromNote(request.recommendedSupplierNote);
  if (extraction) {
    if (extraction.supplierId) {
      const match = suppliers.find((supplier) => supplier.id === extraction.supplierId);
      if (match) {
        return {
          supplier: match,
          source: extraction.matchedPrefix === NEW_NOTE_PREFIX ? 'note-new' : 'note-legacy',
        };
      }
    }

    if (extraction.supplierName) {
      const match = suppliers.find(
        (supplier) => supplier.name.toLowerCase() === extraction.supplierName?.toLowerCase(),
      );
      if (match) {
        return {
          supplier: match,
          source:
            extraction.matchedPrefix === NEW_NOTE_PREFIX
              ? 'note-new'
              : extraction.matchedPrefix === 'fallback'
                ? 'note-fallback'
                : 'note-legacy',
        };
      }
    }
  }

  return { supplier: null, source: null };
}

function formatDate(value?: Date): string {
  if (!value) return '-';
  try {
    return format(value, 'dd MMM yyyy');
  } catch {
    return '-';
  }
}

export default function PurchaseOrderPage() {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [autoSelectionSource, setAutoSelectionSource] = useState<RecommendationSource | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'purchaseRequests'), (snapshot) => {
      const mapped = snapshot.docs.map(mapPurchaseRequest);
      setPurchaseRequests(mapped);
      setIsLoadingRequests(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      const mapped = snapshot.docs.map(mapSupplier).sort((a, b) => a.name.localeCompare(b.name));
      setSuppliers(mapped);
      setIsLoadingSuppliers(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!purchaseRequests.length) {
      if (selectedRequestId) {
        setSelectedRequestId('');
      }
      return;
    }

    if (selectedRequestId && purchaseRequests.some((request) => request.id === selectedRequestId)) {
      return;
    }

    setSelectedRequestId(purchaseRequests[0].id);
  }, [purchaseRequests, selectedRequestId]);

  const selectedRequest = useMemo(
    () => purchaseRequests.find((request) => request.id === selectedRequestId),
    [purchaseRequests, selectedRequestId],
  );

  const extractedRecommendation = useMemo(
    () => extractRecommendedSupplierFromNote(selectedRequest?.recommendedSupplierNote ?? null),
    [selectedRequest?.recommendedSupplierNote],
  );

  useEffect(() => {
    if (!selectedRequest) {
      if (selectedSupplierId) {
        setSelectedSupplierId('');
      }
      setAutoSelectionSource(null);
      return;
    }

    const { supplier, source } = findRecommendedSupplier(selectedRequest, suppliers);

    if (supplier) {
      setSelectedSupplierId((previous) => (previous === supplier.id ? previous : supplier.id));
      setAutoSelectionSource(source);
      return;
    }

    if (selectedSupplierId && !suppliers.some((supplier) => supplier.id === selectedSupplierId)) {
      setSelectedSupplierId('');
    }
    setAutoSelectionSource(null);
  }, [selectedRequest, suppliers, selectedSupplierId]);

  const isLoading = isLoadingRequests || isLoadingSuppliers;
  const requestHasRecommendation = Boolean(
    selectedRequest?.recommendedSupplierId ||
      selectedRequest?.recommendedSupplierName ||
      selectedRequest?.recommendedSupplierNote,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Pesanan Pembelian (Purchase Order)
        </h1>
        <p className="text-sm text-muted-foreground">
          Konversikan Permintaan Pembelian menjadi Pesanan Pembelian dan pastikan supplier rekomendasi diikuti.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Mulai dari Permintaan Pembelian</CardTitle>
          <CardDescription>
            Pilih permintaan yang sudah direkomendasikan suppliernya untuk membuat PO baru.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat data permintaan dan supplier...
            </div>
          ) : purchaseRequests.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada permintaan pembelian yang dapat dikonversi menjadi pesanan.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="request-select">Permintaan Pembelian</Label>
                  <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                    <SelectTrigger id="request-select">
                      <SelectValue placeholder="Pilih permintaan" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseRequests.map((request) => (
                        <SelectItem key={request.id} value={request.id}>
                          <div className="flex flex-col text-left">
                            <span className="font-medium">{request.reference}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(request.requestedAt)} • {request.status}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-select">Supplier</Label>
                  <Select
                    value={selectedSupplierId}
                    onValueChange={setSelectedSupplierId}
                    disabled={!suppliers.length}
                  >
                    <SelectTrigger id="supplier-select">
                      <SelectValue placeholder={suppliers.length ? 'Pilih supplier' : 'Belum ada supplier'} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div className="flex flex-col text-left">
                            <span className="font-medium">{supplier.name}</span>
                            {(supplier.email || supplier.phone) && (
                              <span className="text-xs text-muted-foreground">
                                {[supplier.email, supplier.phone].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {autoSelectionSource && (
                    <Alert className="mt-3">
                      <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
                      <AlertTitle>Supplier otomatis dipilih</AlertTitle>
                      <AlertDescription>
                        {autoSelectionSource === 'note-new'
                          ? 'Kami mengenali catatan rekomendasi supplier versi terbaru dari permintaan ini.'
                          : autoSelectionSource === 'note-legacy'
                            ? 'Catatan lama masih dikenali sehingga supplier tetap dapat dipilih otomatis.'
                            : autoSelectionSource === 'note-fallback'
                              ? 'Supplier dikenali dari pola catatan lama yang masih kami toleransi.'
                              : autoSelectionSource === 'direct-id'
                                ? 'Permintaan ini menyertakan ID supplier rekomendasi secara eksplisit.'
                                : 'Permintaan ini menyertakan nama supplier rekomendasi secara eksplisit.'}
                      </AlertDescription>
                    </Alert>
                  )}
                  {!autoSelectionSource && requestHasRecommendation && (
                    <Alert className="mt-3" variant="destructive">
                      <Sparkles className="h-4 w-4" aria-hidden />
                      <AlertTitle>Supplier tidak ditemukan</AlertTitle>
                      <AlertDescription>
                        Permintaan ini memiliki catatan rekomendasi namun belum cocok dengan data supplier yang ada.
                        Periksa kembali daftar supplier atau perbarui catatan pada permintaan.
                      </AlertDescription>
                    </Alert>
                  )}
                  {!requestHasRecommendation && selectedRequest && (
                    <p className="text-xs text-muted-foreground">
                      Permintaan ini belum memiliki rekomendasi supplier. Pilih supplier secara manual.
                    </p>
                  )}
                  {extractedRecommendation?.rawValue && (
                    <p className="text-xs text-muted-foreground">
                      Catatan rekomendasi: {extractedRecommendation.rawValue}
                    </p>
                  )}
                </div>
              </div>

              {selectedRequest ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Catatan Permintaan</Label>
                    <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                      {selectedRequest.note ?? 'Permintaan ini tidak memiliki catatan tambahan.'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Rincian Item
                      </h3>
                      <Badge variant="outline">{selectedRequest.items.length} item</Badge>
                    </div>
                    <div className="overflow-hidden rounded-md border">
                      {selectedRequest.items.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[220px]">Produk</TableHead>
                              <TableHead className="w-[120px] text-right">Jumlah</TableHead>
                              <TableHead className="w-[120px]">Satuan</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedRequest.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div className="font-medium">{item.productName}</div>
                                  {item.productId && (
                                    <div className="text-xs text-muted-foreground">ID: {item.productId}</div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.quantity.toLocaleString('id-ID', {
                                    minimumFractionDigits: Number.isInteger(item.quantity) ? 0 : 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </TableCell>
                                <TableCell>{item.unit ?? '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          Permintaan ini belum memiliki rincian item.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Pastikan jumlah dan supplier sesuai sebelum membuat pesanan pembelian.
                    </div>
                    <Button
                      type="button"
                      disabled={!selectedSupplierId || !selectedRequest}
                      onClick={() => {
                        console.info('Mulai PO', {
                          requestId: selectedRequest.id,
                          supplierId: selectedSupplierId,
                        });
                      }}
                    >
                      Buat Pesanan Pembelian
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Pilih permintaan pembelian untuk melihat detailnya.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Permintaan Pembelian Terbuka</CardTitle>
          <CardDescription>
            Daftar permintaan yang siap dikonversi menjadi pesanan pembelian.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingRequests ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat permintaan pembelian...
            </div>
          ) : purchaseRequests.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Tidak ada permintaan pembelian yang aktif.
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permintaan</TableHead>
                    <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Rekomendasi</TableHead>
                    <TableHead className="w-[120px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseRequests.map((request) => {
                    const extraction = extractRecommendedSupplierFromNote(
                      request.recommendedSupplierNote ?? null,
                    );
                    const recommendationLabel =
                      request.recommendedSupplierName ??
                      extraction?.supplierName ??
                      extraction?.supplierId ??
                      request.recommendedSupplierNote ??
                      '—';

                    return (
                      <TableRow key={request.id} className={cn(selectedRequestId === request.id && 'bg-muted/50')}>
                        <TableCell>
                          <div className="font-medium">{request.reference}</div>
                          <div className="text-xs text-muted-foreground">
                            {request.items.length} item • {formatDate(request.requestedAt)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(request.requestedAt)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {recommendationLabel}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequestId(request.id)}
                          >
                            Mulai PO
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
