
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

        const accountTypesToClose = ['Pendapatan', 'Pendapatan Lainnya', 'Beban Pokok Penjualan', 'Beban Operasional', 'Beban Lainnya'];
        const accountsCol = collection(db, "coa");
        const accountsQuery = query(accountsCol, where("type", "in", accountTypesToClose));
        const accountsSnapshot = await getDocs(accountsQuery);
        const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));

        if (accounts.length === 0) {
            return createResponse("Tidak ada akun pendapatan atau beban yang ditemukan untuk ditutup.");
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const journalsCol = collection(db, "journals");
        const journalsQuery = query(
            journalsCol,
            where("date", ">=", Timestamp.fromDate(startDate)),
            where("date", "<=", Timestamp.fromDate(endDate))
        );
        const journalsSnapshot = await getDocs(journalsQuery);
        
        const accountBalances: { [accountId: string]: number } = {};
        journalsSnapshot.docs.forEach(doc => {
            const journal = doc.data();
            journal.entries.forEach((entry: JournalEntry) => {
                if (accountBalances[entry.accountId] === undefined) accountBalances[entry.accountId] = 0;
                accountBalances[entry.accountId] += entry.debit - entry.credit;
            });
        });

        const closingDate = new Date(year, month, 0, 23, 59, 58);
        const closingEntries1: JournalEntry[] = [];
        let totalRevenue = 0;
        let totalExpenses = 0;

        accounts.forEach(account => {
            const balance = accountBalances[account.id] || 0;
            if (balance === 0) return;

            const isRevenueType = account.type.includes('Pendapatan');

            if (isRevenueType) {
                closingEntries1.push({ accountId: account.id, accountName: account.name, debit: -balance, credit: 0 });
                totalRevenue += -balance;
            } else { 
                closingEntries1.push({ accountId: account.id, accountName: account.name, debit: 0, credit: balance });
                totalExpenses += balance;
            }
        });
        
        if (closingEntries1.length === 0) {
            return createResponse(`Tidak ada saldo pada akun pendapatan/beban untuk periode ${getMonthName(month)} ${year}.`);
        }

        const netIncome = totalRevenue - totalExpenses;

        if (netIncome > 0) { 
            closingEntries1.push({ accountId: incomeSummaryAccountId, accountName: 'Ikhtisar Laba Rugi', debit: 0, credit: netIncome });
        } else if (netIncome < 0) { 
            closingEntries1.push({ accountId: incomeSummaryAccountId, accountName: 'Ikhtisar Laba Rugi', debit: -netIncome, credit: 0 });
        }
        
        const closingJournal1: NewJournal = {
            date: closingDate,
            description: `Jurnal Penutup Pendapatan & Beban - ${getMonthName(month)} ${year}`,
            refNumber: `JNP-1-${year}-${month}`,
            entries: closingEntries1,
            total: totalRevenue > totalExpenses ? totalRevenue : totalExpenses,
        };
        await addJournalEntry(closingJournal1);

        if (netIncome !== 0) {
            const closingJournal2: NewJournal = {
                date: new Date(closingDate.getTime() + 1000), // 1 second later
                description: `Jurnal Penutup Ikhtisar L/R ke Laba Ditahan - ${getMonthName(month)} ${year}`,
                refNumber: `JNP-2-${year}-${month}`,
                entries: [
                    { accountId: incomeSummaryAccountId, accountName: 'Ikhtisar Laba Rugi', debit: netIncome > 0 ? netIncome : 0, credit: netIncome < 0 ? -netIncome : 0 },
                    { accountId: retainedEarningsAccountId, accountName: 'Laba Ditahan', debit: netIncome < 0 ? -netIncome : 0, credit: netIncome > 0 ? netIncome : 0 },
                ],
                total: Math.abs(netIncome),
            }
            await addJournalEntry(closingJournal2);
        }

        return createResponse();

    } catch (e) {
        console.error("Error performing period closing: ", e);
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}

const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('id-ID', { month: 'long' });
}
