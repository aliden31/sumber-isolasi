

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
import type { Product, ImportRow } from '@/lib/types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { importMarketplaceTransactions } from './actions';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


export default function ImportMarketplacePage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [skuToProductMap, setSkuToProductMap] = useState<Record<string, Product | null>>({});

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

  const { allProductsMapped, uniqueOrderCount, totalItems, unmappedSkus } = useMemo(() => {
    if (parsedData.length === 0) {
      return { allProductsMapped: false, uniqueOrderCount: 0, totalItems: 0, unmappedSkus: [] };
    }
    
    const uniqueSkus = [...new Set(parsedData.map(row => row.sku))];
    const unmapped = uniqueSkus.filter(sku => !skuToProductMap[sku]);

    const uniqueOrders = new Set(parsedData.map(row => row.nomor_order));
    const totalItems = parsedData.reduce((sum, row) => sum + row.qty, 0);

    return { 
      allProductsMapped: unmapped.length === 0, 
      uniqueOrderCount: uniqueOrders.size,
      totalItems,
      unmappedSkus: unmapped
    };
  }, [parsedData, skuToProductMap]);


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
      setSkuToProductMap({});
    }
  };
  
  const normalizeNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        return parseFloat(value.replace(/[^0-9,.-]+/g, '').replace(',', '.')) || 0;
    }
    return 0;
  }
  
  const parseDate = (dateString: any): Date | null => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;

    let cleanDateString = String(dateString).trim();
    
    cleanDateString = cleanDateString.replace(/\sGMT[+-]\d{2}:\d{2}.*$/, '');

    const formats = [
      'dd-MM-yyyy HH:mm',
      'dd/MM/yyyy HH:mm',
      'yyyy-MM-dd HH:mm:ss',
      'yyyy/MM/dd HH:mm:ss',
      'MM/dd/yyyy, hh:mm:ss a',
    ];

    for (const fmt of formats) {
      try {
        const parsedDate = parse(cleanDateString, fmt, new Date());
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      } catch (e) {
      }
    }
    
    const nativeParsed = new Date(cleanDateString);
    if (!isNaN(nativeParsed.getTime())) {
        return nativeParsed;
    }

    return null;
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
                
                const initialSkuMap: Record<string, Product | null> = {};
                const ordersFeeCalculated = new Map<string, number>();

                const mappedData: ImportRow[] = dataRows.map((row, rowIndex) => {
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

                    const tanggal_order_raw = getVal(['waktu pembuatan pesanan', 'tanggal order']);
                    const nomor_order = String(getVal(['nomor pesanan', 'order id', 'no. pesanan']) || '');
                    const channel = String(getVal(['marketplace', 'channel']) || 'N/A');
                    const nama_pembeli = String(getVal(['nama penerima', 'nama pembeli']) || 'N/A');
                    const alamat_lengkap = String(getVal(['alamat pengiriman', 'alamat']) || '');
                    const sku = String(getVal(['sku penjual', 'sku induk', 'sku gudang']) || '');
                    const nama_produk = String(getVal(['nama produk', 'product name']) || '');
                    const qty = normalizeNumber(getVal(['jumlah', 'jumlah produk dibeli', 'kuantitas']));
                    
                    const harga_awal = normalizeNumber(getVal(['harga asli produk', 'harga awal']));
                    const harga_satuan = normalizeNumber(getVal(['harga setelah diskon penjual', 'harga jual (rp)']));
                    const unit_price = harga_satuan > 0 ? harga_satuan : harga_awal;

                    const cost = normalizeNumber(getVal(['harga modal', 'harga pokok']));
                    let subtotal = normalizeNumber(getVal(['subtotal produk', 'total penjualan (rp)'])) || (unit_price * qty);

                    let fee = 0;
                    let discount = 0;
                    let net_total = 0;

                    if (channel.toLowerCase() === 'tiktok') {
                        // For TikTok, fee is 15% + 1250, and voucher is ignored for net calculation
                        fee = (subtotal * 0.15) + 1250;
                        net_total = subtotal - fee; // Discount is not subtracted from net_total as per user request
                        discount = normalizeNumber(getVal(['diskon dari penjual', 'voucher dari seller'])); // still capture discount if present, but don't use it for net_total
                    } else {
                        // Original logic for other marketplaces
                        if (!ordersFeeCalculated.has(nomor_order)) {
                            const commissionFee = normalizeNumber(getVal(['biaya komisi']));
                            const transactionFee = normalizeNumber(getVal(['biaya transaksi']));
                            const affiliateFee = normalizeNumber(getVal(['biaya afiliasi']));
                            fee = commissionFee + transactionFee + affiliateFee;
                            ordersFeeCalculated.set(nomor_order, fee);
                        } else {
                            fee = ordersFeeCalculated.get(nomor_order) || 0;
                        }
                        discount = normalizeNumber(getVal(['diskon dari penjual', 'voucher dari seller']));
                        net_total = subtotal - fee - discount;
                    }

                    const parsedDate = parseDate(tanggal_order_raw);
                    if (!parsedDate) {
                        console.warn(`Could not parse date for order ${nomor_order}: ${tanggal_order_raw}`);
                    }
                    const tanggal_order_formatted = parsedDate ? format(parsedDate, 'yyyy-MM-dd HH:mm:ss') : 'Invalid Date';
                    
                    if (sku && initialSkuMap[sku] === undefined) {
                        initialSkuMap[sku] = products.find(p => p.sku && sku && p.sku.trim().toLowerCase() === sku.trim().toLowerCase()) || null;
                    }

                    return {
                        id: `${nomor_order}-${rowIndex}`,
                        tanggal_order: tanggal_order_formatted,
                        nomor_order, channel, nama_pembeli, alamat_lengkap, sku, nama_produk, qty, unit_price,
                        cost, subtotal, shipping: 0, fee, discount, net_total,
                        mappedProduct: null
                    };
                }).filter(row => row.nomor_order && row.sku);

                setParsedData(mappedData);
                setSkuToProductMap(initialSkuMap);
                toast({ title: 'Berhasil', description: `${mappedData.length} baris berhasil di-parse.` });

            } catch (err) {
                 const e = err as Error;
                 toast({ title: 'Gagal Parse File', description: `Format file tidak sesuai atau rusak. Error: ${e.message}`, variant: 'destructive' });
            }
        }
        reader.readAsArrayBuffer(file);
    });
  };

  const handleProductMapping = (sku: string, product: Product | null) => {
    setSkuToProductMap(prevMap => ({
        ...prevMap,
        [sku]: product
    }));
  };

  const handleImport = () => {
    if (!allProductsMapped) {
        toast({ title: 'Pemetaan Belum Selesai', description: 'Harap petakan semua produk yang tidak ditemukan sebelum mengimpor.', variant: 'destructive' });
        return;
    }

    const dataToImport = parsedData.map(row => ({
        ...row,
        mappedProduct: skuToProductMap[row.sku]
    }));

    startImporting(async () => {
        const result = await importMarketplaceTransactions(dataToImport);
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
                <CardTitle>Langkah 2: Pratinjau & Pemetaan</CardTitle>
                <CardDescription>
                  Periksa data yang berhasil di-parse dan petakan produk yang belum ditemukan. SKU di laporan harus cocok dengan SKU Gudang di data produk.
                  <br />
                  <span className="font-semibold text-foreground">
                    Terdeteksi {uniqueOrderCount} transaksi unik dengan total {totalItems} item.
                  </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                {unmappedSkus.length > 0 && (
                    <div className="mb-6">
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Diperlukan Pemetaan</AlertTitle>
                            <AlertDescription>
                                {unmappedSkus.length} SKU dari laporan tidak dapat ditemukan di database produk Anda. Harap petakan secara manual di bawah ini.
                            </AlertDescription>
                        </Alert>
                        <div className="max-h-[300px] overflow-y-auto border rounded-md p-4 space-y-4">
                            {unmappedSkus.map(sku => (
                                <div key={sku} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                    <div>
                                        <p className="text-sm font-semibold">SKU Laporan:</p>
                                        <p className="text-sm text-muted-foreground">{sku}</p>
                                    </div>
                                    <ProductMappingCell
                                        sku={sku}
                                        mappedProduct={skuToProductMap[sku]}
                                        allProducts={products}
                                        onMap={(p) => handleProductMapping(sku, p)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardContent>
                <div className="max-h-[500px] overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                           <TableRow>
                                <TableHead>Marketplace</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Produk Terpetakan</TableHead>
                                <TableHead className="text-center">Qty</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                <TableHead className="text-right">Diskon</TableHead>
                                <TableHead className="text-right">Fee</TableHead>
                                <TableHead className="text-right">Total Net</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell>
                                      <Badge variant="secondary">{row.channel}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">{row.sku}</TableCell>
                                    <TableCell>
                                        <ProductMappingCell
                                            sku={row.sku}
                                            mappedProduct={skuToProductMap[row.sku]}
                                            allProducts={products}
                                            onMap={(p) => handleProductMapping(row.sku, p)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-center">{row.qty}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {Math.round(row.subtotal).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-destructive">
                                        - {Math.round(row.discount).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-destructive">
                                        - {Math.round(row.fee).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-right font-bold font-mono">
                                        Rp {Math.round(row.net_total).toLocaleString('id-ID')}
                                    </TableCell>
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
                            Harap petakan semua produk yang tidak ditemukan sebelum mengimpor.
                        </AlertDescription>
                    </Alert>
                 )}
                <Button onClick={handleImport} disabled={isImporting || !allProductsMapped}>
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                    Impor {parsedData.length} Baris
                </Button>
            </CardFooter>
        </Card>
      )}

    </div>
  );
}


function ProductMappingCell({ sku, mappedProduct, allProducts, onMap }: { sku: string; mappedProduct: Product | null | undefined, allProducts: Product[], onMap: (p: Product | null) => void }) {
    const [open, setOpen] = useState(false);

    if (mappedProduct) {
        return (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="mr-1 h-3 w-3" />
                {mappedProduct.name}
            </Badge>
        );
    }
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" role="combobox" aria-expanded={open} className="w-full justify-between text-destructive">
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

