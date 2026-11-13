/**
 * CHOCO STORE TIMIKA — Admin Firestore Module
 * Menangani: Firebase Auth, Settings CRUD, Products CRUD, Content, Gallery
 * Import path dari admin-index.html (root level) → firebase-config.js di root
 */

import { auth, db } from '../firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════
const ADMIN_UID = 'eHVsfeGtEaXpGy1ARzW79uLmHJt1';

const PANEL_TITLE = {
  dashboard: 'Dashboard', products: 'Manajemen Produk',
  'add-product': 'Tambah Produk', gallery: 'Galeri',
  content: 'Konten', config: 'Pengaturan',
};

const CAT_LABEL = {
  dark: 'Dark Chocolate', milk: 'Milk Chocolate',
  white: 'White Chocolate', gift: 'Gift & Hampers', baking: 'Baking & Couverture',
};

// ═══════════════════════════════════════════════════════
//  DOM UTILITIES
// ═══════════════════════════════════════════════════════
const $ = id => document.getElementById(id);
const gv = id => ($( id)?.value || '').trim();
const sv = (id, v) => { const e = $(id); if (e) e.value = v ?? ''; };
const gc = id => $(id)?.checked ?? false;
const sc = (id, v) => { const e = $(id); if (e) e.checked = !!v; };

function nOk(id, msg)  { _notice(id, 'firebase-notice',      `✅ ${msg}`); }
function nWarn(id, msg){ _notice(id, 'firebase-notice-warn', `⚠ ${msg}`); }
function nLoad(id)     { _notice(id, 'firebase-notice-warn', '⏳ Memuat data dari Firestore...'); }
function _notice(id, cls, html) {
  const e = $(id);
  if (e) { e.className = cls; e.innerHTML = `<strong>${html}</strong>`; }
}

