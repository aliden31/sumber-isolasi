'use client';

import type { Currency } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyRowActions } from './currency-actions';

interface CurrencyTableProps {
  data: Currency[];
}

export function CurrencyTable({ data }: CurrencyTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Mata Uang</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Simbol</TableHead>
            <TableHead>Kurs</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((currency) => (
            <TableRow key={currency.id}>
              <TableCell className="font-medium">{currency.name}</TableCell>
              <TableCell className="font-mono">{currency.code}</TableCell>
              <TableCell>{currency.symbol}</TableCell>
              <TableCell>{currency.exchangeRate}</TableCell>
              <TableCell className="text-right">
                <CurrencyRowActions currency={currency} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
