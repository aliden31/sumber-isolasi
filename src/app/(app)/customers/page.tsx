
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerTable } from '@/components/customers/customer-table';
import { CustomerActions } from '@/components/customers/customer-actions';
import { collection, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getCustomers(): Promise<Customer[]> {
  const customersCol = collection(db, "customers");
  const customerSnapshot = await getDocs(customersCol);
  const customerList = customerSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    } as Customer;
  });
  return customerList;
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Manajemen Pelanggan</h1>
        <CustomerActions hasCustomers={customers.length > 0} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerTable data={customers} />
        </CardContent>
      </Card>
    </div>
  );
}
