'use client';

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function ImportSalesPage() {
  return (
     <PlaceholderPage 
        title="Impor Penjualan"
        description="Fitur ini akan memungkinkan Anda untuk mengunggah data penjualan dalam format CSV. Sistem akan memvalidasi data, memetakan kolom (misalnya, SKU, kuantitas, harga) ke field di database, dan secara otomatis membuat transaksi beserta jurnal akuntansinya secara massal. Ini sangat berguna untuk mengimpor riwayat penjualan dari platform lain seperti marketplace."
    />
  );
}
