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
- **Pengguna & Hak Akses**: Antarmuka untuk menampilkan pengguna sudah ada dengan data statis. Manajemen peran dan integrasi dengan Firebase Auth belum diimplementasikan.

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
---
## 💡 Panduan Penggunaan Aplikasi

Berikut adalah panduan langkah demi langkah untuk menggunakan aplikasi ini dari awal.

### Tahap 1: Pengaturan Awal (Saat Pertama Kali)

Saat Anda pertama kali menjalankan aplikasi, Anda akan disambut oleh halaman *setup*.

1.  **Mulai Pengaturan**: Klik tombol **"Mulai Pengaturan & Impor Data"**. Tindakan ini akan secara otomatis:
    *   Mengimpor **Bagan Akun (COA)** standar yang sesuai dengan PSAK.
    *   Menambahkan beberapa **data contoh** untuk Pelanggan dan Pemasok.
    *   Mengatur **pemetaan akun otomatis** di menu Pengaturan Akuntansi.
    *   Mengarahkan Anda ke halaman Dashboard.

2.  **Tinjau Pengaturan**: Setelah masuk, luangkan waktu sejenak untuk memeriksa menu **Pengaturan**:
    *   Masuk ke **Pengaturan > Profil Perusahaan**, lalu isi nama, alamat, dan kontak usaha Anda.
    *   Masuk ke **Pengaturan > Akuntansi**. Periksa kembali apakah semua akun sudah terpetakan dengan benar. Anda bisa mengubahnya jika memiliki preferensi akun yang berbeda.

### Tahap 2: Melengkapi Data Master

Data master adalah jantung dari aplikasi ini. Pastikan data ini lengkap sebelum Anda mulai bertransaksi.

1.  **Produk & Stok**:
    *   Masuk ke **Produk & Stok > Daftar Produk**. Hapus produk contoh yang tidak relevan.
    *   Gunakan tombol **"Tambah Produk"** untuk memasukkan produk Anda satu per satu, atau gunakan fitur **"Impor Produk"** untuk mengunggah data secara massal dari file Excel.
    *   Masuk ke **Produk & Stok > Kategori Produk** untuk menyesuaikan kategori sesuai jenis produk Anda.

2.  **Master Data Lainnya**:
    *   Masuk ke **Master Data > Pelanggan** untuk menambah atau mengedit daftar pelanggan Anda.
    *   Masuk ke **Master Data > Pemasok** untuk menambah atau mengedit daftar pemasok Anda.

### Tahap 3: Transaksi Harian

Setelah data master siap, Anda bisa mulai mencatat aktivitas bisnis sehari-hari.

- **Untuk Penjualan Langsung/Tunai**:
  - Gunakan menu **Kasir (POS)**. Cukup klik produk untuk menambahkannya ke keranjang dan selesaikan transaksi dengan pembayaran tunai atau transfer.

- **Untuk Penjualan Kredit/Invoice**:
  - Masuk ke **Penjualan > Buat Invoice**. Pilih pelanggan, tambahkan produk, dan simpan. Transaksi ini akan otomatis tercatat sebagai piutang.

- **Untuk Mencatat Pembelian Barang**:
  - Ikuti alur lengkap di menu **Pembelian**:
    1.  **Permintaan Pembelian**: Buat permintaan internal (opsional).
    2.  **Pesanan Pembelian (PO)**: Buat pesanan resmi ke pemasok.
    3.  **Penerimaan Barang**: Saat barang tiba, catat penerimaannya di menu ini. Stok produk akan otomatis bertambah.
    4.  **Faktur Pemasok**: Saat tagihan dari pemasok tiba, catat di menu ini untuk mengakui utang usaha.

- **Untuk Mencatat Pengeluaran Operasional**:
  - Masuk ke **Kas & Bank > Kas Keluar**. Gunakan menu ini untuk mencatat biaya-biaya seperti bayar listrik, gaji, internet, dll.

### Tahap 4: Memantau dan Menganalisis Laporan

Setiap transaksi yang Anda catat akan secara otomatis memengaruhi laporan keuangan dan operasional.

- **Dashboard**: Halaman ini memberikan ringkasan cepat kondisi bisnis Anda secara *real-time*.
- **Laporan**: Gunakan menu **Laporan** untuk analisis lebih mendalam.
  - **Laporan Penjualan**: Untuk melihat produk terlaris dan tren penjualan.
  - **Laporan Stok**: Untuk melihat nilai valuasi persediaan Anda.
  - **Laporan Laba Rugi, Neraca, Arus Kas**: Tiga laporan keuangan utama yang menunjukkan performa dan posisi keuangan bisnis Anda.
- **Akuntansi**: Jika Anda ingin melacak jejak audit, gunakan menu **Akuntansi**.
  - **Jurnal Umum**: Menampilkan semua entri jurnal yang dibuat oleh sistem.
  - **Buku Besar**: Merinci semua transaksi yang terjadi pada satu akun spesifik.

Dengan mengikuti alur ini, Anda dapat memanfaatkan semua fitur aplikasi untuk mengelola operasional dan keuangan bisnis Anda secara efisien.
---
## 💡 Penjelasan Alur Integrasi Akuntansi

Setiap transaksi bisnis yang dicatat dalam aplikasi ini secara otomatis menghasilkan entri jurnal akuntansi di latar belakang. Ini memastikan bahwa laporan keuangan Anda (Laba Rugi, Neraca, Arus Kas) selalu sinkron dan *up-to-date*. Berikut adalah rincian alur kerjanya per modul.

### 1. **Modul Penjualan & Kasir (POS)**
Ini adalah sumber utama pendapatan dan memiliki dampak langsung ke banyak akun.

