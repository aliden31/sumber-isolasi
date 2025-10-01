

import { db } from '@/lib/firebase';
import type { Account } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CoaActions } from '@/components/accounting/coa-actions';
import { CoaTable } from '@/components/accounting/coa-table';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

async function getAccounts(): Promise<Account[]> {
  const accountsCol = collection(db, 'coa');
  const accountSnapshot = await getDocs(query(accountsCol, orderBy('code')));
  const accountList = accountSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      code: data.code,
      name: data.name,
      type: data.type,
    } as Account;
  });
  return accountList;
}

export default async function ChartOfAccountsPage() {
  const accounts = await getAccounts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div />
        <CoaActions hasAccounts={accounts.length > 0} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Daftar Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <CoaTable data={accounts} />
        </CardContent>
      </Card>
    </div>
  );
}