/** Wrapper tombol simpan: loading → success/error → reset */
async function withBtn(btnId, label, fn) {
  const b = $(btnId);
  if (b) { b.disabled = true; b.textContent = 'Menyimpan...'; }
  try {
    await fn();
    if (b) { b.textContent = '✓ Tersimpan'; b.style.cssText = 'background:#4CAF50;color:#fff'; }
    setTimeout(() => { if (b) { b.disabled = false; b.textContent = label; b.style.cssText = ''; } }, 2500);
    return true;
  } catch (e) {
    if (b) { b.textContent = '✗ Gagal'; b.style.cssText = 'background:#E05B5B;color:#fff'; }
    setTimeout(() => { if (b) { b.disabled = false; b.textContent = label; b.style.cssText = ''; } }, 3000);
    console.error('[Firestore]', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════
//  FIREBASE AUTHENTICATION
// ═══════════════════════════════════════════════════════
const $ls  = $('loginScreen');
const $ac  = $('authCheck');
const $lf  = $('loginForm');
const $lb  = $('loginBtn');
const $le  = $('loginEmail');
const $lp  = $('loginPassword');
const $err = $('loginErr');

// Timeout fallback untuk koneksi lambat / gagal
const authTmo = setTimeout(() => {
  $ac.style.display = 'none';
  $lf.style.display = 'block';
  _showErr('Koneksi bermasalah. Periksa koneksi internet, lalu muat ulang halaman.');
}, 8000);

// Pemantau status auth — dijalankan setiap halaman dibuka
onAuthStateChanged(auth, async user => {
  clearTimeout(authTmo);
  $ac.style.display = 'none';
  if (user && user.uid === ADMIN_UID) {
    $ls.style.display = 'none';
    $lf.style.display = 'block';
    _resetAuth();
  } else if (user) {
    // Login berhasil tapi bukan admin — langsung paksa logout
    await signOut(auth);
    $lf.style.display = 'block';
    _showErr('Akses ditolak. Akun ini bukan administrator.');
  } else {
    $lf.style.display = 'block';
    $ls.style.display = 'flex';
  }
});

async function doLogin() {
  const email = $le.value.trim(), pass = $lp.value;
  if (!email || !pass) { _showErr('Isi email dan password terlebih dahulu.'); return; }
  _setAuthLoad(true); _hideErr();
  try {
    const r = await signInWithEmailAndPassword(auth, email, pass);
    if (r.user.uid !== ADMIN_UID) {
      await signOut(auth);
      _setAuthLoad(false);
      _showErr('Akses ditolak. Akun ini bukan administrator.');
    }
    // Jika UID cocok, onAuthStateChanged() menangani transisi ke dashboard
  } catch (e) {
    _setAuthLoad(false);
    _showErr(_ferr(e.code));
  }
}

async function doLogout() {
  try {
    await signOut(auth);
    $le.value = ''; $lp.value = ''; _hideErr();
  } catch (e) { window.location.reload(); }
}

function _ferr(c) {
  return ({
    'auth/invalid-email':          'Format email tidak valid.',
    'auth/user-not-found':         'Email atau password salah.',
    'auth/wrong-password':         'Email atau password salah.',
    'auth/invalid-credential':     'Email atau password salah.',
    'auth/too-many-requests':      'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
    'auth/network-request-failed': 'Koneksi bermasalah. Periksa koneksi internet Anda.',
    'auth/user-disabled':          'Akun ini telah dinonaktifkan.',
  })[c] || 'Terjadi kesalahan. Silakan coba lagi.';
}
function _showErr(m) { $err.textContent = m; $err.style.display = 'block'; }
function _hideErr()  { $err.style.display = 'none'; $err.textContent = ''; }
function _setAuthLoad(v) {
  [$lb, $le, $lp].forEach(e => { e.disabled = v; });
  $lb.textContent = v ? 'Memverifikasi...' : 'Masuk ke Dashboard';
}
function _resetAuth() { _setAuthLoad(false); _hideErr(); }

// ═══════════════════════════════════════════════════════
//  PANEL NAVIGATION
// ═══════════════════════════════════════════════════════
const PANEL_LOADERS = {
  config:  loadSettings,
  products: loadProducts,
  content:  loadContent,
  gallery:  loadGallery,
};

function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.sb-menu a').forEach(a => a.classList.remove('on'));
  const panel = $('panel-' + id);
  if (panel) { panel.classList.add('on'); $('adminTitle').textContent = PANEL_TITLE[id] || id; }
  const lnk = [...document.querySelectorAll('.sb-menu a')]
    .find(a => a.getAttribute('onclick') === `showPanel('${id}')`);
  if (lnk) lnk.classList.add('on');
  // Auto-muat data Firestore saat panel dibuka
  if (PANEL_LOADERS[id]) PANEL_LOADERS[id]();
}

// ═══════════════════════════════════════════════════════
//  SETTINGS — LOAD
// ═══════════════════════════════════════════════════════
async function loadSettings() {
  nLoad('noticeConfig');
  try {
    const [ct, hr, br, se] = await Promise.all([
      getDoc(doc(db, 'config', 'contact')),
      getDoc(doc(db, 'config', 'hours')),
      getDoc(doc(db, 'config', 'brand')),
      getDoc(doc(db, 'config', 'seo')),
    ]);
    if (ct.exists()) {
      const d = ct.data();
      sv('cfgWa', d.whatsapp); sv('cfgEmail', d.email);
      sv('cfgAddress', d.address); sv('cfgMaps', d.mapsEmbed); sv('cfgIg', d.instagram);
    }
    if (hr.exists()) {
      const d = hr.data();
      sv('cfgHrWd', d.weekday); sv('cfgHrWe', d.weekend); sv('cfgHrNote', d.note);
    }
    if (br.exists()) {
      const d = br.data();
      sv('cfgBrandName', d.name); sv('cfgBrandTagline', d.tagline); sv('cfgBrandDesc', d.description);
    }
    if (se.exists()) {
      const d = se.data();
      sv('cfgSeoTitle', d.title); sv('cfgSeoDesc', d.description);
      sv('cfgSeoKeys', d.keywords); sv('cfgSeoCanon', d.canonical);
    }
    nOk('noticeConfig', 'Data berhasil dimuat dari Firestore.');
  } catch (e) {
    nWarn('noticeConfig', 'Gagal memuat pengaturan: ' + e.message);
  }
}

// ═══════════════════════════════════════════════════════
//  SETTINGS — SAVE (per seksi)
// ═══════════════════════════════════════════════════════
function saveContact() {
  withBtn('btnSvCt', 'Simpan Kontak', () =>
    setDoc(doc(db, 'config', 'contact'), {
      whatsapp: gv('cfgWa'), email: gv('cfgEmail'),
      address: gv('cfgAddress'), mapsEmbed: gv('cfgMaps'),
      instagram: gv('cfgIg'), updatedAt: serverTimestamp(),
    }, { merge: true })
  );
}

function saveHours() {
  withBtn('btnSvHr', 'Simpan Jam', () =>
    setDoc(doc(db, 'config', 'hours'), {
      weekday: gv('cfgHrWd'), weekend: gv('cfgHrWe'),
      note: gv('cfgHrNote'), updatedAt: serverTimestamp(),
    }, { merge: true })
  );
}

function saveBrand() {
  withBtn('btnSvBr', 'Simpan Brand', () =>
    setDoc(doc(db, 'config', 'brand'), {
      name: gv('cfgBrandName'), tagline: gv('cfgBrandTagline'),
      description: gv('cfgBrandDesc'), updatedAt: serverTimestamp(),
    }, { merge: true })
  );
}

function saveSeo() {
  withBtn('btnSvSe', 'Simpan SEO', () =>
    setDoc(doc(db, 'config', 'seo'), {
      title: gv('cfgSeoTitle'), description: gv('cfgSeoDesc'),
      keywords: gv('cfgSeoKeys'), canonical: gv('cfgSeoCanon'),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  );
}

// ═══════════════════════════════════════════════════════
//  PRODUCTS — READ
// ═══════════════════════════════════════════════════════
async function loadProducts() {
  const tb = $('productsTbody');
  if (!tb) return;
  tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:1.5rem">Memuat data produk...</td></tr>';
  try {
    const sn = await getDocs(query(collection(db, 'products'), orderBy('order')));
    if (sn.empty) {
      tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:2rem">Belum ada produk. Klik &ldquo;+ Tambah Produk&rdquo; untuk memulai.</td></tr>';
      nOk('noticeProducts', 'Terhubung ke Firestore. Produk kosong.');
      return;
    }
    tb.innerHTML = sn.docs.map(d => {
      const p = d.data();
      const nm = (p.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      return `<tr>
        <td>${p.name || '—'}</td>
        <td><span class="badge badge-cat">${CAT_LABEL[p.category] || p.category}</span></td>
        <td><span class="badge ${p.available !== false ? 'badge-ok' : 'badge-err'}">${p.available !== false ? 'Tersedia' : 'Stok Habis'}</span></td>
        <td>${p.featured ? '✓' : '—'}</td>
        <td>
          <button class="action-btn btn-edit" onclick="editProduct('${d.id}')">Edit</button>
          <button class="action-btn btn-del" onclick="confirmDelete('${d.id}','${nm}')">Hapus</button>
        </td>
      </tr>`;
    }).join('');
    nOk('noticeProducts', `${sn.docs.length} produk dimuat dari Firestore.`);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="5" style="color:#E05B5B;padding:1.5rem;text-align:center">Gagal memuat: ${e.message}</td></tr>`;
    nWarn('noticeProducts', 'Gagal memuat produk: ' + e.message);
  }
}

// ═══════════════════════════════════════════════════════
//  PRODUCTS — CREATE / UPDATE
// ═══════════════════════════════════════════════════════
async function saveProduct() {
  const editId = gv('pEditId');
  const name   = gv('pName');
  const $pErr  = $('pFormErr');

  if (!name) {
    if ($pErr) { $pErr.textContent = 'Nama produk wajib diisi.'; $pErr.style.display = 'block'; }
    return;
  }
  if ($pErr) $pErr.style.display = 'none';

  const priceAmt = $('pPrice')?.value ? Number($('pPrice').value) : null;
  const data = {
    name,
    category:    gv('pCategory')  || 'dark',
    description: gv('pDesc'),
    price: {
      amount: priceAmt,
      unit:   gv('pUnit')  || null,
      label:  priceAmt ? 'Rp ' + priceAmt.toLocaleString('id-ID') : 'Hubungi untuk harga',
    },
    available: gv('pStatus') === 'true',
    featured:  gc('pFeatured'),
    order:     $('pOrder')?.value ? Number($('pOrder').value) : 99,
    imageUrl:  gv('pImageUrl') || null,
    updatedAt: serverTimestamp(),
  };

  const label = editId ? 'Update Produk' : 'Simpan Produk';
  const ok = await withBtn('saveProductBtn', label, async () => {
    if (editId) {
      await updateDoc(doc(db, 'products', editId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'products'), data);
    }
  });

  if (ok) {
    clearProductForm();
    showPanel('products');
  }
}

// ═══════════════════════════════════════════════════════
//  PRODUCTS — EDIT (pre-fill form)
// ═══════════════════════════════════════════════════════
async function editProduct(id) {
  try {
    const sn = await getDoc(doc(db, 'products', id));
    if (!sn.exists()) { alert('Produk tidak ditemukan di database.'); return; }
    const p = sn.data();
    sv('pEditId', id); sv('pName', p.name); sv('pCategory', p.category);
    sv('pStatus', String(p.available !== false)); sv('pDesc', p.description);
    sv('pPrice', p.price?.amount || ''); sv('pUnit', p.price?.unit || '');
    sv('pOrder', p.order ?? ''); sv('pImageUrl', p.imageUrl || '');
    sc('pFeatured', p.featured);
    // Update judul panel
    const t = document.querySelector('#panel-add-product .panel-title');
    if (t) t.textContent = 'Edit Produk';
    showPanel('add-product');
  } catch (e) {
    alert('Gagal memuat produk: ' + e.message);
  }
}

// ═══════════════════════════════════════════════════════
//  PRODUCTS — DELETE
// ═══════════════════════════════════════════════════════
async function confirmDelete(id, name) {
  if (!confirm(`Hapus produk "${name}"?\n\nTindakan ini tidak dapat dibatalkan.`)) return;
  try {
    await deleteDoc(doc(db, 'products', id));
    loadProducts();
  } catch (e) {
    alert('Gagal menghapus produk: ' + e.message);
  }
}

function clearProductForm() {
  ['pEditId', 'pName', 'pDesc', 'pPrice', 'pUnit', 'pOrder', 'pImageUrl']
    .forEach(id => sv(id, ''));
  sv('pCategory', 'dark'); sv('pStatus', 'true'); sc('pFeatured', false);
  const t = document.querySelector('#panel-add-product .panel-title');
  if (t) t.textContent = 'Tambah Produk Baru';
  const e = $('pFormErr'); if (e) e.style.display = 'none';
}

// ═══════════════════════════════════════════════════════
//  CONTENT — LOAD / SAVE
// ═══════════════════════════════════════════════════════
async function loadContent() {
  nLoad('noticeContent');
  try {
    const sn = await getDoc(doc(db, 'content', 'hero'));
    if (sn.exists()) {
      const h = sn.data();
      sv('ctHeroHL', h.headline); sv('ctHeroDesc', h.subtext);
    }
    nOk('noticeContent', 'Konten berhasil dimuat dari Firestore.');
  } catch (e) {
    nWarn('noticeContent', 'Gagal memuat konten: ' + e.message);
  }
}

function saveContent() {
  withBtn('saveContentBtn', 'Simpan Perubahan', () =>
    setDoc(doc(db, 'content', 'hero'), {
      headline: gv('ctHeroHL'), subtext: gv('ctHeroDesc'),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  );
}

// ═══════════════════════════════════════════════════════
//  GALLERY — LOAD / ADD / DELETE (URL-based, no Storage)
// ═══════════════════════════════════════════════════════
async function loadGallery() {
  nLoad('noticeGallery');
  const tb = $('galleryTbody');
  if (!tb) return;
  tb.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:1.5rem">Memuat galeri...</td></tr>';
  try {
    const sn = await getDocs(query(collection(db, 'gallery'), orderBy('order')));
    if (sn.empty) {
      tb.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:2rem">Belum ada item galeri. Klik &ldquo;+ Tambah URL Foto&rdquo; untuk memulai.</td></tr>';
      nOk('noticeGallery', 'Terhubung ke Firestore. Galeri kosong.');
      return;
    }
    tb.innerHTML = sn.docs.map(d => {
      const g = d.data();
      return `<tr>
        <td>${g.caption || '—'}</td>
        <td><a href="${g.imageUrl}" target="_blank" rel="noopener" style="color:#3949AB;font-size:.82rem">Lihat ↗</a></td>
        <td><button class="action-btn btn-del" onclick="deleteGalleryItem('${d.id}')">Hapus</button></td>
      </tr>`;
    }).join('');
    nOk('noticeGallery', `${sn.docs.length} item galeri dimuat.`);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="3" style="color:#E05B5B;padding:1.5rem;text-align:center">Gagal: ${e.message}</td></tr>`;
    nWarn('noticeGallery', 'Gagal memuat galeri: ' + e.message);
  }
}

async function addGalleryItem() {
  const url = prompt('URL foto publik\n(Google Drive, Cloudinary, Imgur, Supabase Storage, dll):');
  if (!url?.trim()) return;
  const caption = prompt('Keterangan foto (opsional):') || '';
  try {
    await addDoc(collection(db, 'gallery'), {
      imageUrl: url.trim(), caption,
      order: Date.now(), createdAt: serverTimestamp(),
    });
    loadGallery();
  } catch (e) {
    alert('Gagal menambahkan item galeri: ' + e.message);
  }
}

async function deleteGalleryItem(id) {
  if (!confirm('Hapus item galeri ini?')) return;
  try {
    await deleteDoc(doc(db, 'gallery', id));
    loadGallery();
  } catch (e) {
    alert('Gagal menghapus item galeri: ' + e.message);
  }
}

// ═══════════════════════════════════════════════════════
//  KEYBOARD SHORTCUT
// ═══════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && $lf && $lf.style.display !== 'none') doLogin();
});

// ═══════════════════════════════════════════════════════
//  EXPOSE KE WINDOW
//  WAJIB — script type="module" punya scope terpisah.
//  Tanpa ini, onclick="..." di HTML tidak akan bekerja.
// ═══════════════════════════════════════════════════════
Object.assign(window, {
  doLogin, doLogout, showPanel,
  saveContact, saveHours, saveBrand, saveSeo,
  saveProduct, editProduct, confirmDelete, clearProductForm,
  saveContent,
  addGalleryItem, deleteGalleryItem,
});
