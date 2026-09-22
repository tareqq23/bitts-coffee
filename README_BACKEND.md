# Panduan Integrasi Backend & Pengelolaan Menu BITTS Coffee

Dokumen ini dibuat khusus untuk membantu Anda mengelola atau menghubungkan katalog menu ke backend/database pilihan Anda di masa mendatang.

---

## 1. Opsi A: Pengelolaan Tanpa Backend (Cukup Edit File JSON)

Jika Anda belum sempat membuat backend dan hanya ingin memperbarui atau menambah daftar menu, Anda cukup mengedit file:
📁 [`data/menu.json`](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/bitts-coffee/data/menu.json)

Format data menu:
```json
{
  "id": "c7",
  "name": "Nama Menu Anda",
  "category": "coffee", // Pilihan: "coffee", "non-coffee", "food", "dessert"
  "categoryName": "Coffee",
  "price": 25000,
  "description": "Deskripsi singkat mengenai rasa dan komposisi.",
  "badge": "Best Seller", // Opsional: "Signature", "Best Seller", "New", atau kosongkan ""
  "image": "assets/images/menu-coffee.jpg", // path file atau URL gambar
  "tags": ["signature", "iced"],
  "isAvailable": true
}
```

Website akan secara otomatis membaca dan menampilkan data baru tanpa perlu mengubah file HTML atau CSS!

---

## 2. Opsi B: Menghubungkan ke REST API Backend Anda

Jika Anda membuat backend (misalnya menggunakan **Laravel, Node.js/Express, Go, Python/Django, Supabase, atau Firebase**):

### Langkah 1: Siapkan Endpoint API Anda
Pastikan API endpoint Anda (misalnya `GET /api/menu`) mengembalikan JSON array dengan struktur yang sama seperti contoh di atas. Contoh response API:
```json
[
  {
    "id": "1",
    "name": "BITTS Signature Palm Sugar Latte",
    "category": "coffee",
    "categoryName": "Coffee",
    "price": 22000,
    "description": "Espresso arabica-robusta khas BITTS dengan susu segar dan gula aren.",
    "badge": "Best Seller",
    "image": "https://api.domainanda.com/storage/latte.jpg",
    "isAvailable": true
  }
]
```

### Langkah 2: Aktifkan di `js/menuData.js`
Buka file 📁 [`js/menuData.js`](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/bitts-coffee/js/menuData.js):
```javascript
const CONFIG = {
  // Ubah menjadi true
  USE_REMOTE_API: true,
  
  // Masukkan URL endpoint backend Anda:
  API_ENDPOINT: 'https://api.domainanda.com/api/menu',
  
  // Nomor WhatsApp admin BITTS Coffee (tanpa tanda +):
  WHATSAPP_NUMBER: '6285179929290'
};
```

Selesai! Frontend akan otomatis melakukan `fetch()` ke endpoint database Anda, dan jika koneksi internet/server backend sedang down, website secara cerdas akan langsung menampilkan *fallback mock data* bawaan agar tampilan website tidak kosong.

---

## 3. Cara Mengubah Nomor WhatsApp Admin

Jika nomor WhatsApp admin BITTS Coffee berubah:
1. Buka 📁 [`js/menuData.js`](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/bitts-coffee/js/menuData.js).
2. Ubah baris:
   ```javascript
   WHATSAPP_NUMBER: '628xxxxxxxxxxx'
   ```
   *(Gunakan format 62 di depan tanpa tanda +, spasi, atau tanda strip).*
3. Semua tombol pemesanan WhatsApp otomatis akan terarah ke nomor baru tersebut lengkap dengan ringkasan pesanan dan catatan pelanggan.
