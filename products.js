/**
 * CHOCO STORE TIMIKA — Products Data Layer
 *
 * Struktur data ini kompatibel langsung dengan Cloud Firestore.
 * Setiap objek produk merepresentasikan satu dokumen di koleksi "products".
 *
 * Firestore path: /products/{productId}
 *
 * Ketika Firebase aktif, data ini digantikan oleh data live dari Firestore.
 * Ini berfungsi sebagai fallback data saat Firebase belum dikonfigurasi.
 */

const PRODUCTS_SCHEMA = {
  id:          String,    // Auto-generated oleh Firestore atau custom slug
  name:        String,    // Nama produk
  category:    String,    // 'dark' | 'milk' | 'white' | 'gift' | 'baking'
  description: String,    // Deskripsi singkat (maks 200 karakter)
  price:       Object,    // { amount: Number|null, unit: String, label: String }
  images:      Array,     // Array URL dari Firebase Storage
  available:   Boolean,   // true = tersedia | false = stok habis
  featured:    Boolean,   // Ditampilkan sebagai produk unggulan di atas
  tags:        Array,     // Label tambahan untuk filter/search
  order:       Number,    // Urutan tampil (ascending)
  createdAt:   Date,
  updatedAt:   Date,
};

/**
 * DATA PRODUK DEMO
 * Ganti dengan data nyata dari inventaris Anda.
 * Produk ini hanya contoh struktur — nama, harga, dan deskripsi
 * harus disesuaikan dengan stok aktual Anda.
 */
const DEMO_PRODUCTS = [
  {
    id:          'dark-premium-001',
    name:        'Dark Chocolate Premium',
    category:    'dark',
    description: 'Cokelat hitam premium dengan kandungan kakao tinggi. Cocok untuk konsumsi langsung maupun bahan baking profesional.',
    price:       { amount: null, unit: null, label: 'Hubungi untuk harga' },
    images:      [],       // Isi dengan URL foto produk nyata
    available:   true,
    featured:    true,
    tags:        ['premium', 'dark', 'baking'],
    order:       1,
    _gradient:   'radial-gradient(ellipse at 25% 28%,#C79552 0%,#9B5B35 18%,#3A211B 100%)', // Hanya untuk demo
  },
  {
    id:          'milk-selection-001',
    name:        'Milk Chocolate Selection',
    category:    'milk',
    description: 'Koleksi cokelat susu lembut dengan cita rasa manis sempurna, tersedia dalam berbagai pilihan merek dan ukuran.',
    price:       { amount: null, unit: null, label: 'Hubungi untuk harga' },
    images:      [],
    available:   true,
    featured:    false,
    tags:        ['milk', 'classic'],
    order:       2,
    _gradient:   'linear-gradient(135deg,#D2691E 0%,#A0522D 60%,#2B1712 100%)',
  },
  {
    id:          'white-delight-001',
    name:        'White Chocolate Delight',
    category:    'white',
    description: 'Cokelat putih premium dengan tekstur creamy dan aroma vanilla yang khas. Sempurna untuk kreasi kue dan dessert.',
    price:       { amount: null, unit: null, label: 'Hubungi untuk harga' },
    images:      [],
    available:   true,
    featured:    false,
    tags:        ['white', 'baking', 'dessert'],
    order:       3,
    _gradient:   'linear-gradient(135deg,#F7DFA3 0%,#C79552 55%,#8B6914 100%)',
  },
  {
    id:          'gift-box-001',
    name:        'Premium Gift Box',
    category:    'gift',
    description: 'Paket hadiah cokelat eksklusif dalam berbagai pilihan isi dan ukuran kemasan. Cocok untuk berbagai momen spesial.',
    price:       { amount: null, unit: null, label: 'Hubungi untuk harga' },
    images:      [],
    available:   true,
    featured:    false,
    tags:        ['gift', 'hampers', 'packaging'],
    order:       4,
    _gradient:   'linear-gradient(155deg,#2B1712 0%,#593629 45%,#C79552 80%,#2B1712 100%)',
  },
  {
    id:          'couverture-001',
    name:        'Cokelat Couverture',
    category:    'dark',
    description: 'Cokelat couverture berkualitas tinggi untuk kebutuhan pastry profesional, tersedia dalam format keping dan blok.',
    price:       { amount: null, unit: null, label: 'Hubungi untuk harga' },
    images:      [],
    available:   true,
    featured:    false,
    tags:        ['couverture', 'professional', 'baking'],
    order:       5,
    _gradient:   'linear-gradient(135deg,#2B1712 0%,#3A211B 55%,#593629 100%)',
  },
  {
    id:          'assorted-mix-001',
    name:        'Cokelat Assorted Mix',
    category:    'milk',
    description: 'Kumpulan cokelat beragam rasa dalam satu paket, ideal untuk dinikmati sendiri maupun sebagai oleh-oleh khas.',
    price:       { amount: null, unit: null, label: 'Hubungi untuk harga' },
    images:      [],
    available:   true,
    featured:    false,
    tags:        ['assorted', 'mix', 'gift'],
    order:       6,
    _gradient:   'radial-gradient(circle at 60% 60%,#C79552 0%,#593629 42%,#2B1712 100%)',
  },
];

/**
 * KATEGORI PRODUK
 * Gunakan ini untuk filter dan label di UI.
 */
const PRODUCT_CATEGORIES = [
  { id: 'all',   label: 'Semua' },
  { id: 'dark',  label: 'Dark Chocolate' },
  { id: 'milk',  label: 'Milk Chocolate' },
  { id: 'white', label: 'White Chocolate' },
  { id: 'gift',  label: 'Gift & Hampers' },
  { id: 'baking',label: 'Baking & Couverture' },
];

/**
 * DATA ADAPTER
 * Layer ini memungkinkan switch antara data demo dan Firestore
 * tanpa mengubah kode UI.
 */
const ProductsAdapter = {

  /**
   * Ambil semua produk (dari Firestore atau demo data)
   */
  async getAll() {
    if (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.firebase?.enabled) {
      return await this._fetchFromFirestore();
    }
    return Promise.resolve([...DEMO_PRODUCTS]);
  },

  /**
   * Filter produk berdasarkan kategori
   */
  async getByCategory(category) {
    const all = await this.getAll();
    if (category === 'all') return all;
    return all.filter(p => p.category === category);
  },

  /**
   * Ambil produk unggulan (featured)
   */
  async getFeatured() {
    const all = await this.getAll();
    return all.filter(p => p.featured && p.available);
  },

  /**
   * Fetch dari Firestore (aktif ketika Firebase dikonfigurasi)
   * @private
   */
  async _fetchFromFirestore() {
    // Aktifkan baris ini setelah Firebase SDK diinisialisasi:
    // const snapshot = await firebase.firestore()
    //   .collection('products')
    //   .where('available', '==', true)
    //   .orderBy('order', 'asc')
    //   .get();
    // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.warn('[ProductsAdapter] Firestore belum dikonfigurasi. Menggunakan demo data.');
    return [...DEMO_PRODUCTS];
  },

};

if (typeof module !== 'undefined') {
  module.exports = { DEMO_PRODUCTS, PRODUCT_CATEGORIES, ProductsAdapter };
}
