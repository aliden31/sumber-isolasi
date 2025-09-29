'use client';

import { useState } from 'react';
import type { Warehouse } from '@/lib/types';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { generateId } from '@/lib/id';
import { Warehouse as WarehouseIcon, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TYPES: Warehouse['type'][] = ['Gudang', 'Toko', 'Retur'];

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = usePersistentState<Warehouse[]>('stock:warehouses', []);
  const [form, setForm] = useState({ name: '', type: 'Gudang' as Warehouse['type'], address: '', notes: '' });
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const { toast } = useToast();

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast({ title: 'Nama gudang wajib diisi', variant: 'destructive' });
      return;
    }
    const newWarehouse: Warehouse = {
      id: generateId('WH'),
      name: form.name.trim(),
      type: form.type,
      address: form.address.trim(),
      notes: form.notes.trim() || undefined,
    };
    setWarehouses([newWarehouse, ...warehouses]);
    setForm({ name: '', type: 'Gudang', address: '', notes: '' });
    toast({ title: 'Gudang ditambahkan', description: newWarehouse.name });
  };

  const handleUpdate = () => {
    if (!editing) return;
    setWarehouses((prev) => prev.map((warehouse) => (warehouse.id === editing.id ? editing : warehouse)));
    setEditing(null);
    toast({ title: 'Gudang diperbarui', description: editing.name });
  };

  const handleDelete = (id: string) => {
    const target = warehouses.find((warehouse) => warehouse.id === id);
    setWarehouses((prev) => prev.filter((warehouse) => warehouse.id !== id));
    toast({ title: 'Gudang dihapus', description: target?.name });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold">Manajemen Gudang</h1>
          <p className="text-muted-foreground">Kelola lokasi penyimpanan stok seperti gudang, toko, atau area retur.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <WarehouseIcon className="h-5 w-5" /> Tambah Lokasi
          </CardTitle>
          <CardDescription>Definisikan lokasi fisik atau virtual tempat stok disimpan.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="wh-name">
              Nama Lokasi
            </label>
            <Input
              id="wh-name"
              placeholder="Contoh: Gudang Utama"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipe Lokasi</label>
            <Select value={form.type} onValueChange={(value: Warehouse['type']) => setForm((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="wh-address">
              Alamat / Catatan Lokasi
            </label>
            <Textarea
              id="wh-address"
              placeholder="Alamat lengkap atau deskripsi singkat"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="wh-notes">
              Catatan Internal
            </label>
            <Textarea
              id="wh-notes"
              placeholder="Pengelola, jam operasional, dsb"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t bg-muted/40">
          <Button onClick={handleCreate}>Simpan Lokasi</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Lokasi</CardTitle>
          <CardDescription>Perbarui atau hapus lokasi gudang sesuai kebutuhan operasional.</CardDescription>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Belum ada lokasi yang didaftarkan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell>{warehouse.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{warehouse.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-sm">{warehouse.address || '-'}</TableCell>
                    <TableCell className="max-w-sm">{warehouse.notes || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog open={editing?.id === warehouse.id} onOpenChange={(open) => !open && setEditing(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing({ ...warehouse })}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Ubah
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit {editing?.name}</DialogTitle>
                            <DialogDescription>Perbarui informasi gudang.</DialogDescription>
                          </DialogHeader>
                          {editing && (
                            <div className="space-y-3">
                              <Input
                                value={editing.name}
                                onChange={(event) => setEditing((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                              />
                              <Select
                                value={editing.type}
                                onValueChange={(value: Warehouse['type']) =>
                                  setEditing((prev) => (prev ? { ...prev, type: value } : prev))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Textarea
                                value={editing.address}
                                onChange={(event) =>
                                  setEditing((prev) => (prev ? { ...prev, address: event.target.value } : prev))
                                }
                              />
                              <Textarea
                                value={editing.notes ?? ''}
                                onChange={(event) =>
                                  setEditing((prev) => (prev ? { ...prev, notes: event.target.value } : prev))
                                }
                              />
                            </div>
                          )}
                          <DialogFooter>
                            <Button onClick={handleUpdate}>Simpan Perubahan</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(warehouse.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                      </Button>
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
