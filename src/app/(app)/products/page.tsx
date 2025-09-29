import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductTable } from '@/components/products/product-table';
import { ProductActions } from '@/components/products/product-actions';
import { collection, getDocs } from 'firebase/firestore';

// This would typically fetch data from a database
async function getProducts(): Promise<Product[]> {
  const productsCol = collection(db, 'products');
  const productSnapshot = await getDocs(productsCol);
  const productList = productSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      price: data.price,
      cost: data.cost,
      stock: data.stock,
      category: data.category,
    } as Product;
  });
  return productList;
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Manajemen Produk</h1>
        <ProductActions hasProducts={products.length > 0} />
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