- **Saat Transaksi Penjualan Terjadi**:
  - **Aksi**: Menyelesaikan penjualan di kasir atau membuat invoice manual.
  - **Jurnal Otomatis**: Dua jurnal terpisah dibuat.
    1.  **Jurnal Pengakuan Pendapatan**:
        - **Debit**: `Kas`, `Bank`, atau `Piutang Usaha` (tergantung metode pembayaran).
        - **Kredit**: `Pendapatan Penjualan`.
    2.  **Jurnal Beban Pokok Penjualan (HPP)**:
        - **Debit**: `Beban Pokok Penjualan (HPP)`.
        - **Kredit**: `Persediaan Barang Dagang` (mengurangi nilai aset persediaan).
  - **Dampak**: Laporan Laba Rugi (Pendapatan & HPP) dan Neraca (Kas, Piutang, Persediaan) langsung diperbarui. Stok produk juga berkurang.

- **Saat Pelunasan Piutang**:
  - **Aksi**: Mencatat pembayaran dari pelanggan untuk invoice yang belum lunas.
  - **Jurnal Otomatis**:
    - **Debit**: `Kas` atau `Bank` (tempat dana diterima).
    - **Kredit**: `Piutang Usaha` (mengurangi tagihan).
  - **Dampak**: Hanya memengaruhi Neraca (mengubah aset piutang menjadi aset kas), tidak ada dampak ke Laba Rugi.

- **Saat Retur Penjualan**:
  - **Aksi**: Memproses pengembalian barang dari pelanggan.
  - **Jurnal Otomatis**: Sistem membuat **jurnal pembalik** untuk membatalkan efek akuntansi dari penjualan awal.
    - **Debit**: `Pendapatan Penjualan` (mengurangi pendapatan).
    - **Kredit**: `Kas` atau `Piutang Usaha` (mengembalikan uang atau mengurangi tagihan).
    - **Debit**: `Persediaan Barang Dagang` (barang kembali ke stok).
    - **Kredit**: `Beban Pokok Penjualan (HPP)` (mengurangi beban).
  - **Dampak**: Mengurangi angka Pendapatan dan HPP di Laba Rugi, serta menambah kembali nilai Persediaan di Neraca.

### 2. **Modul Pembelian**
Modul ini mencatat seluruh alur pengadaan barang dari pemasok.

- **Saat Penerimaan Barang (Goods Receipt)**:
  - **Aksi**: Mencatat barang dari pesanan pembelian (PO) yang telah tiba.
  - **Jurnal Otomatis**:
    - **Debit**: `Persediaan Barang Dagang` (nilai aset bertambah).
    - **Kredit**: `Utang Barang Diterima` (akun sementara untuk kewajiban barang yang sudah diterima tapi belum ditagih).
  - **Dampak**: Menambah nilai aset `Persediaan` di Neraca.

- **Saat Menerima Faktur Pemasok**:
  - **Aksi**: Mencatat tagihan (faktur) resmi dari pemasok.
  - **Jurnal Otomatis**: Memindahkan kewajiban dari akun sementara ke akun permanen.
    - **Debit**: `Utang Barang Diterima` (akun sementara dikosongkan).
    - **Kredit**: `Utang Usaha` (kewajiban resmi diakui).
  - **Dampak**: Memindahkan saldo antar akun kewajiban di Neraca.

- **Saat Pembayaran Utang**:
  - **Aksi**: Membayar tagihan ke pemasok.
  - **Jurnal Otomatis**:
    - **Debit**: `Utang Usaha` (mengurangi utang).
    - **Kredit**: `Kas` atau `Bank` (kas keluar).
  - **Dampak**: Mengurangi `Utang Usaha` (kewajiban) dan `Kas` (aset) di Neraca.

### 3. **Modul Kas & Bank**
Menu ini untuk mencatat pergerakan kas di luar siklus jual-beli normal.

- **Kas Masuk**: Untuk transaksi seperti setoran modal, pendapatan bunga, dll.
  - **Contoh Jurnal**: Debit `Kas/Bank`, Kredit `Modal` atau `Pendapatan Lainnya`.
- **Kas Keluar**: Untuk biaya operasional seperti bayar listrik, internet, atau pembelian aset kecil.
  - **Contoh Jurnal**: Debit `Beban Listrik` (atau akun beban terkait), Kredit `Kas/Bank`.
- **Transfer Antar Kas**: Memindahkan dana antar rekening internal.
  - **Jurnal**: Debit `Kas/Bank Tujuan`, Kredit `Kas/Bank Asal`.

### 4. **Modul Akuntansi**
Ini adalah pusat dari semua data akuntansi yang terkumpul secara otomatis dan manual.

- **Bagan Akun (COA)**: Fondasi dari sistem. Tempat Anda mendefinisikan semua "wadah" (akun) yang digunakan dalam penjurnalan. Pemetaan akun untuk otomatisasi diatur di **Pengaturan > Akuntansi**.
- **Jurnal Umum**: Agregator yang menampilkan **semua entri jurnal**, baik yang dibuat otomatis dari modul lain maupun yang Anda input manual (misal: jurnal penyesuaian penyusutan).
- **Buku Besar**: Detail dari setiap akun. Jika Anda ingin tahu semua transaksi yang memengaruhi `Kas Kecil` selama sebulan, di sinilah tempatnya.
- **Tutup Buku**: Proses akuntansi pada akhir periode (misal: akhir bulan) yang secara otomatis "mereset" semua akun pendapatan dan beban (akun temporer) ke nol, dan memindahkan selisihnya (Laba Bersih) ke akun `Laba Ditahan` di dalam Ekuitas.

Dengan alur ini, setiap tindakan operasional Anda secara otomatis tercermin dalam posisi keuangan perusahaan secara *real-time*.
