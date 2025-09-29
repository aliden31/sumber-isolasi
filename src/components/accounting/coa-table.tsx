
'use client';

import type { Account } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CoaRowActions } from './coa-actions';

interface CoaTableProps {
  data: Account[];
}

export function CoaTable({ data }: CoaTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode Akun</TableHead>
            <TableHead>Nama Akun</TableHead>
            <TableHead>Tipe Akun</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-mono">{account.code}</TableCell>
              <TableCell className="font-medium">{account.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{account.type}</Badge>
              </TableCell>
               <TableCell className="text-right">
                <CoaRowActions account={account} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

