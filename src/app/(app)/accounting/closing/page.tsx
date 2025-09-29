'use client';

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function PeriodClosingPage() {
  return (
     <PlaceholderPage 
        title="Tutup Buku Periode"
        description="Fitur ini akan melakukan proses akuntansi penting di akhir periode (bulanan atau tahunan). Proses ini akan secara otomatis membuat entri jurnal penutup untuk mentransfer total saldo dari semua akun Pendapatan dan Beban ke akun Ekuitas (misalnya, Laba Ditahan). Hasilnya, Laporan Laba Rugi akan di-reset menjadi nol untuk memulai periode baru, dan laba/rugi bersih periode tersebut akan tercermin secara akurat di Neraca. Setelah ditutup, semua transaksi dalam periode tersebut akan dikunci untuk mencegah perubahan."
    />
  );
}
