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

- **Impor Penjualan dari Marketplace**: Antarmuka untuk mengunggah laporan dari Tokopedia, Shopee, dll. Logika pemrosesan file belum ada.
- **Rekonsiliasi Bank**: Antarmuka untuk mencocokkan transaksi bank sudah ada, termasuk unggah laporan koran. Fungsionalitas inti (pencocokan otomatis, jurnal penyesuaian) belum ada.

---

## 🚀 Prompt untuk Generate Aplikasi Mobile (Flutter)

Berikut adalah prompt yang dapat Anda gunakan untuk membuat versi mobile dari aplikasi ini menggunakan Flutter.

### **Judul Prompt:**
Buat Aplikasi Mobile Point-of-Sale (POS) dan ERP Lengkap dengan Flutter yang Terhubung ke Firebase

### **Deskripsi:**
Buat sebuah aplikasi mobile cross-platform (iOS & Android) menggunakan Flutter yang berfungsi sebagai sistem Enterprise Resource Planning (ERP) dan Point-of-Sale (POS) untuk usaha kecil hingga menengah. Aplikasi ini **harus** terhubung dan berinteraksi dengan database Cloud Firestore yang sudah ada dari aplikasi web backend. Semua operasi data (baca, tulis, perbarui, hapus) harus menargetkan koleksi Firestore yang sama dengan yang digunakan oleh aplikasi web.

### **Persyaratan Teknologi:**
1.  **Framework:** Flutter (versi terbaru).
2.  **Bahasa:** Dart.
3.  **Database:** Cloud Firestore (menggunakan package `cloud_firestore`).
4.  **Manajemen State:** Gunakan Riverpod untuk manajemen state yang reaktif dan efisien.
5.  **Desain UI:** Terapkan desain yang bersih, modern, dan responsif. Gunakan komponen Material Design 3. Utamakan pengalaman pengguna (UX) yang intuitif di perangkat mobile.
6.  **Navigasi:** Gunakan `go_router` untuk manajemen rute yang terstruktur.
7.  **Dependensi Tambahan:**
    *   `firebase_core` untuk inisialisasi Firebase.
    *   `intl` untuk format tanggal dan angka.
    *   `hooks_riverpod` & `flutter_riverpod` untuk state management.

### **Struktur Database (Koleksi Firestore):**
Aplikasi harus beroperasi pada koleksi-koleksi berikut. Buat model data (class) di Dart untuk setiap koleksi ini, lengkap dengan metode `fromJson` dan `toJson` untuk serialisasi.

*   `products`: Master data produk (nama, SKU, kategori, stok, harga pokok, satuan).
*   `productCategories`: Kategori untuk produk.
*   `customers`: Data pelanggan.
*   `suppliers`: Data pemasok.
*   `transactions`: Semua transaksi penjualan (POS dan invoice kredit).
*   `salesReturns`: Data retur penjualan.
*   `purchaseRequests`: Permintaan pembelian internal.
*   `purchaseOrders`: Pesanan pembelian ke pemasok.
*   `goodsReceipts`: Catatan penerimaan barang.
*   `supplierInvoices`: Faktur dari pemasok.
*   `purchasePayments`: Catatan pembayaran utang.
*   `purchaseReturns`: Data retur pembelian.
*   `warehouses`: Daftar gudang.
*   `stockTransfers`: Riwayat perpindahan stok.
*   `stockOpnames`: Riwayat penyesuaian stok.
*   `coa`: Bagan Akun (Chart of Accounts).
*   `journals`: Semua entri jurnal akuntansi.
*   `settings`: Dokumen tunggal untuk pengaturan (misal: `accounting`, `companyProfile`).

### **Logika Bisnis Inti (Wajib Diimplementasikan):**
Semua logika bisnis yang ada di aplikasi web (pada folder `actions`) harus direplikasi di dalam aplikasi Flutter, terutama untuk proses-proses berikut:

