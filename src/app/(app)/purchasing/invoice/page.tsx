'use client';

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function SupplierInvoicePage() {
  return (
     <PlaceholderPage 
        title="Faktur / Invoice Pemasok"
        description="Gunakan fitur ini untuk mencatat faktur tagihan yang diterima dari pemasok. Sistem akan mencocokkan faktur dengan data Penerimaan Barang (GRN) dan Pesanan Pembelian (PO). Pencatatan faktur akan memicu entri jurnal untuk mengakui Utang Usaha (Accounts Payable) secara resmi."
    />
  );
}
