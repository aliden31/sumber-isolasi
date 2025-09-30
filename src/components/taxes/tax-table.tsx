'use client';

import type { Tax } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TaxRowActions } from './tax-actions';

interface TaxTableProps {
  data: Tax[];
}

export function TaxTable({ data }: TaxTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Pajak</TableHead>
            <TableHead>Tarif</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((tax) => (
            <TableRow key={tax.id}>
              <TableCell className="font-medium">{tax.name}</TableCell>
              <TableCell>{tax.rate}%</TableCell>
              <TableCell>{tax.description}</TableCell>
              <TableCell className="text-right">
                <TaxRowActions tax={tax} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}