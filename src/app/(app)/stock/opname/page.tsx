'use client';

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function StockOpnamePage() {
  return (
     <PlaceholderPage 
        title="Penyesuaian Stok (Stock Opname)"
        description="Gunakan fitur ini untuk melakukan rekonsiliasi antara stok fisik di gudang dengan data yang tercatat di sistem. Anda dapat membuat 'Sesi Stock Opname', mencatat hasil hitungan fisik, dan kemudian sistem akan menampilkan selisih (lebih atau kurang). Saat penyesuaian dilakukan, sistem akan otomatis membuat jurnal akuntansi untuk mencatat kerugian atau keuntungan dari selisih persediaan."
    />
  );
}
