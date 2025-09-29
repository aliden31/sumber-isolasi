'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload } from 'lucide-react';

const mockCompanyTx = [
    { id: 1, date: '2024-07-28', desc: 'Penjualan Tunai TRX001', amount: 105000, type: 'in' },
    { id: 2, date: '2024-07-27', desc: 'Pembayaran Supplier Roti', amount: -1500000, type: 'out' },
];
const mockBankTx = [
    { id: 1, date: '2024-07-27', desc: 'TRF E-BANKING CR 27/07', amount: 54000, type: 'in' },
    { id: 2, date: '2024-07-26', desc: 'BI-FAST DB 26/07', amount: -170000, type: 'out' },
];

export default function BankReconciliationPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">
        Rekonsiliasi Bank
      </h1>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline">Mulai Rekonsiliasi Baru</CardTitle>
              <CardDescription>
                Pilih akun bank dan unggah laporan koran untuk memulai.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Unduh Template
              </Button>
              <Button>
                <Upload className="mr-2 h-4 w-4" /> Unggah Laporan
              </Button>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
             <Select>
              <SelectTrigger id="account">
                <SelectValue placeholder="Pilih Akun Bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10100">1-10100 - Bank BCA</SelectItem>
                <SelectItem value="1-10101">1-10101 - Bank Mandiri</SelectItem>
              </SelectContent>
            </Select>
            <Input type="file" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-headline font-semibold text-lg mb-2">Transaksi Perusahaan</h3>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCompanyTx.map(tx => (
                        <TableRow key={tx.id}>
                            <TableCell><Checkbox /></TableCell>
                            <TableCell>{tx.date}</TableCell>
                            <TableCell>{tx.desc}</TableCell>
                            <TableCell className={`text-right ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{tx.amount.toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
             <div>
              <h3 className="font-headline font-semibold text-lg mb-2">Transaksi Laporan Bank</h3>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBankTx.map(tx => (
                        <TableRow key={tx.id}>
                            <TableCell><Checkbox /></TableCell>
                            <TableCell>{tx.date}</TableCell>
                            <TableCell>{tx.desc}</TableCell>
                            <TableCell className={`text-right ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{tx.amount.toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
           <div className="mt-8 pt-4 border-t space-y-4">
              <div className="flex justify-between items-center font-bold">
                  <span>Selisih</span>
                  <span className="text-destructive">Rp 1.519.000</span>
              </div>
              <div className="flex justify-end">
                <Button>Simpan Rekonsiliasi</Button>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