1.  **Transaksi Penjualan (`createTransaction`):**
    *   Saat transaksi selesai, kurangi stok dari koleksi `products`.
    *   Buat entri baru di koleksi `transactions`.
    *   **Secara otomatis**, buat entri jurnal di koleksi `journals` yang melibatkan akun-akun yang relevan (Kas/Bank/Piutang, Pendapatan, HPP, Persediaan) sesuai dengan pengaturan di `settings/accounting`.

2.  **Penerimaan Barang (`addGoodsReceipt`):**
    *   Saat barang diterima, tambah stok di koleksi `products`.
    *   Buat entri baru di `goodsReceipts`.
    *   Perbarui status `purchaseOrders` terkait.
    *   **Secara otomatis**, buat entri jurnal untuk mengakui penambahan nilai persediaan dan utang barang diterima.

3.  **Pembayaran Piutang/Utang (`settleReceivable`/`paySupplierInvoice`):**
    *   Perbarui status `transactions` atau `supplierInvoices`.
    *   **Secara otomatis**, buat entri jurnal untuk memindahkan saldo dari Piutang Usaha ke Kas/Bank, atau dari Kas/Bank ke Utang Usaha.

4.  **Retur Penjualan/Pembelian:**
    *   Sesuaikan kembali stok di koleksi `products`.
    *   **Secara otomatis**, buat jurnal pembalik untuk membatalkan pengakuan pendapatan/beban dan persediaan/piutang/utang.

5.  **Penyesuaian & Transfer Stok:**
    *   Pastikan setiap penyesuaian (opname) atau transfer stok secara akurat memperbarui field `stock` di dokumen produk yang relevan.
    *   Buat jurnal penyesuaian untuk setiap perubahan nilai persediaan akibat stock opname.

### **Struktur & Fitur Aplikasi Mobile:**
Buat struktur navigasi yang logis (misalnya menggunakan `BottomNavigationBar` atau `Drawer`) untuk menampung modul-modul berikut. Setiap layar harus menampilkan data secara *real-time* dari Firestore.

1.  **Dashboard:**
    *   Tampilkan ringkasan metrik utama (penjualan hari ini, total piutang, total utang, stok menipis) dalam bentuk kartu (Card).
    *   Tampilkan grafik tren penjualan mingguan.

2.  **Kasir (POS):**
    *   Layar utama untuk transaksi cepat. Tampilkan daftar produk dalam bentuk grid yang bisa disentuh untuk ditambahkan ke keranjang.
    *   Gunakan kamera perangkat untuk memindai barcode SKU (fitur opsional).
    *   Kelola keranjang belanja: tambah/kurangi kuantitas, hapus item.
    *   Selesaikan transaksi dengan pilihan pembayaran (Tunai, Transfer, dll.).
    *   Tampilkan dialog konfirmasi setelah transaksi berhasil dan berikan opsi untuk mencetak struk (misal: via printer Bluetooth).

3.  **Transaksi:**
    *   Tampilkan daftar semua riwayat transaksi dengan *infinite scroll* (paginasi).
    *   Sediakan fitur pencarian dan filter berdasarkan tanggal.
    *   Setiap item transaksi harus bisa diklik untuk melihat detail item yang terjual.

4.  **Manajemen Stok:**
    *   Layar untuk melihat daftar semua produk dengan stok saat ini.
    *   Fitur untuk menambah, mengedit, dan menghapus produk (CRUD).
    *   Layar khusus untuk melakukan *Stock Opname* (penyesuaian stok) dan *Stock Transfer*.

5.  **Laporan:**
    *   Buat laporan sederhana (dalam bentuk daftar atau grafik) untuk:
        *   Laporan Laba Rugi
        *   Laporan Neraca
        *   Laporan Penjualan (produk terlaris, dll.)

6.  **Pengaturan:**
    *   Layar untuk mengedit profil perusahaan.
    *   Layar untuk memetakan akun-akun default yang digunakan untuk jurnal otomatis.

### **Kesimpulan:**
Tujuan utamanya adalah membuat aplikasi mobile yang menjadi perpanjangan tangan dari aplikasi web, dengan berbagi database yang sama dan mereplikasi semua logika bisnis penting untuk memastikan integritas data di seluruh ekosistem. Fokus pada UX yang dioptimalkan untuk perangkat mobile.
