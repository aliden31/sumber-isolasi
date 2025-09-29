import { mockSuppliers } from '@/lib/data';
import type { Supplier } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupplierTable } from '@/components/suppliers/supplier-table';
import { SupplierActions } from '@/components/suppliers/supplier-actions';

async function getSuppliers(): Promise<Supplier[]> {
  // In a real app, you would fetch this data from your database.
  return mockSuppliers;
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Manajemen Supplier</h1>
        <SupplierActions />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Supplier</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierTable data={suppliers} />
        </CardContent>
      </Card>
    </div>
  );
}
