
import type { Product } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ProductRowActions } from './product-actions';

interface ProductTableProps {
  data: Product[];
}

export function ProductTable({ data }: ProductTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Nama Produk</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Harga Jual (Satuan Dasar)</TableHead>
            <TableHead className="text-center">Stok (Satuan Dasar)</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((product) => {
            const baseUnit = product.units?.find(u => u.conversionRate === 1) || product.units?.[0];
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell>
                  {baseUnit ? `Rp ${baseUnit.price.toLocaleString('id-ID')}` : '-'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={product.stock < (product.minStockThreshold || 10) ? 'destructive' : 'secondary'}>
                    {product.stock} {product.baseUnit}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ProductRowActions product={product} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
