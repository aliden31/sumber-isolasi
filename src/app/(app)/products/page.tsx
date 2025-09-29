import { mockProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductTable } from '@/components/products/product-table';
import { ProductActions } from '@/components/products/product-actions';

// This would typically fetch data from a database
async function getProducts(): Promise<Product[]> {
  return mockProducts;
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Manajemen Produk</h1>
        <ProductActions />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductTable data={products} />
        </CardContent>
      </Card>
    </div>
  );
}
