# ☕ BITTS Coffee — Web Application & Management CMS

<p align="left">
  <a href="https://bittscoffe.netlify.app/"><img src="https://img.shields.io/badge/Live%20Demo-bittscoffe.netlify.app-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Frontend-Vanilla%20HTML%20%2F%20CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="Vanilla Stack" />
  <img src="https://img.shields.io/badge/Security-Rate%20Limit%20%7C%20CSP-red?style=for-the-badge&logo=shield" alt="Security" />
</p>

> *"We Serve Bitter and Sweets"*  
> Platform web komersial modern yang menggabungkan landing page interaktif, katalog menu digital, integrasi pemesanan WhatsApp otomatis, dan dashboard Content Management System (CMS) mandiri untuk kedai kopi **BITTS Coffee** (Pandeglang, Banten).

🔗 **Live Website Demo:** [https://bittscoffe.netlify.app/](https://bittscoffe.netlify.app/)

---

## 📌 Ringkasan Proyek

**BITTS Coffee** dikembangkan sebagai solusi digital menyeluruh (*end-to-end*) untuk kedai kopi modern. Proyek ini dibangun dengan fokus pada **kecepatan muat tinggi (high performance), estetika visual yang kuat (warm monochrome coffee design), dan kemudahan pengelolaan data operasional**.

### Kenapa Proyek Ini Dibangun?
1. **Pengalaman Pelanggan yang Mulus**: Pelanggan dapat mencari menu, melihat status ketersediaan (*Ready* / *Sold Out*), dan membuat pesanan langsung terformat rapi ke WhatsApp kasir/barista tanpa perlu login atau menginstal aplikasi pihak ketiga.
2. **Kemandirian Pengelola Toko**: Pemilik usaha dapat memperbarui harga, menambah menu baru, menandai menu habis, serta mengedit jam operasional melalui Dashboard Admin CMS tanpa harus menyentuh kode program.
3. **Arsitektur Efisien & Aman**: Dibangun dengan *Vanilla Stack* berkinerja tinggi tanpa *dependency overhead*, dilengkapi backend engine berbasis Node.js yang menerapkan standar keamanan web modern.

---

## 🌟 Fitur Utama

### 1. Sisi Pengunjung / Pelanggan (Public Facing)
* **Katalog Menu Dinamis**: Filter instan berdasarkan kategori (*Coffee, Non-Coffee, Pastry, Snack & Camilan*), pencarian teks waktu-nyata (*real-time search*), dan label produk (*Signature, Best Seller, New*).
* **Indikator Stok Real-Time**: Status menu otomatis menampilkan tag *Ready* atau *Sold Out* sesuai data toko terkini.
* **Direct WhatsApp Order Generator**: Keranjang belanja interaktif yang secara otomatis mengalkulasi total belanja dan menyusun format teks pesanan yang rapi saat diteruskan ke WhatsApp.
* **Bento Grid Sanctuary & Story**: Informasi fasilitas kedai (*High-Speed Wi-Fi, Stopkontak, Musholla*), filosofi rasa *Bitter & Sweet*, serta jam buka toko yang dinamis.
* **Integrasi Google Maps**: Peta interaktif untuk memudahkan pengunjung menemukan lokasi kedai di Pandeglang.
* **Desain Responsif & Estetis**: Layout adaptif untuk smartphone, tablet, dan monitor desktop dengan micro-animations yang halus.

### 2. Sisi Pengelola / Admin CMS (Dijalankan di Server Lokal)
* **Manajemen Menu Lengkap (CRUD)**:
  * Tambah menu baru dengan kategori kustom (*misal: Kopi Literan, Seasonal Treat*).
  * Edit informasi menu, harga, badge, komposisi/deskripsi, dan foto menu.
  * *One-click toggle* ketersediaan stok (*In Stock* ⇋ *Sold Out*).
  * Hapus menu dengan konfirmasi protektif.
* **Editor Konten Toko (CMS Studio)**: Ubah jam operasional, link Google Maps, teks promosi, dan nomor kontak langsung dari antarmuka web.
* **Statistik Cepat**: Pemantauan jumlah total menu, menu aktif, menu habis, dan jumlah kategori secara instan.
* **Backup & Restore Terintegrasi**: Fasilitas ekspor dan pemulihan data berbasis file JSON untuk menjamin keamanan data toko.

### 3. Aspek Keamanan & Rekayasa Perangkat Lunak
* **Environment Variables (`.env`)**: Kredensial rahasia dipisahkan dari repositori menggunakan file `.env` yang dilindungi oleh `.gitignore`.
* **Proteksi Brute-Force & Rate Limiting**: Batasan frekuensi percobaan login per IP address dengan mekanisme *lockout* otomatis 15 menit jika terdeteksi percobaan ilegal berulang.
* **HTTP Security Headers**: Implementasi `Content-Security-Policy`, `X-Frame-Options` (anti-clickjacking), `X-Content-Type-Options` (anti-MIME sniffing), dan `Referrer-Policy`.
* **Sanitasi Input XSS**: Pembersihan tag HTML dan skrip berbahaya pada seluruh *payload* masukan admin.
* **Zero Dependency Core**: Backend server ditulis murni menggunakan modul standar Node.js (`http`, `fs`, `path`, `url`) untuk efisiensi memori dan kemudahan deployment tanpa resiko kerentanan package eksternal.

---

## 🛠️ Tech Stack & Arsitektur

| Bagian | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend** | HTML5 Semantik, Vanilla CSS3, JavaScript (ES6 Modules) | Performa 100% cepat tanpa bundle bloat, CSS Custom Properties & Bento Grid |
| **Backend** | Node.js (Standard HTTP Engine) | RESTful API Server mandiri di `serve.js`, Clean URL routing (`/`, `/admin`, `/login`) |
| **Penyimpanan Data** | JSON Flat-File Architecture | Struktur data terstruktur pada direktori `data/` (kompatibel migrasi ke Supabase/PostgreSQL) |
| **Layanan Eksternal** | WhatsApp Click-to-Chat API & Google Maps Embed | Integrasi komunikasi langsung dan navigasi pelanggan |

---

## 🚀 Panduan Menjalankan di Server Lokal (Local Setup)

Bagi penguji (*recruiter* / *developer*) yang ingin mencoba seluruh fungsi aplikasi termasuk **Dashboard Admin CMS**, ikuti langkah mudah berikut:

### 1. Prasyarat Sistem
* Terinstal **[Node.js](https://nodejs.org/)** (v16.0.0 atau lebih baru).
* Git (opsional).

### 2. Clone Repositori
```bash
git clone https://github.com/username-anda/bitts-coffee.git
cd bitts-coffee
```

### 3. Konfigurasi Environment (`.env`)
Salin file template `.env.example` menjadi `.env`:

* **Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```
* **macOS / Linux**:
  ```bash
  cp .env.example .env
  ```

*(File `.env` sudah terisi dengan kredensial default untuk keperluan testing lokal).*

### 4. Jalankan Server
Jalankan perintah berikut di terminal:
```bash
node serve.js
```
> **Pengguna Windows:** Anda juga dapat langsung mengklik dua kali file `start-server.bat`.

Output terminal yang menandakan server siap:
```text
[CONFIG] File .env berhasil dimuat.
[BITTS Coffee Engine] Server & CMS REST API aktif di http://localhost:3000
```

### 5. Akses Melalui Browser

* ☕ **Halaman Utama (Pelanggan)**:  
  Buka [http://localhost:3000](http://localhost:3000)

* 🔐 **Dashboard Admin CMS**:  
  Buka [http://localhost:3000/admin](http://localhost:3000/admin)  
  *(Gunakan kredensial pengujian lokal berikut untuk masuk):*
  * **Username**: `adminbitts`
  * **Password**: `bittscoffe2026`

---

## 📁 Struktur Direktori Proyek

```text
bitts-coffee/
├── .env.example          # Template konfigurasi variabel lingkungan
├── .gitignore            # Daftar proteksi file rahasia agar tidak terunggah ke Git
├── README.md             # Dokumentasi utama proyek
├── README_BACKEND.md     # Panduan teknis opsi integrasi API database eksternal
├── serve.js              # Engine server REST API & static server (Node.js murni)
├── start-server.bat      # Shortcut eksekusi server lokal (Windows)
│
├── index.html            # Halaman landing page & katalog digital pelanggan
├── admin.html            # Antarmuka Dashboard Admin & Studio CMS
├── admin-login.html      # Halaman otentikasi masuk pengelola
│
├── assets/               # Berkas visual & media
│   ├── images/           # Asset gambar bawaan tema kedai
│   └── uploads/          # Direktori penampung foto unggahan produk (.gitkeep)
│
├── css/
│   ├── style.css         # Styling halaman publik (desain modern bento & warm coffee)
│   ├── admin.css         # Styling antarmuka dashboard manajemen
│   └── login.css         # Styling halaman otentikasi login
│
├── js/
│   ├── app.js            # Logika katalog, keranjang WhatsApp, filter, modal
│   ├── admin.js          # Operasi CRUD menu, form CMS, metrik real-time
│   ├── auth.js           # Manajemen sesi token admin dan validasi otentikasi
│   └── menuData.js       # Konfigurasi fallback data & nomor WhatsApp
│
└── data/
    ├── menu.json         # Data katalog menu kedai
    ├── cms.json          # Data profil, jam buka, dan teks toko
    └── sessions.json     # Penyimpanan token sesi login admin
```

---

## 📡 Rangkuman REST API Endpoint

Aplikasi dilengkapi dengan API internal yang melayani pertukaran data secara asinkron:

| Method | Endpoint | Fungsi | Hak Akses |
| :---: | :--- | :--- | :---: |
| `POST` | `/api/login` | Otentikasi admin & pembuatan token sesi | Publik |
| `POST` | `/api/logout` | Menghapus token sesi aktif | Publik |
| `GET` | `/api/auth/check` | Memvalidasi status keaktifan sesi | Publik |
| `GET` | `/api/menu` | Mengambil seluruh daftar katalog menu | Publik |
| `POST` | `/api/menu` | Menambahkan item menu baru ke katalog | 🔒 Admin |
| `PUT` | `/api/menu/:id` | Memperbarui rincian data menu | 🔒 Admin |
| `PATCH` | `/api/menu/:id/availability` | Mengubah status stok (*In Stock* / *Sold Out*) | 🔒 Admin |
| `DELETE`| `/api/menu/:id` | Menghapus item menu dari katalog | 🔒 Admin |
| `GET` | `/api/cms` | Mengambil data pengaturan & konten toko | Publik |
| `PUT` | `/api/cms` | Memperbarui informasi profil & jam operasional | 🔒 Admin |
| `POST` | `/api/upload` | Mengunggah gambar produk (Base64) ke server | 🔒 Admin |
| `GET` | `/api/backup` | Mengekspor seluruh data cadangan toko (JSON) | Publik |
| `POST` | `/api/restore` | Memulihkan data cadangan ke sistem | 🔒 Admin |

---

## 📍 Informasi Bisnis & Lokasi

* **Kedai**: BITTS Coffee
* **Slogan**: *"We Serve Bitter and Sweets"*
* **Lokasi**: Jl. Ciwasiat No.21, Kec. Pandeglang, Kabupaten Pandeglang, Banten 42211
* **Instagram**: [@bittscoffee](https://instagram.com/bittscoffee)
* **WhatsApp**: [+62 895-3492-13579](https://wa.me/62895349213579)

---

## 📄 Lisensi & Hak Cipta

Hak Cipta © 2025–2026 **BITTS Coffee**. Semua hak dilindungi undang-undang.  
Didesain dan dikembangkan sebagai portfolio solusi komersial digital modern.