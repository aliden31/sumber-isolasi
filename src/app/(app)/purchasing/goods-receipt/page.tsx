'use client';

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function GoodsReceiptPage() {
  return (
     <PlaceholderPage 
        title="Penerimaan Barang (Goods Receipt Note)"
        description="Fitur ini digunakan untuk mencatat penerimaan barang fisik dari pemasok berdasarkan Pesanan Pembelian (PO). Saat barang diterima, sistem akan secara otomatis menambah jumlah stok produk terkait dan membuat entri jurnal akuntansi untuk mendebit akun Persediaan dan mengkredit akun 'Hutang Barang Diterima'."
    />
  );
}
