
'use client';

import React, { useState, useTransition, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, File, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as XLSX from 'xlsx';

type Marketplace = 'tokopedia' | 'shopee' | 'tiktok_shop' | 'bigseller';

// A very simplified representation of a parsed row
type ParsedRow = {
  orderId: string;
  totalAmount: number;
  productName: string;
  quantity: number;
  status: string;
};

export default function ImportMarketplacePage() {
  const [marketplace, setMarketplace] = useState<Marketplace | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isParsing, startParsing] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({ title: "File tidak valid", description: "Mohon unggah file dengan format .xlsx atau .xls", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleParse = () => {
    if (!file || !marketplace) {
      toast({ title: "Data tidak lengkap", description: "Pilih marketplace dan file terlebih dahulu.", variant: "destructive" });
      return;
    }

    startParsing(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                // Basic mapping logic, this needs to be greatly expanded
                const mappedData: ParsedRow[] = json.map(row => {
                  if (marketplace === 'tokopedia') {
                    return {
                      orderId: row['Nomor Pesanan'] || row['Order ID'],
                      productName: row['Nama Produk'] || 'N/A',
                      quantity: parseInt(row['Jumlah Produk Dibeli'], 10) || 1,
                      totalAmount: parseFloat(row['Total Perkiraan Jumlah Pelepasan']?.replace(/[^0-9.-]+/g, '')) || 0,
                      status: row['Status Terakhir'] || 'N/A',
                    };
                  }
                  if (marketplace === 'bigseller') {
                     return {
                      orderId: row['Nomor Pesanan'],
                      productName: 'Multiple Items', // BigSeller often aggregates
                      quantity: 1, // Not easily available per row
                      totalAmount: parseFloat(row['Total Perkiraan Jumlah Pelepasan']?.replace(/[^0-9.-]+/g, '')) || 0,
                      status: row['Waktu Selesai'] ? 'Selesai' : 'Diproses',
                    };
                  }
                  // Add similar mapping for 'shopee', 'tiktok_shop' here
                  return { orderId: 'N/A', productName: 'N/A', quantity: 0, totalAmount: 0, status: 'N/A' };
                }).filter(row => row.orderId && row.totalAmount > 0);

                setParsedData(mappedData);
                toast({ title: 'Berhasil', description: `${mappedData.length} baris berhasil di-parse.` });

            } catch (err) {
                 const e = err as Error;
                 toast({ title: 'Gagal Parse File', description: `Format file tidak sesuai. ${e.message}`, variant: 'destructive' });
            }
        }
        reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Impor Penjualan dari Marketplace</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Langkah 1: Unggah Laporan Penjualan</CardTitle>
          <CardDescription>Pilih marketplace dan unggah file laporan penjualan (.xlsx) yang Anda unduh dari seller center.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label>Pilih Marketplace</label>
            <Select value={marketplace} onValueChange={(value) => setMarketplace(value as Marketplace)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih asal marketplace..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tokopedia">Tokopedia</SelectItem>
                <SelectItem value="bigseller">BigSeller</SelectItem>
                <SelectItem value="shopee" disabled>Shopee (Segera Hadir)</SelectItem>
                <SelectItem value="tiktok_shop" disabled>TikTok Shop (Segera Hadir)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label>Unggah File Laporan</label>
            <div className="flex gap-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
                    <File className="mr-2 h-4 w-4" />
                    {file ? file.name : 'Pilih file .xlsx...'}
                </Button>
                 <Button onClick={handleParse} disabled={isParsing || !file || !marketplace}>
                    {isParsing ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                </Button>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.xls"
                onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>

      {parsedData.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Langkah 2: Pratinjau & Konfirmasi</CardTitle>
                <CardDescription>Periksa data yang berhasil di-parse. Data ini belum disimpan ke sistem.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-h-[500px] overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Produk</TableHead>
                                <TableHead>Jumlah</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-mono text-xs">{row.orderId}</TableCell>
                                    <TableCell>{row.productName}</TableCell>
                                    <TableCell>{row.quantity}</TableCell>
                                    <TableCell>{row.status}</TableCell>
                                    <TableCell className="text-right font-medium">Rp {row.totalAmount.toLocaleString('id-ID')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Perhatian!</AlertTitle>
                    <AlertDescription>
                        Ini adalah fitur eksperimental. Logika untuk menyimpan transaksi ke database dan membuat jurnal otomatis sedang dalam pengembangan. Tombol di bawah ini belum berfungsi.
                    </AlertDescription>
                </Alert>
                <Button disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin hidden"/>
                    Impor {parsedData.length} Transaksi (Segera Hadir)
                </Button>
            </CardFooter>
        </Card>
      )}

    </div>
  );
}
