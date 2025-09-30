'use client';

import type { Warehouse } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { WarehouseRowActions } from './warehouse-actions';

interface WarehouseTableProps {
  data: Warehouse[];
}

export function WarehouseTable({ data }: WarehouseTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Gudang</TableHead>
            <TableHead>Alamat</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((warehouse) => (
            <TableRow key={warehouse.id}>
              <TableCell className="font-medium">{warehouse.name}</TableCell>
              <TableCell>{warehouse.address}</TableCell>
              <TableCell>
                {warehouse.isDefault && <Badge>Utama</Badge>}
              </TableCell>
              <TableCell className="text-right">
                <WarehouseRowActions warehouse={warehouse} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}