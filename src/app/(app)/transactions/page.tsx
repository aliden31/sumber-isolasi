

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Wallet, User, CheckCircle2, ArrowLeft, ArrowRight, Search, ChevronsUpDown, Store } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { collection, onSnapshot, query, where, Timestamp, orderBy, limit, startAfter, DocumentData, getDocs, Query, endBefore, limitToLast } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortOption = "date_desc" | "total_desc" | "total_asc";


function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const initialSearchId = searchParams.get('search') || '';

  const [date, setDate] = useState<DateRange | undefined>();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(initialSearchId);
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [transactionsPerPage, setTransactionsPerPage] = useState(100);


  useEffect(() => {
    fetchTransactions('initial');
  }, [date, sortOption, transactionsPerPage]);

  const fetchTransactions = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    setLoading(true);
    const transactionsCol = collection(db, "transactions");
    
    let baseQuery: Query<DocumentData>;

    const [sortField, sortDirection] = sortOption.split('_');

    if (sortField === 'date') {
      baseQuery = query(transactionsCol, orderBy("date", sortDirection as "desc" | "asc"));
    } else {
      // For price sort, we must have a date filter for composite index
      // Default to last 30 days if no date is selected
      const fromDate = date?.from || new Date(new Date().setDate(new Date().getDate() - 30));
      const toDate = date?.to || new Date();
      toDate.setHours(23, 59, 59, 999);
      
      baseQuery = query(transactionsCol, 
        where("date", ">=", fromDate),
        where("date", "<=", toDate),
        orderBy("total", sortDirection as "desc" | "asc")
      );
    }
    
    if (date?.from && sortField === 'date') { // Only apply date filter if sorting by date
        const from = Timestamp.fromDate(date.from);
        let to;
        if (date.to) {
            const toDayEnd = new Date(date.to);
            toDayEnd.setHours(23, 59, 59, 999);
            to = Timestamp.fromDate(toDayEnd);
        } else {
            const fromDayEnd = new Date(date.from);
            fromDayEnd.setHours(23, 59, 59, 999);
            to = Timestamp.fromDate(fromDayEnd);
        }
        baseQuery = query(baseQuery, where("date", ">=", from), where("date", "<=", to));
    }


    let q: Query<DocumentData>;
    if (direction === 'next' && lastVisible) {
        q = query(baseQuery, startAfter(lastVisible), limit(transactionsPerPage));
    } else if (direction === 'prev' && firstVisible) {
        q = query(baseQuery, endBefore(firstVisible), limitToLast(transactionsPerPage));
    } else {
        q = query(baseQuery, limit(transactionsPerPage));
    }
    
    const snapshot = await getDocs(q);

    const transactionList = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate(),
      } as Transaction;
    });

    setAllTransactions(transactionList);
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    setFirstVisible(snapshot.docs[0]);
    
    // Check for next page
    if (snapshot.docs.length < transactionsPerPage) {
        setHasNextPage(false);
    } else {
        const nextQuery = query(baseQuery, startAfter(snapshot.docs[snapshot.docs.length - 1]), limit(1));
        const nextSnapshot = await getDocs(nextQuery);
        setHasNextPage(!nextSnapshot.empty);
    }
    
    setLoading(false);
  };
  
  const [hasNextPage, setHasNextPage] = useState(false);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) {
      return allTransactions;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return allTransactions.filter(tx => 
      tx.id.toLowerCase().includes(lowercasedQuery) ||
      tx.items.some(item => item.productName.toLowerCase().includes(lowercasedQuery))
    );
  }, [allTransactions, searchQuery]);
  
  const handleNextPage = () => {
      setCurrentPage(prev => prev + 1);
      fetchTransactions('next');
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      fetchTransactions('prev');
    }
  };


  const totalSales = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + (tx.netTotal ?? tx.total), 0);
  }, [filteredTransactions]);
  
  const getPaymentBadge = (tx: Transaction) => {
      if (tx.paymentMethod === 'Kredit') {
          return (
              <Badge variant={tx.status === 'Lunas' ? 'secondary' : 'destructive'} className="flex items-center gap-1">
                {tx.status === 'Lunas' ? <CheckCircle2 size={12}/> : <Wallet size={12}/>}
                {tx.status}
            </Badge>
          )
      }
      return (
         <Badge variant={tx.paymentMethod === 'Tunai' ? 'default' : 'secondary'} className="flex items-center gap-1">
            <Wallet size={12}/>{tx.paymentMethod}
        </Badge>
      )
  }
  
  const handleSortChange = (value: SortOption) => {
    setSortOption(value);
    setCurrentPage(1);
    setLastVisible(null);
    setFirstVisible(null);
  }

  const handlePerPageChange = (value: string) => {
    setTransactionsPerPage(Number(value));
    setCurrentPage(1);
    setLastVisible(null);
    setFirstVisible(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-headline font-bold">Riwayat Transaksi</h1>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Cari ID atau nama produk..."
                    className="pl-8 sm:w-[200px] md:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
             <Select value={sortOption} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Urutkan berdasarkan..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="date_desc">Tanggal (Terbaru)</SelectItem>
                    <SelectItem value="total_desc">Harga (Tertinggi)</SelectItem>
                    <SelectItem value="total_asc">Harga (Terendah)</SelectItem>
                </SelectContent>
            </Select>
            <DateRangePicker 
                className="w-full sm:w-[300px]" 
                onSelect={(newDate) => {
                    setDate(newDate);
                    setCurrentPage(1); // Reset to first page on date change
                }}
            />
        </div>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                    <CardTitle className="font-headline">Semua Transaksi</CardTitle>
                    <CardDescription>Total penjualan bersih untuk periode yang dipilih (pada halaman ini).</CardDescription>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-sm text-muted-foreground">Total Penjualan Bersih</p>
                    <p className="text-xl sm:text-2xl font-bold">Rp {totalSales.toLocaleString('id-ID')}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue={initialSearchId || undefined}>
            {loading ? (
                <div className="text-center py-10 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin mr-2"/>Memuat data transaksi...</div>
            ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    {searchQuery ? `Tidak ada transaksi yang cocok dengan "${searchQuery}".` : "Tidak ada transaksi pada periode ini."}
                </div>
            ) : (
                filteredTransactions.map((tx, index) => (
                <AccordionItem value={tx.id} key={tx.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 w-full text-left">
                        <div className="col-span-2 sm:col-span-2 md:col-span-2">
                          <p className="font-semibold font-mono text-sm">
                            #{tx.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(tx.date, "dd MMM yyyy, HH:mm", { locale: id })}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-2 md:col-span-1 flex flex-col items-start">
                          {tx.customerName && (
                            <span className="text-sm flex items-center gap-1">
                              <User size={12}/>{tx.customerName}
                            </span>
                          )}
                          {tx.channel && (
                            <Badge variant="outline" className="flex items-center gap-1 mt-1">
                                <Store size={12} /> {tx.channel}
                            </Badge>
                          )}
                        </div>
                        <div className="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col items-start sm:items-end">
                            {getPaymentBadge(tx)}
                        </div>
                        <div className="col-span-1 sm:col-span-2 md:col-span-1 text-right">
                          <p className="font-bold text-md text-primary">Rp {(tx.netTotal ?? tx.total).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                  </AccordionTrigger>
                    <AccordionContent>
                    <div className="overflow-x-auto">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead>Jumlah</TableHead>
                                <TableHead>Harga</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tx.items.map((item, index) => (
                                <TableRow key={`${item.productId}-${index}`}>
                                    <TableCell>{item.productName || item.productId}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>Rp {item.price.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-right">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            {tx.discount || tx.fee ? (
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                                        <TableCell className="text-right font-medium">Rp {tx.total.toLocaleString('id-ID')}</TableCell>
                                    </TableRow>
                                    {tx.discount ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-right">Diskon</TableCell>
                                        <TableCell className="text-right text-destructive">- Rp {tx.discount.toLocaleString('id-ID')}</TableCell>
                                    </TableRow>
                                    ) : null}
                                    {tx.fee ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-right">Biaya Marketplace</TableCell>
                                            <TableCell className="text-right text-destructive">- Rp {tx.fee.toLocaleString('id-ID')}</TableCell>
                                        </TableRow>
                                    ) : null}
                                    <TableRow className="font-bold">
                                        <TableCell colSpan={3} className="text-right">Total Bersih</TableCell>
                                        <TableCell className="text-right">Rp {tx.netTotal?.toLocaleString('id-ID')}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            ) : null}
                        </Table>
                    </div>
                    </AccordionContent>
                </AccordionItem>
                ))
            )}
          </Accordion>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tampilkan</span>
                 <Select value={String(transactionsPerPage)} onValueChange={handlePerPageChange}>
                    <SelectTrigger className="w-[80px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                </Select>
                 <span className="text-sm text-muted-foreground">transaksi per halaman.</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Halaman {currentPage}</span>
                <Button variant="outline" onClick={handlePrevPage} disabled={currentPage === 1 || loading}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Sebelumnya
                </Button>
                <Button variant="outline" onClick={handleNextPage} disabled={!hasNextPage || loading}>
                    Berikutnya <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function TransactionsPage() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <TransactionsPageContent />
        </React.Suspense>
    )
}

// Ensure DateRangePicker component accepts onSelect prop
declare module '@/components/ui/date-range-picker' {
    interface DateRangePickerProps {
        onSelect?: (date?: DateRange) => void;
        className?: string;
    }
}
