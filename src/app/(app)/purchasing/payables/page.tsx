'use client';

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function AccountsPayablePage() {
  return (
     <PlaceholderPage 
        title="Utang Usaha (Accounts Payable)"
        description="Halaman ini adalah pusat untuk mengelola semua utang kepada pemasok. Anda dapat melihat daftar faktur yang belum dibayar, tanggal jatuh temponya, dan mencatat pembayaran. Saat pembayaran dicatat, sistem akan otomatis membuat jurnal untuk mendebit Utang Usaha dan mengkredit Kas/Bank."
    />
  );
}
