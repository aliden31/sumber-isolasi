import { mockCustomers } from '@/lib/data';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerTable } from '@/components/customers/customer-table';
import { CustomerActions } from '@/components/customers/customer-actions';

async function getCustomers(): Promise<Customer[]> {
  // In a real app, you would fetch this data from your database.
  return mockCustomers;
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Manajemen Pelanggan</h1>
        <CustomerActions />
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
