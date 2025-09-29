'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FilePlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const mockCurrencies = [
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rate: 1, isDefault: true },
    { code: 'USD', name: 'United States Dollar', symbol: '$', rate: 16400, isDefault: false },
];

export default function CurrenciesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">
          Master Data Mata Uang
        </h1>
        <Button>
          <FilePlus className="mr-2 h-4 w-4" /> Tambah Mata Uang
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Mata Uang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Mata Uang</TableHead>
                  <TableHead>Simbol</TableHead>
                  <TableHead>Kurs terhadap IDR</TableHead>
                  <TableHead>Default</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCurrencies.map((currency) => (
                  <TableRow key={currency.code}>
                    <TableCell className="font-mono font-bold">{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell>{currency.symbol}</TableCell>
                    <TableCell>{currency.rate.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Switch id={`default-${currency.code}`} checked={currency.isDefault} />
                        {currency.isDefault && <Badge>Default</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
