'use client';

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ImportSalesPage() {
  return (
     <PlaceholderPage 
        title="Impor Penjualan"
        description="Fitur ini akan memungkinkan Anda untuk mengunggah data penjualan dari file CSV atau Excel. Sistem akan memandu Anda melalui proses pemetaan kolom (misalnya, mencocokkan 'Kode Produk' dari file Anda ke 'productId' di sistem), memvalidasi data, dan secara otomatis membuat transaksi beserta jurnal akuntansinya secara massal. Ini sangat berguna untuk mengimpor riwayat penjualan dari platform lain seperti marketplace atau sistem POS lama."
    />
  );
}
