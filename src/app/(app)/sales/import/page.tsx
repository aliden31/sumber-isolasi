
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
import { format, parse } from 'date-fns';

type Marketplace = 'tokopedia' | 'shopee' | 'tiktok_shop' | 'bigseller' | 'generic';

type ParsedRow = {
  tanggal_order: string;
  nomor_order: string;
  channel: string;
  nama_pembeli: string;
  sku: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  shipping: number;
  fee: number;
  discount: number;
  net_total: number;
};

// Expanded mapping to handle various column names from different marketplaces
const COLUMN_MAPPINGS: { [key: string]: keyof ParsedRow } = {
  'waktu pesanan dibuat': 'tanggal_order',
  'tanggal order': 'tanggal_order',
  'nomor pesanan': 'nomor_order',
  'order id': 'nomor_order',
  'no. pesanan': 'nomor_order',
  'marketplace': 'channel',
  'channel': 'channel',
  'nama pembeli': 'nama_pembeli',
  'nama produk': 'sku', // Assuming product name can be used as SKU for simplicity
  'sku induk': 'sku',
  'informasi sku': 'sku',
  'jumlah': 'qty',
  'jumlah produk dibeli': 'qty',
f  'kuantitas': 'qty',
  'harga satuan': 'unit_price',
  'harga jual (rp)': 'unit_price',
  'subtotal produk': 'subtotal',
  'total penjualan (rp)': 'subtotal',
  'ongkos kirim': 'shipping',
  'biaya pengiriman': 'shipping',
  'biaya pengelolaan': 'fee', // This will be added to other fees
  'biaya transaksi': 'fee',   // This will be added to other fees
  'diskon penjual': 'discount', // This will be added to other discounts
  'diskon marketplace': 'discount', // This will be added to other discounts
  'voucher': 'discount',
  'total pesanan': 'net_total', // This will be used in calculation
  'total perkiraan jumlah pelepasan': 'net_total',
};


export default function ImportMarketplacePage() {
  const [marketplace, setMarketplace] = useState<Marketplace | ''>('generic');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isParsing, startParsing] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({ title: "File tidak valid", description: "Mohon unggah file dengan format .xlsx, .xls atau .csv", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
      setParsedData([]); // Reset preview on new file
    }
  };
  
  const normalizeNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        return parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0;
    }
    return 0;
  }

  const handleParse = () => {
    if (!file) {
      toast({ title: "File belum dipilih", description: "Pilih file laporan penjualan terlebih dahulu.", variant: "destructive" });
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
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][];

                if (json.length < 2) throw new Error("File tidak berisi data yang cukup.");
                
                const header = json[0].map(h => String(h).toLowerCase().trim());
                const dataRows = json.slice(1);
                
                const mappedData: ParsedRow[] = dataRows.map(row => {
                    const rowData: {[key: string]: any} = {};
                    header.forEach((h, index) => {
                        rowData[h] = row[index];
                    });
                    
                    const getVal = (keys: string[]) => {
                        for (const key of keys) {
                            if(rowData[key] !== undefined) return rowData[key];
                        }
                        return undefined;
                    }

                    // --- Extraction & Normalization ---
                    const tanggal_order_raw = getVal(['waktu pesanan dibuat', 'tanggal order']);
                    const nomor_order = String(getVal(['nomor pesanan', 'order id', 'no. pesanan']) || '');
                    const channel = String(getVal(['marketplace', 'channel']) || 'N/A');
                    const nama_pembeli = String(getVal(['nama pembeli']) || 'N/A');
                    const sku = String(getVal(['nama produk', 'sku induk', 'informasi sku']) || '');
                    const qty = normalizeNumber(getVal(['jumlah', 'jumlah produk dibeli', 'kuantitas']));
                    const unit_price = normalizeNumber(getVal(['harga satuan', 'harga jual (rp)']));
                    const subtotal = normalizeNumber(getVal(['subtotal produk', 'total penjualan (rp)']));
                    const shipping = normalizeNumber(getVal(['ongkos kirim', 'biaya pengiriman']));

                    // Calculate composite fields
                    const fee_pengelolaan = normalizeNumber(getVal(['biaya pengelolaan']));
                    const fee_transaksi = normalizeNumber(getVal(['biaya transaksi']));
                    const fee = fee_pengelolaan + fee_transaksi;
                    
                    const diskon_penjual = normalizeNumber(getVal(['diskon penjual']));
                    const diskon_marketplace = normalizeNumber(getVal(['diskon marketplace']));
                    const voucher = normalizeNumber(getVal(['voucher']));
                    const discount = diskon_penjual + diskon_marketplace + voucher;
                    
                    const total_pesanan = normalizeNumber(getVal(['total pesanan', 'total perkiraan jumlah pelepasan']));
                    // Net Total Calculation
                    const net_total = total_pesanan > 0 ? (total_pesanan - fee - discount) : (subtotal + shipping - discount);

                    let tanggal_order_formatted = 'N/A';
                    if (tanggal_order_raw) {
                       try {
                         tanggal_order_formatted = format(new Date(tanggal_order_raw), 'yyyy-MM-dd HH:mm:ss');
                       } catch {
                         tanggal_order_formatted = String(tanggal_order_raw); // fallback if parsing fails
                       }
                    }

                    return {
                        tanggal_order: tanggal_order_formatted,
                        nomor_order,
                        channel,
                        nama_pembeli,
                        sku,
                        qty,
                        unit_price,
                        subtotal,
                        shipping,
                        fee,
                        discount,
                        net_total
                    };
                }).filter(row => row.nomor_order); // Filter out rows without an order number

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
          <CardDescription>Pilih dan unggah file laporan penjualan (.xlsx atau .csv) yang Anda unduh dari seller center.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <Button variant="outline" className="w-full md:w-auto justify-start" onClick={() => fileInputRef.current?.click()}>
                    <File className="mr-2 h-4 w-4" />
                    {file ? file.name : 'Pilih file...'}
                </Button>
                <p className="text-sm text-muted-foreground">Lalu</p>
                 <Button onClick={handleParse} disabled={isParsing || !file} className="w-full md:w-auto">
                    {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                    Proses dan Tampilkan Pratinjau
                </Button>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
            />
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
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Pembeli</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead className="text-right">Harga Satuan</TableHead>
                                <TableHead className="text-right">Ongkir</TableHead>
                                <TableHead className="text-right">Diskon</TableHead>
                                <TableHead className="text-right">Fee</TableHead>
                                <TableHead className="text-right">Total Bersih</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((row, index) => (
                                <TableRow key={`${row.nomor_order}-${index}`}>
                                    <TableCell className="text-xs whitespace-nowrap">{row.tanggal_order}</TableCell>
                                    <TableCell className="font-mono text-xs">{row.nomor_order}</TableCell>
                                    <TableCell>{row.nama_pembeli}</TableCell>
                                    <TableCell className="text-xs">{row.sku}</TableCell>
                                    <TableCell>{row.qty}</TableCell>
                                    <TableCell className="text-right font-mono">Rp {row.unit_price.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right font-mono">Rp {row.shipping.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right font-mono text-destructive">Rp {row.discount.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right font-mono text-destructive">Rp {row.fee.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right font-bold font-mono">Rp {row.net_total.toLocaleString('id-ID')}</TableCell>
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
