
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
import { format } from 'date-fns';

type Marketplace = 'tokopedia' | 'shopee' | 'tiktok_shop' | 'bigseller';

type ParsedRow = {
  orderId: string;
  totalAmount: number;
  productName: string;
  quantity: number;
  status: string;
  finishTime?: string;
};

const COLUMN_MAPPINGS: { [key in Marketplace]: { [key: string]: keyof ParsedRow } } = {
  tokopedia: {
    'nomor pesanan': 'orderId',
    'order id': 'orderId',
    'nama produk': 'productName',
    'jumlah produk dibeli': 'quantity',
    'status terakhir': 'status',
    'total perkiraan jumlah pelepasan': 'totalAmount',
    'waktu selesai': 'finishTime',
  },
  shopee: {
    'no. pesanan': 'orderId',
    'nama produk': 'productName',
    'jumlah': 'quantity',
    'status pesanan': 'status',
    'total jumlah pelepasan': 'totalAmount',
    'waktu pesanan selesai': 'finishTime',
  },
  tiktok_shop: {
    'id pesanan': 'orderId',
    'nama produk': 'productName',
    'kuantitas': 'quantity',
    'status pesanan': 'status',
    'subtotal pesanan': 'totalAmount',
    'waktu pembayaran': 'finishTime',
  },
  bigseller: {
    'nomor pesanan': 'orderId',
    'nama panggilan toko bigseller': 'productName', // Placeholder, needs better column from BigSeller
    'total perkiraan jumlah pelepasan': 'totalAmount',
    'waktu selesai': 'finishTime',
  },
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
      setParsedData([]); // Reset preview on new file
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
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];

                const mapping = COLUMN_MAPPINGS[marketplace];
                const lowerCaseMapping: { [key: string]: keyof ParsedRow } = {};
                for (const key in mapping) {
                    lowerCaseMapping[key.toLowerCase()] = mapping[key as keyof typeof mapping];
                }

                const mappedData: ParsedRow[] = json.map(row => {
                    const normalizedRow: Partial<ParsedRow> = {};
                    for (const col in row) {
                        const mappedKey = lowerCaseMapping[col.toLowerCase().trim()];
                        if (mappedKey) {
                            (normalizedRow[mappedKey] as any) = row[col];
                        }
                    }

                    // Data Cleaning and Normalization
                    const orderId = String(normalizedRow.orderId || '');
                    const totalAmountStr = String(normalizedRow.totalAmount || '0').replace(/[^0-9.-]+/g, '');
                    const totalAmount = parseFloat(totalAmountStr) || 0;
                    
                    let finishTime: string | undefined;
                    if (normalizedRow.finishTime) {
                        try {
                           finishTime = format(new Date(normalizedRow.finishTime), 'yyyy-MM-dd HH:mm:ss');
                        } catch {
                           finishTime = normalizedRow.finishTime; // fallback to original string if date is invalid
                        }
                    }

                    return {
                      orderId: orderId,
                      productName: String(normalizedRow.productName || 'N/A'),
                      quantity: parseInt(String(normalizedRow.quantity), 10) || 1,
                      totalAmount: totalAmount,
                      status: String(normalizedRow.status || 'N/A'),
                      finishTime: finishTime,
                    };
                }).filter(row => row.orderId && row.orderId !== 'null' && row.totalAmount > 0);

                setParsedData(mappedData);
                toast({ title: 'Berhasil', description: `${mappedData.length} baris berhasil di-parse.` });

            } catch (err) {
                 const e = err as Error;
                 toast({ title: 'Gagal Parse File', description: `Format file tidak sesuai atau rusak. Error: ${e.message}`, variant: 'destructive' });
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
                <SelectItem value="shopee">Shopee</SelectItem>
                <SelectItem value="tiktok_shop">TikTok Shop</SelectItem>
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
                                <TableHead>Status</TableHead>
                                <TableHead>Waktu Selesai</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-mono text-xs">{row.orderId}</TableCell>
                                    <TableCell>{row.status}</TableCell>
                                    <TableCell>{row.finishTime || 'N/A'}</TableCell>
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
