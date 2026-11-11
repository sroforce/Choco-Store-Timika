Choco Store Timika — Website Premium
Website toko dan gudang cokelat premium untuk Choco Store Timika, berlokasi di Timika, Papua, Indonesia. Dibangun dengan HTML, CSS, dan JavaScript murni — siap untuk integrasi Firebase CMS.
Struktur Proyek
choco-store-timika/
├── index.html              ← Website utama (one-page)
├── robots.txt              ← SEO: izin crawler
├── sitemap.xml             ← SEO: peta halaman
│
├── js/
│   ├── config.js           ← Konfigurasi terpusat (kontak, brand, SEO)
│   └── products.js         ← Data produk + Firebase adapter
│
├── admin/
│   └── index.html          ← Dashboard admin CMS
│
├── firebase/
│   ├── firebase-config.js  ← Konfigurasi Firebase SDK
│   └── firestore.rules     ← Aturan keamanan Firestore
│
├── storage.rules           ← Aturan keamanan Firebase Storage
└── assets/
    ├── images/             ← Foto produk, logo, galeri
    └── icons/              ← Ikon SVG custom
