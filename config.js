/**
 * CHOCO STORE TIMIKA — Central Configuration
 * Edit file ini untuk mengubah konten website tanpa menyentuh HTML.
 * Semua nilai akan otomatis terhubung ke Firebase CMS ketika sudah dikonfigurasi.
 */

const SITE_CONFIG = {

  // ─── BRAND ────────────────────────────────────────────────────────────
  brand: {
    name:        'Choco Store Timika',
    shortName:   'ChocoStore',
    tagline:     'Your Premium Chocolate Destination',
    description: 'Toko dan gudang cokelat premium di Timika, Papua. Melayani kebutuhan eceran dan grosir untuk individu maupun pelaku bisnis.',
    year:        2025,
    logo:        null,          // null = teks logo | URL string = gambar logo
    favicon:     '🍫',
  },

  // ─── KONTAK ───────────────────────────────────────────────────────────
  contact: {
    whatsapp:   '',             // Format: '6281234567890' (tanpa + atau spasi)
    email:      '',             // contoh: 'hello@chocostoretimika.com'
    address:    '',             // Alamat lengkap toko
    mapsEmbed:  '',             // URL Google Maps Embed (bukan link biasa)
    mapsLink:   '',             // Link Google Maps untuk dibuka di browser
    instagram:  '',             // username saja, tanpa @
    facebook:   '',             // username atau URL page
  },

  // ─── JAM OPERASIONAL ──────────────────────────────────────────────────
  hours: {
    weekday:  '',               // contoh: 'Senin–Jumat: 08.00–20.00'
    weekend:  '',               // contoh: 'Sabtu–Minggu: 09.00–18.00'
    holiday:  '',               // opsional: 'Libur nasional: Tutup'
    note:     '',               // catatan tambahan, misal: 'Pesan via WA kapan saja'
  },

  // ─── DESAIN / TEMA ────────────────────────────────────────────────────
  theme: {
    colors: {
      primary:    '#2B1712',    // Deep Cocoa
      secondary:  '#3A211B',    // Dark Chocolate
      accent:     '#C79552',    // Caramel Gold
      cream:      '#F7F1E8',    // Warm Cream
    },
    fonts: {
      display: 'Playfair Display',
      body:    'Plus Jakarta Sans',
    },
  },

  // ─── SEO ──────────────────────────────────────────────────────────────
  seo: {
    title:       'Choco Store Timika — Toko & Gudang Cokelat Premium',
    description: 'Choco Store Timika menyediakan berbagai pilihan cokelat premium untuk kebutuhan eceran maupun grosir di Timika, Papua, Indonesia.',
    keywords:    'toko cokelat Timika, gudang cokelat Timika, cokelat grosir Timika, toko cokelat Papua, wholesale cokelat Papua',
    canonical:   '',            // URL canonical website, contoh: 'https://chocostoretimika.com'
    ogImage:     '',            // URL gambar Open Graph (1200x630px)
    locale:      'id_ID',
  },

  // ─── HERO SECTION ─────────────────────────────────────────────────────
  hero: {
    eyebrow:  'Premium Chocolate Store & Wholesale',
    headline: 'Discover Your Chocolate Experience.',
    subtext:  'Temukan berbagai pilihan cokelat premium untuk kebutuhan pribadi, bisnis, maupun pembelian dalam jumlah besar bersama Choco Store Timika.',
    ctaPrimary:   { label: 'Jelajahi Produk', href: '#products' },
    ctaSecondary: { label: 'Hubungi Kami',    href: '#contact'  },
  },

  // ─── ABOUT SECTION ────────────────────────────────────────────────────
  about: {
    headline:   'Mitra Cokelat Premium Anda di Timika',
    paragraphs: [
      'Choco Store Timika hadir sebagai toko dan gudang cokelat yang menyediakan beragam pilihan produk cokelat berkualitas untuk masyarakat Timika dan sekitarnya, Papua.',
      'Kami melayani pembelian eceran untuk konsumsi pribadi hingga pembelian grosir bagi pelaku usaha, reseller, dan korporat — dengan berbagai merek pilihan yang dapat disesuaikan dengan kebutuhan Anda.',
    ],
    storeImage: null,           // URL foto toko/gudang dari Firebase Storage
  },

  // ─── WHATSAPP PESAN OTOMATIS ──────────────────────────────────────────
  messages: {
    default:   (brand) => `Halo ${brand}, saya ingin menanyakan tentang produk cokelat Anda.`,
    product:   (brand, name) => `Halo ${brand}, saya ingin menanyakan tentang produk: *${name}*. Mohon informasikan ketersediaan dan harganya. Terima kasih.`,
    wholesale: (brand) => `Halo ${brand}, saya tertarik dengan layanan pembelian *grosir*. Mohon informasikan syarat dan ketentuan pembelian grosir. Terima kasih.`,
    retail:    (brand) => `Halo ${brand}, saya ingin berbelanja cokelat. Boleh minta informasi produk yang tersedia sekarang? Terima kasih.`,
  },

  // ─── FIREBASE ─────────────────────────────────────────────────────────
  firebase: {
    enabled: false,             // Set true setelah Firebase dikonfigurasi
    // Isi dengan konfigurasi dari Firebase Console:
    apiKey:            '',
    authDomain:        '',
    projectId:         '',
    storageBucket:     '',
    messagingSenderId: '',
    appId:             '',
  },

};

// Export untuk digunakan di file lain
if (typeof module !== 'undefined') module.exports = SITE_CONFIG;
