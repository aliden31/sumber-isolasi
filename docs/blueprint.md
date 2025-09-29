# **App Name**: Toko Kilat

## Core Features:

- Dashboard Utama: Menampilkan widget ringkasan penjualan harian, grafik penjualan mingguan, indikator stok produk menipis, dan ringkasan saldo kas terkini.
- Point of Sales (Kasir): Form pencarian dan pemilihan produk, keranjang belanja dengan kalkulasi total otomatis, pilihan metode pembayaran (tunai, transfer), tombol selesaikan transaksi, dan riwayat transaksi hari ini.
- Manajemen Produk: Daftar produk dengan nama, harga, dan jumlah stok. Form tambah produk baru dan form edit harga serta stok produk. Memungkinkan pencarian produk berdasarkan nama.
- Riwayat Transaksi: Menampilkan daftar semua transaksi penjualan, filter transaksi berdasarkan tanggal, detail transaksi individual, dan total penjualan per periode.
- Laporan Sederhana: Menyajikan laporan penjualan harian, laporan produk terlaris, ringkasan pendapatan bulanan, dan memungkinkan ekspor laporan ke format PDF.
- Estimasi Jumlah Stok: AI tool yang memberi saran dan membantu memprediksi kuantitas atau estimasi jumlah stok suatu produk. Tool ini akan mempertimbangkan berbagai faktor historis, tren penjualan, dan variabel lain yang mungkin berpengaruh.

## Unimplemented Features:

### Point of Sales (POS)
- Parkir Transaksi: Menyimpan keranjang belanja untuk dilanjutkan nanti.
- Retur Penjualan (Kasir): Memproses pengembalian barang melalui kasir.
- Cetak Ulang Struk: Mencari dan mencetak kembali struk transaksi lama.

### Penjualan
- Input Manual: Mencatat penjualan yang terjadi di luar kasir (misal: penjualan korporat).
- Impor Penjualan: Mengunggah data penjualan dari file CSV/Excel.
- Piutang Usaha: Melacak dan mengelola faktur penjualan yang belum dibayar.
- Retur Penjualan (Non-POS): Mengelola retur dari penjualan yang diinput secara manual.

### Pembelian
Seluruh alur kerja pembelian saat ini adalah placeholder, termasuk:
- Permintaan Pembelian (PR)
- Pesanan Pembelian (PO)
- Penerimaan Barang (GRN)
- Faktur Pemasok
- Retur Pembelian
- Utang Usaha

### Stok
- Kategori Produk: Mengelompokkan produk ke dalam kategori.
- Multi-Gudang: Manajemen stok di beberapa lokasi/gudang.
- Transfer Stok: Memindahkan stok antar gudang.
- Penyesuaian Stok (Stock Opname): Menyesuaikan stok fisik dengan data sistem.
- Notifikasi Stok: Mengatur peringatan untuk stok yang menipis.

### Kas & Bank
- Rekonsiliasi Bank: Mencocokkan transaksi di sistem dengan laporan koran bank.

### Akunting
- Tutup Buku: Proses finalisasi laporan keuangan di akhir periode.

### Laporan
Meskipun Laporan Laba Rugi sudah ada, laporan-laporan berikut masih berupa placeholder:
- Laporan Penjualan: Analisis detail penjualan, produk terlaris, dll.
- Laporan Pembelian: Analisis pembelian dan performa supplier.
- Laporan Stok: Laporan valuasi persediaan dan kartu stok.

### Pengaturan
- Pengguna & Hak Akses: Mengelola siapa yang bisa mengakses apa.
- Pajak: Mengelola jenis dan tarif pajak.
- Mata Uang: Mengelola kurs mata uang asing.

## Style Guidelines:

- Primary color: Warm, inviting orange (#FFA500) to evoke feelings of reliability and energy, without resorting to cliches.
- Background color: Very light orange (#FFF8E1) that ensures readability and a soft, pleasant interface.
- Accent color: Analogous yellow (#FFD700) that is used for highlighting interactive elements and calls to action, providing clear visual cues without overwhelming the user.
- Headline font: 'Belleza' sans-serif for impactful headlines, conveying a sense of style.
- Body font: 'Alegreya' serif provides comfortable reading experience.
- Flat style icons in orange to match primary color, simple and intuitive.
- Clean and organized layout with a focus on data clarity.
