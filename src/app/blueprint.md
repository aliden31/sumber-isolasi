# Blueprint Fitur Belum Selesai

Berikut adalah daftar lengkap fitur yang telah direncanakan namun saat ini masih berupa halaman *placeholder* dan belum memiliki fungsionalitas penuh. Beberapa fitur seperti Input Penjualan Manual (Piutang) dan Retur Penjualan Non-POS telah diimplementasikan.

## 1. Modul: Pembelian (Seluruh Alur Kerja)
Ini adalah modul terbesar yang belum diimplementasikan. Seluruh siklus pembelian, mulai dari permintaan internal hingga pembayaran utang, belum berfungsi.
- **Permintaan Pembelian (PR)**: Fitur untuk membuat permintaan pembelian internal sebelum menjadi PO.
- **Pesanan Pembelian (PO)**: Fitur untuk membuat dan melacak status pesanan resmi ke pemasok.
- **Penerimaan Barang (GRN)**: Fitur untuk mencatat barang yang diterima, menambah stok, dan membuat jurnal persediaan.
- **Faktur Pemasok**: Fitur untuk mencatat tagihan dari pemasok dan mengakui utang usaha.
- **Utang Usaha (Accounts Payable)**: Halaman untuk mengelola dan mencatat pembayaran semua utang kepada pemasok.
- **Retur Pembelian**: Alur untuk memproses pengembalian barang ke pemasok.

## 2. Modul: Produk & Stok (Fitur Lanjutan)
Manajemen inventaris yang lebih canggih belum tersedia.
- **Kategori Produk**: Halaman khusus untuk mengelola (CRUD) kategori produk secara terpusat.
- **Manajemen Multi-Gudang**: Fungsionalitas untuk membuat dan mengelola stok di beberapa lokasi atau gudang.
- **Transfer Stok**: Fitur untuk mencatat perpindahan barang antar gudang.
- **Penyesuaian Stok (Stock Opname)**: Alat untuk rekonsiliasi stok fisik dengan data sistem dan membuat jurnal penyesuaian.
- **Notifikasi Stok**: Sistem peringatan otomatis untuk produk yang stoknya menipis berdasarkan batas minimum yang ditetapkan.

## 3. Modul: Penjualan (Fitur Lanjutan)
- **Impor Penjualan**: Kemampuan untuk mengunggah data penjualan secara massal dari file CSV/Excel.

## 4. Modul: Kas & Bank
- **Rekonsiliasi Bank**: Alat untuk mencocokkan transaksi internal dengan laporan koran dari bank.

## 5. Modul: Akuntansi
- **Tutup Buku**: Proses akuntansi di akhir periode untuk menutup akun pendapatan/beban dan memindahkan laba/rugi ke ekuitas.

## 6. Modul: Laporan (Laporan Detail)
Meskipun Laporan Laba Rugi sudah ada, laporan-laporan analitis berikut masih berupa placeholder.
- **Laporan Penjualan**: Analisis mendalam tentang performa penjualan, produk terlaris, penjualan per kategori, dll.
- **Laporan Pembelian**: Analisis terperinci mengenai aktivitas pembelian dan performa pemasok.
- **Laporan Stok**: Termasuk Laporan Valuasi Persediaan (menghitung total nilai stok) dan Kartu Stok (melacak riwayat pergerakan per item).

## 7. Modul: Master Data & Pengaturan (Fitur Tambahan)
- **Pengguna & Hak Akses**: Manajemen pengguna dan peran (role) untuk membatasi akses ke fitur tertentu.
- **Pajak**: Pengelolaan jenis dan tarif pajak untuk transaksi.
- **Mata Uang**: Pengelolaan berbagai mata uang dan kursnya untuk transaksi valuta asing.
