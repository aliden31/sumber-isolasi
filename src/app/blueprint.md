
# Blueprint & Status Pengembangan

Berikut adalah daftar lengkap fitur aplikasi, beserta status implementasinya.

## ✅ Fitur Selesai

Fitur-fitur berikut telah diimplementasikan sepenuhnya dan berfungsi dengan baik.

### Modul: Dashboard
- **Ringkasan Cepat**: Menampilkan ringkasan total penjualan harian, total piutang usaha, total utang usaha, dan jumlah produk dengan stok menipis.
- **Grafik Penjualan**: Visualisasi tren penjualan selama 7 hari terakhir.

### Modul: Kasir (POS)
- **Transaksi Baru**: Antarmuka kasir utama untuk penjualan.
- **Transaksi Terparkir**: Menyimpan dan melanjutkan sesi keranjang belanja.
- **Retur Kasir**: Memproses pengembalian barang dari transaksi tunai/langsung.
- **Cetak Ulang Struk**: Mencari dan mencetak kembali struk transaksi.

### Modul: Penjualan
- **Riwayat Penjualan**: Melihat daftar lengkap semua transaksi dengan paginasi.
- **Buat Invoice (Input Manual)**: Membuat penjualan kredit/piutang untuk pelanggan.
- **Piutang Usaha**: Mengelola dan mencatat pelunasan piutang dari pelanggan.
- **Retur Penjualan**: Memproses pengembalian barang dari penjualan kredit (non-POS).
- **Impor Penjualan dari Marketplace**: Antarmuka untuk mengunggah dan mem-parsing laporan dari Tokopedia, Shopee, dll. Logika untuk menyimpan ke database dan rekonsiliasi sudah ada.

### Modul: Pembelian (Alur Penuh)
- **Permintaan Pembelian (PR)**: Membuat permintaan pembelian internal sebelum menjadi PO.
- **Pesanan Pembelian (PO)**: Membuat dan melacak status pesanan resmi ke pemasok.
- **Penerimaan Barang (GRN)**: Mencatat barang yang diterima, menambah stok, dan membuat jurnal.
- **Faktur Pemasok**: Mencatat tagihan dari pemasok dan mengakui utang usaha.
- **Retur Pembelian**: Memproses pengembalian barang ke pemasok.
- **Utang Usaha (Accounts Payable)**: Mengelola dan mencatat pembayaran utang kepada pemasok.

### Modul: Produk & Stok
- **Master Produk**: Manajemen data produk (CRUD) dengan dukungan multi-satuan.
- **Kategori Produk**: Manajemen kategori produk (CRUD).
- **Gudang**: Manajemen daftar gudang (CRUD).
- **Impor Produk**: Fitur untuk mengunggah data produk secara massal.
- **Notifikasi Stok**: Dasbor untuk melihat produk yang stoknya menipis.
- **Estimasi Stok (AI)**: Alat bantu AI untuk memprediksi kebutuhan stok.
- **Transfer Stok**: Fitur untuk mencatat perpindahan barang antar gudang.
- **Penyesuaian Stok (Stock Opname)**: Alat untuk rekonsiliasi stok fisik dengan data sistem.

### Modul: Kas & Bank
- **Kas Masuk**: Mencatat pemasukan di luar penjualan (misal: setoran modal).
- **Kas Keluar**: Mencatat pengeluaran operasional (misal: bayar listrik).
- **Transfer Antar Kas**: Mencatat perpindahan dana antar rekening kas atau bank.

### Modul: Akuntansi
- **Bagan Akun (COA)**: Manajemen daftar akun akuntansi (CRUD) dan seeding.
- **Jurnal Umum**: Input manual untuk transaksi jurnal.
- **Buku Besar**: Melihat riwayat transaksi per akun.
- **Tutup Buku**: Proses akuntansi akhir periode untuk menutup akun temporer.
- **Jurnal Pembalik (Reversing Entries)**: Membuat jurnal pembalik secara otomatis di awal periode baru untuk membalik jurnal penyesuaian tertentu.

### Modul: Laporan
- **Laporan Penjualan**: Analisis performa penjualan, produk terlaris, dan tren.
- **Laporan Pembelian**: Analisis aktivitas pembelian dan pemasok.
- **Laporan Stok**: Rincian stok dan valuasi persediaan.
- **Laporan Laba Rugi**: Laporan keuangan untuk mengukur profitabilitas.
- **Laporan Neraca**: Laporan posisi keuangan (Aset, Kewajiban, Ekuitas).
- **Laporan Arus Kas**: Laporan keuangan untuk melacak pergerakan kas.

### Modul: Master Data & Pengaturan
- **Pelanggan**: Manajemen data pelanggan (CRUD).
- **Pemasok**: Manajemen data pemasok (CRUD).
- **Pajak**: Manajemen tarif pajak (CRUD).
- **Mata Uang**: Manajemen mata uang (CRUD).
- **Profil Perusahaan**: Mengatur informasi dasar perusahaan.
- **Pengaturan Akuntansi**: Memetakan akun untuk jurnal otomatis.
- **Data & Reset**: Fitur untuk menghapus data transaksional atau master.

---

## 🚧 Fitur Dalam Pengembangan

Fitur-fitur berikut masih berupa halaman *placeholder* atau dalam tahap pengembangan aktif.

- **Rekonsiliasi Bank**: Antarmuka untuk mencocokkan transaksi bank sudah ada, termasuk unggah laporan koran. Fungsionalitas inti (pencocokan otomatis, jurnal penyesuaian) belum ada.
- **Pengguna & Hak Akses**: Antarmuka untuk menampilkan pengguna sudah ada dengan data statis. Manajemen peran dan integrasi dengan Firebase Auth belum diimplementasikan.
