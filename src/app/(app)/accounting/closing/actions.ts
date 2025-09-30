"use server";

import { collection, query, where, Timestamp, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAccountingSettings } from "@/app/(app)/settings/accounting/actions";
import { addJournalEntry } from "@/app/(app)/accounting/journal/actions";
import type { JournalEntry, NewJournal, Account } from "@/lib/types";

const createResponse = (error: string | null = null) => ({ error });

export async function performPeriodClosing({ year, month }: { year: number, month: number }) {
    try {
        const settings = await getAccountingSettings();
        const { incomeSummaryAccountId, retainedEarningsAccountId } = settings;

        if (!incomeSummaryAccountId || !retainedEarningsAccountId) {
            throw new Error("Akun Ikhtisar Laba Rugi atau Laba Ditahan belum diatur di Pengaturan Akuntansi.");
        }

        // 1. Get all relevant accounts (Revenue & Expense)
        const accountTypesToClose = ['Pendapatan', 'Pendapatan Lainnya', 'Beban Pokok Penjualan', 'Beban Operasional', 'Beban Lainnya'];
        const accountsCol = collection(db, "coa");
        const accountsQuery = query(accountsCol, where("type", "in", accountTypesToClose));
        const accountsSnapshot = await getDocs(accountsQuery);
        const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));

        if (accounts.length === 0) {
            return createResponse("Tidak ada akun pendapatan atau beban yang ditemukan untuk ditutup.");
        }

        // 2. Get all journal entries for the specified period
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const journalsCol = collection(db, "journals");
        const journalsQuery = query(
            journalsCol,
            where("date", ">=", Timestamp.fromDate(startDate)),
            where("date", "<=", Timestamp.fromDate(endDate))
        );
        const journalsSnapshot = await getDocs(journalsQuery);
        
        // 3. Calculate balances for each account
        const accountBalances: { [accountId: string]: number } = {};
        journalsSnapshot.docs.forEach(doc => {
            const journal = doc.data();
            journal.entries.forEach((entry: JournalEntry) => {
                if (accountBalances[entry.accountId] === undefined) accountBalances[entry.accountId] = 0;
                accountBalances[entry.accountId] += entry.debit - entry.credit;
            });
        });

        // 4. Prepare closing journal entries
        const closingDate = new Date(year, month, 0, 23, 59, 58); // End of the month
        const closingEntries: JournalEntry[] = [];
        let netIncome = 0;

        accounts.forEach(account => {
            const balance = accountBalances[account.id] || 0;
            if (balance === 0) return;

            // Revenue and Contra-Expense accounts have credit balances (balance < 0)
            if (account.type.includes('Pendapatan')) {
                closingEntries.push({ accountId: account.id, accountName: account.name, debit: -balance, credit: 0 });
                netIncome += -balance;
            } 
            // Expense and Contra-Revenue accounts have debit balances (balance > 0)
            else {
                closingEntries.push({ accountId: account.id, accountName: account.name, debit: 0, credit: balance });
                netIncome -= balance;
            }
        });
        
        if (closingEntries.length === 0) {
            return createResponse(`Tidak ada saldo pada akun pendapatan/beban untuk periode ${startDate.toLocaleString('default', { month: 'long' })} ${year}.`);
        }


        // 5. Close all revenue/expense accounts to Income Summary
        if (netIncome > 0) { // Profit
            closingEntries.push({ accountId: incomeSummaryAccountId, accountName: 'Ikhtisar Laba Rugi', debit: 0, credit: netIncome });
        } else { // Loss
            closingEntries.push({ accountId: incomeSummaryAccountId, accountName: 'Ikhtisar Laba Rugi', debit: -netIncome, credit: 0 });
        }
        
        const closingJournal1: NewJournal = {
            date: closingDate,
            description: `Jurnal Penutup Pendapatan & Beban - ${getMonthName(month)} ${year}`,
            refNumber: `JE-CLOSE-1-${year}-${month}`,
            entries: closingEntries,
            total: Math.abs(netIncome),
        };
        await addJournalEntry(closingJournal1);


        // 6. Close Income Summary to Retained Earnings
        const closingJournal2: NewJournal = {
            date: new Date(closingDate.getTime() + 1000), // 1 second later
            description: `Jurnal Penutup Ikhtisar L/R - ${getMonthName(month)} ${year}`,
            refNumber: `JE-CLOSE-2-${year}-${month}`,
            entries: [
                { accountId: incomeSummaryAccountId, accountName: 'Ikhtisar Laba Rugi', debit: netIncome > 0 ? netIncome : 0, credit: netIncome < 0 ? -netIncome : 0 },
                { accountId: retainedEarningsAccountId, accountName: 'Laba Ditahan', debit: netIncome < 0 ? -netIncome : 0, credit: netIncome > 0 ? netIncome : 0 },
            ],
            total: Math.abs(netIncome),
        }
        await addJournalEntry(closingJournal2);

        return createResponse();

    } catch (e) {
        console.error("Error performing period closing: ", e);
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}

const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('id-ID', { month: 'long' });
}
