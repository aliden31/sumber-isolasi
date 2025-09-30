'use client';

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function StockOpnamePage() {
  return (
     <PlaceholderPage 
        title="Penyesuaian Stok (Stock Opname)"
        description="Gunakan fitur ini untuk melakukan rekonsiliasi antara stok fisik di gudang dengan data yang tercatat di sistem. Alur kerja akan melibatkan pembuatan 'Sesi Stock Opname', pencatatan hasil hitungan fisik, dan kemudian sistem akan menampilkan selisih (lebih atau kurang). Saat penyesuaian dilakukan, sistem akan otomatis membuat jurnal akuntansi untuk mencatat kerugian atau keuntungan dari selisih persediaan, memastikan data inventaris dan keuangan Anda selalu akurat."
    />
  );
}
