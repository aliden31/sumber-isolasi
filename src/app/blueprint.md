# Blueprint Fitur Belum Selesai

Berikut adalah daftar lengkap fitur yang telah direncanakan dalam proposal awal namun saat ini masih berupa halaman *placeholder* dan belum memiliki fungsionalitas penuh.

## 1. Modul: Pembelian (Seluruh Alur Kerja)
Seluruh siklus pembelian, mulai dari permintaan internal hingga pembayaran utang, belum diimplementasikan.
- **Permintaan Pembelian (PR)**: Fitur untuk membuat permintaan pembelian internal sebelum menjadi PO.
- **Pesanan Pembelian (PO)**: Fitur untuk membuat dan melacak status pesanan resmi ke pemasok.
- **Penerimaan Barang (GRN)**: Fitur untuk mencatat barang yang diterima, menambah stok, dan membuat jurnal persediaan.
- **Faktur Pemasok**: Fitur untuk mencatat tagihan dari pemasok dan mengakui utang usaha.
- **Utang Usaha**: Halaman untuk mengelola dan mencatat pembayaran semua utang kepada pemasok.
- **Retur Pembelian**: Alur untuk memproses pengembalian barang ke pemasok.

## 2. Modul: Produk & Stok (Fitur Lanjutan)
Manajemen inventaris yang lebih canggih belum tersedia.
- **Kategori Produk**: Kemampuan untuk mengelompokkan produk ke dalam kategori untuk analisis.
- **Multi-Gudang**: Fungsionalitas untuk mengelola stok di beberapa lokasi atau gudang.
- **Transfer Stok**: Fitur untuk mencatat perpindahan barang antar gudang.
- **Penyesuaian Stok (Stock Opname)**: Alat untuk rekonsiliasi stok fisik dengan data sistem.
- **Notifikasi Stok**: Sistem peringatan otomatis untuk produk yang stoknya menipis.

## 3. Modul: Penjualan (Fitur Lanjutan)
- **Impor Penjualan**: Kemampuan untuk mengunggah data penjualan secara massal dari file CSV/Excel.

## 4. Modul: Kas & Bank
- **Rekonsiliasi Bank**: Alat untuk mencocokkan transaksi internal dengan laporan koran dari bank.

## 5. Modul: Akuntansi
- **Tutup Buku**: Proses akuntansi di akhir periode untuk menutup akun pendapatan/beban dan memindahkan laba/rugi ke ekuitas.

## 6. Modul: Laporan (Laporan Detail)
Meskipun Laporan Laba Rugi sudah ada, laporan-laporan analitis berikut masih berupa placeholder.
- **Laporan Penjualan**: Analisis mendalam tentang performa penjualan, produk terlaris, dll.
- **Laporan Pembelian**: Analisis terperinci mengenai aktivitas pembelian dan performa pemasok.
- **Laporan Stok**: Termasuk Laporan Valuasi Persediaan dan Kartu Stok untuk pelacakan pergerakan barang.

## 7. Modul: Master Data & Pengaturan (Fitur Tambahan)
- **Pengguna & Hak Akses**: Manajemen pengguna dan peran (role) untuk membatasi akses.
- **Pajak**: Pengelolaan jenis dan tarif pajak untuk transaksi.
- **Mata Uang**: Pengelolaan berbagai mata uang dan kursnya.
