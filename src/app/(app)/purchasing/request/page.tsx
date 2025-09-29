'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createPurchaseRequest } from '@/app/(app)/purchasing/actions';

const DRAFT_STORAGE_KEY = 'purchase-request-draft';

const createEmptyItem = () => ({
  description: '',
  quantity: '',
  unitPrice: '',
  notes: '',
});

type PurchaseRequestItemDraft = ReturnType<typeof createEmptyItem>;

type PurchaseRequestDraft = {
  requester: string;
  department: string;
  neededBy: string;
  justification: string;
  items: Array<Omit<PurchaseRequestItemDraft, 'notes'> & { notes?: string }>;
};

export default function PurchaseRequestPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    requester: '',
    department: '',
    neededBy: '',
    justification: '',
  });
  const [items, setItems] = useState<PurchaseRequestItemDraft[]>([createEmptyItem()]);
  const [isPending, startTransition] = useTransition();
  const [isRestoring, setIsRestoring] = useState(true);
  const persistDraftRef = useRef(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_STORAGE_KEY) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PurchaseRequestDraft;
        setForm({
          requester: typeof parsed.requester === 'string' ? parsed.requester : '',
          department: typeof parsed.department === 'string' ? parsed.department : '',
          neededBy: typeof parsed.neededBy === 'string' ? parsed.neededBy : '',
          justification: typeof parsed.justification === 'string' ? parsed.justification : '',
        });
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          setItems(
            parsed.items.map((item) => ({
              description: typeof item.description === 'string' ? item.description : '',
              quantity: typeof item.quantity === 'number' ? String(item.quantity) : typeof item.quantity === 'string' ? item.quantity : '',
              unitPrice: typeof item.unitPrice === 'number' ? String(item.unitPrice) : typeof item.unitPrice === 'string' ? item.unitPrice : '',
              notes: typeof item.notes === 'string' ? item.notes : '',
            }))
          );
        }
      } catch (error) {
        console.error('Failed to restore purchase request draft', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    }
    setIsRestoring(false);
    persistDraftRef.current = true;
  }, []);

  useEffect(() => {
    if (!persistDraftRef.current) {
      return;
    }
    const draft: PurchaseRequestDraft = {
      requester: form.requester,
      department: form.department,
      neededBy: form.neededBy,
      justification: form.justification,
      items: items.map(({ description, quantity, unitPrice, notes }) => ({
        description,
        quantity,
        unitPrice,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      })),
    };

    const isDraftEmpty =
      !draft.requester.trim() &&
      !draft.department.trim() &&
      !draft.neededBy &&
      !draft.justification.trim() &&
      draft.items.every((item) => !item.description.trim() && !item.quantity && !item.unitPrice && !('notes' in item));

    if (isDraftEmpty) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [form, items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
        return sum;
      }
      return sum + quantity * unitPrice;
    }, 0);
  }, [items]);

  const handleItemChange = <K extends keyof PurchaseRequestItemDraft>(index: number, field: K) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setItems((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
      );
    };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) {
        return [createEmptyItem()];
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleFieldChange = (field: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const resetForm = () => {
    persistDraftRef.current = false;
    setForm({ requester: '', department: '', neededBy: '', justification: '' });
    setItems([createEmptyItem()]);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setTimeout(() => {
      persistDraftRef.current = true;
    }, 0);
    toast({ title: 'Draft dibersihkan' });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sanitizedItems = items
      .map((item) => {
        const description = item.description.trim();
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const notes = item.notes.trim();

        return {
          description,
          quantity,
          unitPrice,
          notes: notes ? notes : undefined,
        };
      })
      .filter((item) => item.description || Number.isFinite(item.quantity) || Number.isFinite(item.unitPrice) || item.notes);

    if (!form.requester.trim()) {
      toast({ title: 'Pemohon wajib diisi.', variant: 'destructive' });
      return;
    }

    if (!sanitizedItems.length) {
      toast({ title: 'Tambahkan minimal satu item permintaan.', variant: 'destructive' });
      return;
    }

    for (let i = 0; i < sanitizedItems.length; i += 1) {
      const item = sanitizedItems[i];
      if (!item.description) {
        toast({
          title: `Item ${i + 1} belum memiliki deskripsi.`,
          description: 'Isi deskripsi item sebelum mengirim permintaan.',
          variant: 'destructive',
        });
        return;
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        toast({
          title: `Jumlah item ${i + 1} tidak valid.`,
          description: 'Gunakan angka lebih besar dari 0.',
          variant: 'destructive',
        });
        return;
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        toast({
          title: `Harga satuan item ${i + 1} tidak valid.`,
          description: 'Gunakan angka 0 atau lebih besar.',
          variant: 'destructive',
        });
        return;
      }
    }

    const payload = {
      requester: form.requester.trim(),
      department: form.department.trim(),
      neededBy: form.neededBy || null,
      justification: form.justification.trim(),
      items: sanitizedItems,
    } as const;

    startTransition(async () => {
      const result = await createPurchaseRequest(payload);
      if (result.error) {
        toast({
          title: 'Permintaan gagal dikirim',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Permintaan pembelian dikirim',
        description: 'Permintaan Anda telah tersimpan dan menunggu persetujuan.',
      });
      persistDraftRef.current = false;
      setForm({ requester: '', department: '', neededBy: '', justification: '' });
      setItems([createEmptyItem()]);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setTimeout(() => {
        persistDraftRef.current = true;
      }, 0);
    });
  };

  if (isRestoring) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Permintaan Pembelian</h1>
        <p className="text-muted-foreground">
          Buat permintaan pembelian untuk kebutuhan operasional. Simpan draft secara otomatis dan lanjutkan kapan pun Anda siap.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Detail Permintaan</CardTitle>
            <CardDescription>Lengkapi informasi umum permintaan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="requester">Pemohon</Label>
                <Input
                  id="requester"
                  placeholder="Nama pemohon"
                  value={form.requester}
                  onChange={handleFieldChange('requester')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departemen</Label>
                <Input
                  id="department"
                  placeholder="Departemen terkait"
                  value={form.department}
                  onChange={handleFieldChange('department')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neededBy">Dibutuhkan Sebelum</Label>
                <Input
                  id="neededBy"
                  type="date"
                  value={form.neededBy}
                  onChange={handleFieldChange('neededBy')}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="justification">Justifikasi (Opsional)</Label>
                <Textarea
                  id="justification"
                  placeholder="Tuliskan alasan atau keterangan tambahan."
                  value={form.justification}
                  onChange={handleFieldChange('justification')}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Daftar Item</CardTitle>
            <CardDescription>Tambah item yang ingin dibeli beserta catatan tambahan jika diperlukan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Item {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`description-${index}`}>Deskripsi</Label>
                    <Input
                      id={`description-${index}`}
                      placeholder="Contoh: Kertas A4 80gsm"
                      value={item.description}
                      onChange={handleItemChange(index, 'description')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`quantity-${index}`}>Jumlah</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={item.quantity}
                      onChange={handleItemChange(index, 'quantity')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`unitPrice-${index}`}>Harga Satuan</Label>
                    <Input
                      id={`unitPrice-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={item.unitPrice}
                      onChange={handleItemChange(index, 'unitPrice')}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`notes-${index}`}>Catatan (Opsional)</Label>
                    <Textarea
                      id={`notes-${index}`}
                      placeholder="Catatan tambahan untuk supplier atau tim purchasing."
                      value={item.notes}
                      onChange={handleItemChange(index, 'notes')}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Perkiraan Total</p>
                <p className="text-2xl font-semibold">Rp {totalAmount.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Bersihkan Draft
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kirim Permintaan
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Catatan item bersifat opsional. Properti tersebut hanya akan disimpan ketika diisi sehingga pengiriman tanpa catatan akan berhasil.
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
