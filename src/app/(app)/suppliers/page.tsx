
import { db } from '@/lib/firebase';
import type { Supplier } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SupplierTable } from '@/components/suppliers/supplier-table';
import { SupplierActions } from '@/components/suppliers/supplier-actions';
import { collection, getDocs } from 'firebase/firestore';

async function getSuppliers(): Promise<Supplier[]> {
  const suppliersCol = collection(db, 'suppliers');
  const supplierSnapshot = await getDocs(suppliersCol);
  const supplierList = supplierSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
    } as Supplier;
  });
  return supplierList;
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Manajemen Supplier</h1>
        <SupplierActions hasSuppliers={suppliers.length > 0} />
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
