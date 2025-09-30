
'use client';

import React, { useState, useTransition, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  File,
  Loader2,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import { format, parse } from 'date-fns';
import type { Product, MappedRow } from '@/lib/types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { importMarketplaceTransactions } from './actions';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


// Expanded mapping to handle various column names from different marketplaces
const COLUMN_MAPPINGS: { [key: string]: keyof MappedRow | 'harga_awal_produk' } = {
  'waktu pesanan dibuat': 'tanggal_order',
  'tanggal order': 'tanggal_order',
  'nomor pesanan': 'nomor_order',
  'order id': 'nomor_order',
  'no. pesanan': 'nomor_order',
  'marketplace': 'channel',
  'channel': 'channel',
  'nama pembeli': 'nama_pembeli',
  'sku gudang': 'sku',
  'sku induk': 'sku',
  'informasi sku': 'sku',
  'jumlah': 'qty',
  'jumlah produk dibeli': 'qty',
  'kuantitas': 'qty',
  'harga asli produk': 'harga_awal_produk', // Prioritize original price
  'harga awal': 'harga_awal_produk',
  'harga satuan': 'unit_price',
  'harga jual (rp)': 'unit_price',
  'subtotal produk': 'subtotal',
  'total penjualan (rp)': 'subtotal',
  'ongkos kirim': 'shipping',
  'biaya pengiriman': 'shipping',
  'biaya pengelolaan': 'fee', // This will be added to other fees
  'biaya transaksi': 'fee',   // This will be added to other fees
  'diskon dari penjual': 'discount',
  'diskon marketplace': 'discount', // This will be added to other discounts
  'voucher': 'discount',
  'voucher toko': 'discount',
};


export default function ImportMarketplacePage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<MappedRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isParsing, startParsing] = useTransition();
  const [isImporting, startImporting] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return () => unsub();
  }, []);

  const allProductsMapped = useMemo(() => {
    if (parsedData.length === 0) return false;
    return parsedData.every(row => row.mappedProduct !== null);
  }, [parsedData]);


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
        // Remove currency symbols, thousands separators, and then parse
        return parseFloat(value.replace(/[^0-9,.-]+/g, '').replace(',', '.')) || 0;
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
                
                const mappedData: MappedRow[] = dataRows.map((row, rowIndex) => {
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
                    const sku = String(getVal(['sku gudang', 'sku induk', 'informasi sku']) || '');
                    const qty = normalizeNumber(getVal(['jumlah', 'jumlah produk dibeli', 'kuantitas']));
                    
                    const harga_awal = normalizeNumber(getVal(['harga asli produk', 'harga awal']));
                    const harga_satuan = normalizeNumber(getVal(['harga satuan', 'harga jual (rp)']));
                    const unit_price = harga_awal > 0 ? harga_awal : harga_satuan;

                    const subtotal = normalizeNumber(getVal(['subtotal produk', 'total penjualan (rp)'])) || (unit_price * qty);
                    const shipping = normalizeNumber(getVal(['ongkos kirim', 'biaya pengiriman']));

                    const fee_pengelolaan = normalizeNumber(getVal(['biaya pengelolaan']));
                    const fee_transaksi = normalizeNumber(getVal(['biaya transaksi']));
                    const fee = fee_pengelolaan + fee_transaksi;
                    
                    const diskon_marketplace = normalizeNumber(getVal(['diskon marketplace', 'voucher']));
                    const voucher_toko = normalizeNumber(getVal(['voucher toko']));
                    const diskon_penjual = normalizeNumber(getVal(['diskon dari penjual']));
                    const discount = diskon_marketplace + voucher_toko + diskon_penjual;
                    
                    const net_total = subtotal - fee - discount;

                    let tanggal_order_formatted = 'N/A';
                    if (tanggal_order_raw) {
                       try {
                         tanggal_order_formatted = format(new Date(tanggal_order_raw), 'yyyy-MM-dd HH:mm:ss');
                       } catch {
                         tanggal_order_formatted = String(tanggal_order_raw);
                       }
                    }
                    
                    const mappedProduct = products.find(p => p.sku && sku && p.sku.trim().toLowerCase() === sku.trim().toLowerCase()) || null;

                    return {
                        id: `${nomor_order}-${rowIndex}`,
                        tanggal_order: tanggal_order_formatted,
                        nomor_order, channel, nama_pembeli, sku, qty, unit_price,
                        subtotal, shipping, fee, discount, net_total,
                        mappedProduct
                    };
                }).filter(row => row.nomor_order && row.sku);

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

  const handleProductMapping = (rowId: string, product: Product | null) => {
    setParsedData(prevData =>
      prevData.map(row =>
        row.id === rowId ? { ...row, mappedProduct: product } : row
      )
    );
  };

  const handleImport = () => {
    if (!allProductsMapped) {
        toast({ title: 'Pemetaan Belum Selesai', description: 'Harap petakan semua produk yang tidak ditemukan sebelum mengimpor.', variant: 'destructive' });
        return;
    }
    startImporting(async () => {
        const result = await importMarketplaceTransactions(parsedData);
        if (result.error) {
            toast({ title: 'Gagal Mengimpor', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Impor Berhasil!', description: `${result.id} pesanan berhasil diimpor dan dijurnal.` });
            router.push('/transactions');
        }
    })
  }

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
                <CardDescription>Periksa data yang berhasil di-parse dan petakan produk yang belum ditemukan. SKU di laporan harus cocok dengan SKU Gudang di data produk.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-h-[500px] overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                            <TableRow>
                                <TableHead>SKU Laporan</TableHead>
                                <TableHead className="min-w-[200px]">Produk Terpetakan</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Harga Satuan</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                <TableHead className="text-right">Diskon</TableHead>
                                <TableHead className="text-right">Fee</TableHead>
                                <TableHead className="text-right">Total Bersih</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="text-xs">{row.sku}</TableCell>
                                    <TableCell>
                                        <ProductMappingCell
                                            product={row.mappedProduct}
                                            allProducts={products}
                                            onMap={(p) => handleProductMapping(row.id, p)}
                                        />
                                    </TableCell>
                                    <TableCell>{row.qty}</TableCell>
                                    <TableCell className="text-right font-mono">Rp {row.unit_price.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right font-mono">Rp {row.subtotal.toLocaleString('id-ID')}</TableCell>
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
                 {!allProductsMapped && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Pemetaan Belum Selesai</AlertTitle>
                        <AlertDescription>
                            Beberapa produk tidak dapat dipetakan secara otomatis. Harap pilih produk yang benar dari dropdown sebelum melanjutkan.
                        </AlertDescription>
                    </Alert>
                 )}
                <Button onClick={handleImport} disabled={isImporting || !allProductsMapped}>
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                    Impor {parsedData.length} Transaksi
                </Button>
            </CardFooter>
        </Card>
      )}

    </div>
  );
}


function ProductMappingCell({ product, allProducts, onMap }: { product: Product | null, allProducts: Product[], onMap: (p: Product | null) => void }) {
    const [open, setOpen] = useState(false);

    if (product) {
        return (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="mr-1 h-3 w-3" />
                {product.name}
            </Badge>
        );
    }
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="w-[200px] justify-between text-destructive">
                    Pilih Produk...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Cari produk..." />
                    <CommandList>
                        <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {allProducts.map((p) => (
                                <CommandItem
                                    key={p.id}
                                    value={p.name}
                                    onSelect={() => {
                                        onMap(p);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                                    {p.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
