'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';

type JournalEntry = {
  id: number;
  accountId: string;
  debit: number;
  credit: number;
};

export default function GeneralJournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([
    { id: 1, accountId: '', debit: 0, credit: 0 },
    { id: 2, accountId: '', debit: 0, credit: 0 },
  ]);
  const [nextId, setNextId] = useState(3);

  const handleEntryChange = (id: number, field: 'accountId' | 'debit' | 'credit', value: string | number) => {
    setEntries(prevEntries => 
      prevEntries.map(entry => {
        if (entry.id === id) {
          if (field === 'debit' || field === 'credit') {
            return { ...entry, [field]: Number(value) || 0 };
          }
          return { ...entry, [field]: value };
        }
        return entry;
      })
    );
  };

  const addRow = () => {
    setEntries(prev => [...prev, { id: nextId, accountId: '', debit: 0, credit: 0 }]);
    setNextId(prev => prev + 1);
  };

  const removeRow = (id: number) => {
    if (entries.length > 2) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };
  
  const { totalDebit, totalCredit, isBalanced } = useMemo(() => {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    return {
      totalDebit,
      totalCredit,
      isBalanced: totalDebit === totalCredit && totalDebit !== 0,
    };
  }, [entries]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Jurnal Umum</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Buat Entri Jurnal Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="journal-date">Tanggal</Label>
              <DatePicker />
            </div>
            <div className="space-y-2">
              <Label htmlFor="journal-number">No. Referensi</Label>
              <Input id="journal-number" placeholder="Otomatis jika kosong" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" placeholder="Deskripsi transaksi jurnal" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Akun</TableHead>
                  <TableHead className="w-[150px]">Debit</TableHead>
                  <TableHead className="w-[150px]">Kredit</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Input 
                        placeholder="Pilih akun" 
                        value={entry.accountId}
                        onChange={(e) => handleEntryChange(entry.id, 'accountId', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={entry.debit === 0 ? '' : entry.debit}
                        onChange={(e) => handleEntryChange(entry.id, 'debit', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={entry.credit === 0 ? '' : entry.credit}
                        onChange={(e) => handleEntryChange(entry.id, 'credit', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeRow(entry.id)} disabled={entries.length <= 2}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           <Button variant="outline" className="w-full" onClick={addRow}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Baris
          </Button>
          <div className="flex justify-between items-center font-bold text-lg pt-4 border-t">
              <div className="flex items-center gap-2">
                <span>Total</span>
                <Badge variant={isBalanced ? 'secondary' : 'destructive'}>
                  {isBalanced ? 'Balanced' : 'Out of Balance'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 w-1/2 font-mono">
                <div>Rp {totalDebit.toLocaleString('id-ID')}</div>
                <div>Rp {totalCredit.toLocaleString('id-ID')}</div>
              </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button disabled={!isBalanced}>
            <Save className="mr-2 h-4 w-4" /> Simpan Jurnal
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
