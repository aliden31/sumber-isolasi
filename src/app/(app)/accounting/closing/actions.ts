
"use server";

import { collection, query, where, Timestamp, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAccountingSettings } from "@/app/(app)/settings/accounting/actions";
import { addJournalEntry } from "@/app/(app)/accounting/journal/actions";
import type { JournalEntry, NewJournal, Account, Journal } from "@/lib/types";

const createResponse = (error: string | null = null, extraMessage: string | null = null) => ({ error, extraMessage });

async function createReversingEntries(year: number, month: number) {
    const reversingDate = new Date(year, month, 1); // Reversing entry is for the 1st day of the next month.
    const periodStartDate = new Date(year, month - 1, 1);
    const periodEndDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Define account types that typically require reversing entries (accruals and some deferrals)
    const accrualAccountTypes = ['Kewajiban Jangka Pendek', 'Aset Lancar'];
    const accrualAccountNames = ['Utang Gaji', 'Pendapatan Diterima di Muka', 'Sewa Dibayar di Muka', 'Asuransi Dibayar di Muka'];
    
    // Find all adjusting journal entries in the period that are NOT closing entries
    const journalsCol = collection(db, "journals");
    const journalsQuery = query(
        journalsCol,
        where("date", ">=", Timestamp.fromDate(periodStartDate)),
        where("date", "<=", Timestamp.fromDate(periodEndDate)),
        where("description", "not-in", ["Jurnal Penutup", "Jurnal Penyesuaian"]) // A common convention is to label adjustments
    );
    const journalsSnapshot = await getDocs(journalsQuery);
    
    const entriesToReverse: JournalEntry[] = [];

    for (const doc of journalsSnapshot.docs) {
        const journal = doc.data() as Journal;
        if (journal.description.includes('Jurnal Penutup')) continue;

        for (const entry of journal.entries) {
            const accountDoc = await getDoc(collection(db, "coa"), entry.accountId);
            if (!accountDoc.exists()) continue;
            
            const account = accountDoc.data() as Account;

            // Check if the account is an accrual/deferral type that needs reversing
            if (accrualAccountTypes.includes(account.type) && accrualAccountNames.some(name => account.name.includes(name))) {
                 // Reverse the entry
                 entriesToReverse.push({
                     accountId: entry.accountId,
                     accountName: entry.accountName,
                     debit: entry.credit,
                     credit: entry.debit
                 });
            }
        }
    }

    if (entriesToReverse.length > 0) {
        // To ensure the reversing journal is balanced, we must process full journals, not individual entries.
        // For simplicity here, we assume the found entries are part of a simple two-leg journal.
        // A more robust solution would group entries by journal ID and reverse the entire journal.
        
        // Let's find pairs to ensure balance
        const reversingJournalEntries: JournalEntry[] = [];
        let total = 0;

        journalsSnapshot.docs.forEach(doc => {
            const journal = doc.data() as Journal;
             if (journal.description.includes('Jurnal Penutup')) return;
            const hasReversibleEntry = journal.entries.some(async entry => {
                 const accountDoc = await getDoc(collection(db, "coa"), entry.accountId);
                 const account = accountDoc.data() as Account;
                 return accrualAccountTypes.includes(account.type) && accrualAccountNames.some(name => account.name.includes(name));
            });

            if (hasReversibleEntry) {
                journal.entries.forEach(entry => {
                    reversingJournalEntries.push({
                        accountId: entry.accountId,
                        accountName: entry.accountName,
                        debit: entry.credit, // reverse
                        credit: entry.debit  // reverse
                    });
                });
                total += journal.total;
            }
        });

        if (reversingJournalEntries.length > 0) {
            const reversingJournal: NewJournal = {
                date: reversingDate,
                description: `Jurnal Pembalik untuk Periode ${getMonthName(month)} ${year}`,
                refNumber: `JPB-${year}-${month}`,
                entries: reversingJournalEntries,
                total: total,
            };
            await addJournalEntry(reversingJournal);
            return `Jurnal pembalik untuk ${getMonthName(month)} ${year} berhasil dibuat.`;
        }
    }

    return null;
}


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
        
        // After successful closing, create reversing entries for the next period
        const reversingMessage = await createReversingEntries(year, month);

        return createResponse(null, reversingMessage);

    } catch (e) {
        console.error("Error performing period closing: ", e);
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}

const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('id-ID', { month: 'long' });
}
