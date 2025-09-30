# Blueprint & Status Pengembangan

Berikut adalah daftar lengkap fitur aplikasi, beserta status implementasinya.

## ✅ Fitur Selesai

Fitur-fitur berikut telah diimplementasikan sepenuhnya dan berfungsi dengan baik.

### Modul: Kasir (POS)
- **Transaksi Baru**: Antarmuka kasir utama untuk penjualan.
- **Transaksi Terparkir**: Menyimpan dan melanjutkan sesi keranjang belanja.
- **Retur Kasir**: Memproses pengembalian barang dari transaksi tunai/langsung.
- **Cetak Ulang Struk**: Mencari dan mencetak kembali struk transaksi.

### Modul: Penjualan
- **Riwayat Penjualan**: Melihat daftar lengkap semua transaksi.
- **Buat Invoice (Input Manual)**: Membuat penjualan kredit/piutang untuk pelanggan.
- **Piutang Usaha**: Mengelola dan mencatat pelunasan piutang dari pelanggan.
- **Retur Penjualan**: Memproses pengembalian barang dari penjualan kredit (non-POS).

### Modul: Pembelian (Alur Penuh)
- **Permintaan Pembelian (PR)**: Membuat permintaan pembelian internal sebelum menjadi PO.
- **Pesanan Pembelian (PO)**: Membuat dan melacak status pesanan resmi ke pemasok.
- **Penerimaan Barang (GRN)**: Mencatat barang yang diterima, menambah stok, dan membuat jurnal.
- **Faktur Pemasok**: Mencatat tagihan dari pemasok dan mengakui utang usaha.
- **Utang Usaha (Accounts Payable)**: Mengelola dan mencatat pembayaran utang kepada pemasok.
- **Retur Pembelian**: Memproses pengembalian barang ke pemasok.

### Modul: Produk & Stok
- **Master Produk**: Manajemen data produk (CRUD).
- **Kategori Produk**: Manajemen kategori produk (CRUD).
- **Gudang**: Manajemen daftar gudang (CRUD).
- **Notifikasi Stok**: Dasbor untuk melihat produk yang stoknya menipis.
- **Estimasi Stok (AI)**: Alat bantu AI untuk memprediksi kebutuhan stok.
- **Transfer Stok**: Fitur untuk mencatat perpindahan barang antar gudang.
- **Penyesuaian Stok (Stock Opname)**: Alat untuk rekonsiliasi stok fisik dengan data sistem.

### Modul: Kas & Bank
- **Kas Masuk**: Mencatat pemasukan di luar penjualan (misal: setoran modal).
- **Kas Keluar**: Mencatat pengeluaran operasional (misal: bayar listrik).
- **Transfer Antar Kas**: Mencatat perpindahan dana antar rekening kas/bank.
- **Rekonsiliasi Bank**: UI dasar untuk proses rekonsiliasi.

### Modul: Akuntansi
- **Bagan Akun (COA)**: Manajemen daftar akun akuntansi (CRUD) dan seeding.
- **Jurnal Umum**: Input manual untuk transaksi jurnal.
- **Buku Besar**: Melihat riwayat transaksi per akun.
- **Tutup Buku**: Proses akuntansi akhir periode untuk menutup akun temporer.

### Modul: Laporan
- **Laporan Penjualan**: Analisis performa penjualan, produk terlaris, dan tren.
- **Laporan Pembelian**: Analisis aktivitas pembelian dan pemasok.
- **Laporan Stok**: Rincian stok dan valuasi persediaan.
- **Laporan Laba Rugi**: Laporan keuangan untuk mengukur profitabilitas.

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

Fitur-fitur berikut masih berupa halaman *placeholder* dan belum memiliki fungsionalitas penuh.

- **Impor Penjualan**: Kemampuan untuk mengunggah data penjualan secara massal dari file CSV/Excel.
- **Rekonsiliasi Bank**: Fungsionalitas inti (unggah laporan koran, pencocokan otomatis) belum ada.
- **Pengguna & Hak Akses**: Manajemen pengguna dan peran (role) untuk membatasi akses.
