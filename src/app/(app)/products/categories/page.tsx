
import { db } from '@/lib/firebase';
import type { ProductCategory } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryActions } from '@/components/products/category-actions';
import { CategoryTable } from '@/components/products/category-table';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

async function getCategories(): Promise<ProductCategory[]> {
  const categoriesCol = collection(db, 'productCategories');
  const categorySnapshot = await getDocs(query(categoriesCol, orderBy('name')));
  const categoryList = categorySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
    } as ProductCategory;
  });
  return categoryList;
}

export default async function ProductCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div />
        <CategoryActions />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryTable data={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
