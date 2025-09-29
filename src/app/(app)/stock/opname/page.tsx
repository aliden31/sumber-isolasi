'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Save, Search, Printer, FileDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const mockStock = [
    { id: 'PROD001', name: 'Kopi Arabika', systemStock: 48, physicalStock: 48, diff: 0},
    { id: 'PROD002', name: 'Roti Gandum', systemStock: 120, physicalStock: 118, diff: -2},
    { id: 'PROD003', name: 'Susu UHT Full Cream 1L', systemStock: 80, physicalStock: 81, diff: 1},
]

export default function StockOpnamePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Penyesuaian Stok / Stock Opname</h1>
       <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline">Proses Stock Opname</CardTitle>
              <CardDescription>Filter produk berdasarkan kategori atau gudang, lalu isi stok fisik.</CardDescription>
            </div>
             <div className="flex gap-2">
                <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/> Unduh Data</Button>
                <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Cetak Form</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Input placeholder="Cari nama atau kode produk..." />
            <Select>
                <SelectTrigger><SelectValue placeholder="Semua Gudang" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="utama">Gudang Utama</SelectItem>
                    <SelectItem value="toko">Gudang Toko</SelectItem>
                </SelectContent>
            </Select>
            <Select>
                <SelectTrigger><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="minuman">Minuman</SelectItem>
                    <SelectItem value="roti">Roti</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-center">Stok Sistem</TableHead>
                      <TableHead className="w-40 text-center">Stok Fisik</TableHead>
                      <TableHead className="text-center">Selisih</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockStock.map(item => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">{item.systemStock}</TableCell>
                            <TableCell><Input type="number" defaultValue={item.physicalStock} className="text-center" /></TableCell>
                            <TableCell className={`text-center font-bold ${item.diff > 0 ? 'text-green-600' : item.diff < 0 ? 'text-destructive' : ''}`}>{item.diff}</TableCell>
                            <TableCell><Input placeholder={item.diff < 0 ? "Contoh: Rusak, hilang" : "Contoh: Salah input"} /></TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
        </CardContent>
         <CardFooter className="flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" /> Simpan Penyesuaian
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
