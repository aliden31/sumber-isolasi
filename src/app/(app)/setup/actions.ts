
'use server';

import { seedInitialAccounts, seedInitialCustomers, seedInitialSuppliers } from "@/lib/seed-actions";

export async function handleSeedAll() {
    try {
        const coaResult = await seedInitialAccounts();
        if (coaResult.error) throw new Error(`COA: ${coaResult.error}`);
        
        const customerResult = await seedInitialCustomers();
        if (customerResult.error) throw new Error(`Customer: ${customerResult.error}`);

        const supplierResult = await seedInitialSuppliers();
        if (supplierResult.error) throw new Error(`Supplier: ${supplierResult.error}`);

        return { error: null };
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("Error during initial seed:", errorMessage);
        return { error: errorMessage };
    }
}
