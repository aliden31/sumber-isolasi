
'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { batchImportProducts } from '../actions';
import type { NewProduct } from '@/lib/types';
import { useRouter } from 'next/navigation';

const HEADER_MAP: Record<string, keyof NewProduct | 'hargaJual'> = {
  'nama produk': 'name',
  'sku': 'sku',
  'kategori': 'category',
  'harga modal': 'cost',
  'harga jual': 'hargaJual',
  'stok': 'stock',
};

export default function ImportProductsPage() {
  const [isPending, startTransition] = useTransition();
  const [pasteData, setPasteData] = useState('');
  const [parsedData, setParsedData] = useState<NewProduct[]>([]);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const router = useRouter();


  const handleParse = () => {
    setError('');
    if (!pasteData.trim()) {
      setParsedData([]);
      return;
    }

    const rows = pasteData.trim().split('\n');
    const header = rows[0].split('\t').map(h => h.trim().toLowerCase());
    const data = rows.slice(1);

    const mappedHeaders = header.map(h => HEADER_MAP[h]);
    
    if (mappedHeaders.includes(undefined)) {
        setError("Header tidak valid. Pastikan header sesuai format: Nama Produk, SKU, Kategori, Harga Modal, Harga Jual, Stok.");
        setParsedData([]);
        return;
    }

    try {
        const products: NewProduct[] = data.map(rowStr => {
            const row = rowStr.split('\t');
            let product: any = { units: [] };

            mappedHeaders.forEach((key, index) => {
                const value = row[index]?.trim();
                if (key === 'hargaJual') return;

                if(key === 'stock' || key === 'cost') {
                    product[key as keyof NewProduct] = Number(value) || 0;
                } else {
                    product[key as keyof NewProduct] = value;
                }
            });

            const hargaJualIndex = mappedHeaders.indexOf('hargaJual');
            
            product.units.push({
                name: 'Pcs', // Default base unit
                price: Number(row[hargaJualIndex]) || 0,
                cost: product.cost || 0,
                conversionRate: 1,
            });
            product.baseUnit = 'Pcs';
            product.minStockThreshold = 10; // Default value

            if (!product.name) throw new Error("Nama produk tidak boleh kosong.");

            return product as NewProduct;
        });
        setParsedData(products);
    } catch(e: any) {
        setError(`Gagal mem-parsing data: ${e.message}`);
        setParsedData([]);
    }
  };
  
  const handleImport = () => {
    if (parsedData.length === 0) {
      toast({ title: "Tidak ada data untuk diimpor", variant: 'destructive' });
      return;
    }
    startTransition(async () => {
      const result = await batchImportProducts(parsedData);
      if (result.error) {
        toast({ title: "Gagal Mengimpor", description: result.error, variant: 'destructive'});
      } else {
        toast({ title: "Impor Berhasil", description: `${parsedData.length} produk telah berhasil ditambahkan.`});
        router.push('/products');
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Impor Data Produk</h1>
      <Card>
        <CardHeader>
          <CardTitle>1. Salin & Tempel Data Anda</CardTitle>
          <CardDescription>
            Salin data dari aplikasi spreadsheet (Excel, Google Sheets) dan tempel di area di bawah ini. Pastikan baris pertama adalah header.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Tempel data di sini..."
            className="min-h-[200px] font-mono text-sm"
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
          />
          <Button onClick={handleParse} className="mt-4">
            Proses Data
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {parsedData.length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle>2. Pratinjau & Konfirmasi Data</CardTitle>
                <CardDescription>
                    Berikut adalah data yang berhasil diproses. Periksa kembali sebelum melakukan impor.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-h-[400px] overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                            <TableRow>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead className="text-right">Harga Modal</TableHead>
                                <TableHead className="text-right">Harga Jual</TableHead>
                                <TableHead className="text-right">Stok</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((product, index) => (
                                <TableRow key={index}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell className="text-right">{(product.cost || 0).toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right">{(product.units[0]?.price || 0).toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right">{product.stock}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Perhatian</AlertTitle>
                    <AlertDescription>
                        Impor ini akan menggunakan satuan dasar "Pcs" untuk semua produk. Anda dapat mengubah atau menambahkan satuan lain nanti melalui menu edit produk.
                    </AlertDescription>
                </Alert>
                <Button onClick={handleImport} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Impor {parsedData.length} Produk
                </Button>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
