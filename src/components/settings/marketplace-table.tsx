
'use client';

import type { MarketplaceStore } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MarketplaceRowActions } from './marketplace-actions';

interface MarketplaceStoreTableProps {
  data: MarketplaceStore[];
}

export function MarketplaceStoreTable({ data }: MarketplaceStoreTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Marketplace</TableHead>
            <TableHead>Nama Toko</TableHead>
            <TableHead>Nama Panggilan (Internal)</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((store) => (
            <TableRow key={store.id}>
              <TableCell><Badge variant="secondary">{store.marketplace}</Badge></TableCell>
              <TableCell className="font-medium">{store.storeName}</TableCell>
              <TableCell>{store.nickname}</TableCell>
              <TableCell className="text-right">
                <MarketplaceRowActions store={store} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
