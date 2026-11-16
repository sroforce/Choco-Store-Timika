/**
 * CHOCO STORE TIMIKA — Admin Firestore Module
 * FIX: Module-ready signal, diagnostic logging, null-safe DOM, error handling
 */

import { auth, db } from '../firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ═══════════════════════════════════════════════════════
//  FIX #1 — Sinyal ke HTML bahwa module berhasil dimuat
//  Harus jalan PERTAMA, sebelum kode lain
// ═══════════════════════════════════════════════════════
(function signalModuleLoaded() {
  if (typeof window.__CST_ON_MODULE_READY === 'function') {
    window.__CST_ON_MODULE_READY();
  }
  console.group('[CST Admin] Module dimuat');
  console.log('firebase-config.js:', auth ? '✅' : '❌', '| auth:', !!auth, '| db:', !!db);
  console.groupEnd();
})();

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
//  DOM UTILITIES — FIX #2: null-safe selectors
// ═══════════════════════════════════════════════════════
const $  = id => document.getElementById(id);
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
//  FIREBASE AUTHENTICATION — FIX #3: Diagnostic logging
// ═══════════════════════════════════════════════════════

// FIX #4: DOM refs dicek null-safe — tidak akan throw jika elemen tidak ada
const $ls  = $('loginScreen');
const $ac  = $('authCheck');
const $lf  = $('loginForm');
const $lb  = $('loginBtn');
const $le  = $('loginEmail');
const $lp  = $('loginPassword');
const $err = $('loginErr');

console.log('[CST Auth] DOM refs:',
  'loginScreen:', !!$ls,
  'authCheck:', !!$ac,
  'loginForm:', !!$lf,
  'loginBtn:', !!$lb
);

// Timeout internal (8 detik) — menangani kasus Firebase Auth lambat merespons
// Jika modul sendiri tidak load, timeout ini tidak jalan (HTML fallback yang menangani)
const authTmo = setTimeout(() => {
  console.warn('[CST Auth] ⚠ onAuthStateChanged belum merespons setelah 8 detik.');
  if ($ac) $ac.style.display = 'none';
  if ($lf) $lf.style.display = 'block';
  _showErr(
    'Firebase Auth tidak merespons. Kemungkinan koneksi terputus.\n' +
    'Muat ulang halaman untuk mencoba lagi.'
  );
}, 8000);

// FIX: Pastikan Firebase selesai init sebelum onAuthStateChanged
// Tambahkan pengecekan bahwa auth valid
if (!auth) {
  clearTimeout(authTmo);
  if ($ac) $ac.style.display = 'none';
  if ($lf) $lf.style.display = 'block';
  _showErr('Firebase Auth tidak terinisialisasi. Periksa firebase-config.js.');
  console.error('[CST Auth] ❌ auth object is null/undefined');
} else {
  console.log('[CST Auth] Mendaftarkan onAuthStateChanged...');

  onAuthStateChanged(auth, async user => {
    // FIX: Sinyal ke HTML fallback bahwa auth callback berhasil dijalankan
    if (typeof window.__CST_ON_AUTH_READY === 'function') {
      window.__CST_ON_AUTH_READY();
    }
    clearTimeout(authTmo);

    // FIX: Diagnostic log — tampilkan status di console untuk debugging
    console.group('[CST Auth] onAuthStateChanged fired');
    console.log('User:', user ? `UID: ${user.uid}` : 'null (tidak ada sesi)');
    console.log('Expected UID:', ADMIN_UID);
    console.log('UID match:', user ? user.uid === ADMIN_UID : false);
    console.groupEnd();

    if ($ac) $ac.style.display = 'none';

    if (user && user.uid === ADMIN_UID) {
      // ✅ Login valid sebagai administrator
      console.log('[CST Auth] ✅ UID valid. Membuka dashboard...');
      if ($ls) $ls.style.display = 'none';
      if ($lf) $lf.style.display = 'block';
      _resetAuth();

    } else if (user) {
      // ⛔ Login ke Firebase berhasil, tapi bukan administrator
      console.warn('[CST Auth] ⛔ UID tidak cocok — paksa logout');
      try { await signOut(auth); } catch (e) { console.error('signOut error:', e); }
      if ($lf) $lf.style.display = 'block';
      if ($ls) $ls.style.display = 'flex';
      _showErr('Akses ditolak. Akun ini bukan administrator.');

    } else {
      // 🔒 Tidak ada sesi aktif
      console.log('[CST Auth] Tidak ada sesi. Menampilkan form login.');
      if ($lf) $lf.style.display = 'block';
      if ($ls) $ls.style.display = 'flex';
    }
  });
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────
async function doLogin() {
  const email = $le?.value.trim() ?? '';
  const pass  = $lp?.value ?? '';

  if (!email || !pass) { _showErr('Isi email dan password terlebih dahulu.'); return; }

  _setAuthLoad(true); _hideErr();
  console.log('[CST Auth] Login attempt:', email);

  try {
    const r = await signInWithEmailAndPassword(auth, email, pass);
    console.log('[CST Auth] signInWithEmailAndPassword sukses. UID:', r.user.uid);

    if (r.user.uid !== ADMIN_UID) {
      console.warn('[CST Auth] UID tidak cocok, logout...');
      await signOut(auth);
      _setAuthLoad(false);
      _showErr('Akses ditolak. Akun ini bukan administrator.');
    }
    // Jika UID cocok, onAuthStateChanged() menangani transisi ke dashboard

  } catch (e) {
    console.error('[CST Auth] Login error:', e.code, e.message);
    _setAuthLoad(false);
    _showErr(_ferr(e.code));
  }
}

// ─── LOGOUT ────────────────────────────────────────────────────────────────
async function doLogout() {
  console.log('[CST Auth] Logout...');
  try {
    await signOut(auth);
    if ($le) $le.value = '';
    if ($lp) $lp.value = '';
    _hideErr();
  } catch (e) {
    console.error('[CST Auth] Logout error:', e);
    window.location.reload();
  }
}

// ─── AUTH HELPERS ──────────────────────────────────────────────────────────
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

function _showErr(m)  {
  if ($err) { $err.textContent = m; $err.style.display = 'block'; }
}
function _hideErr() {
  if ($err) { $err.style.display = 'none'; $err.textContent = ''; }
}
function _setAuthLoad(v) {
  if ($lb) { $lb.disabled = v; $lb.textContent = v ? 'Memverifikasi...' : 'Masuk ke Dashboard'; }
  if ($le) $le.disabled = v;
  if ($lp) $lp.disabled = v;
}
function _resetAuth() { _setAuthLoad(false); _hideErr(); }

// ═══════════════════════════════════════════════════════
//  PANEL NAVIGATION
// ═══════════════════════════════════════════════════════
const PANEL_LOADERS = {
  config:   loadSettings,
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
    console.error('[Firestore] loadSettings:', e.message);
    nWarn('noticeConfig', 'Gagal memuat pengaturan: ' + e.message);
  }
}

// ═══════════════════════════════════════════════════════
//  SETTINGS — SAVE
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
      nOk('noticeProducts', 'Terhubung ke Firestore. Produk masih kosong.');
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
    console.error('[Firestore] loadProducts:', e.message);
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
    category:    gv('pCategory') || 'dark',
    description: gv('pDesc'),
    price: {
      amount: priceAmt,
      unit:   gv('pUnit') || null,
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
  if (ok) { clearProductForm(); showPanel('products'); }
}

// ═══════════════════════════════════════════════════════
//  PRODUCTS — EDIT
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
    const t = document.querySelector('#panel-add-product .panel-title');
    if (t) t.textContent = 'Edit Produk';
    showPanel('add-product');
  } catch (e) { alert('Gagal memuat produk: ' + e.message); }
}

// ═══════════════════════════════════════════════════════
//  PRODUCTS — DELETE
// ═══════════════════════════════════════════════════════
async function confirmDelete(id, name) {
  if (!confirm(`Hapus produk "${name}"?\n\nTindakan ini tidak dapat dibatalkan.`)) return;
  try {
    await deleteDoc(doc(db, 'products', id));
    loadProducts();
  } catch (e) { alert('Gagal menghapus produk: ' + e.message); }
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
    console.error('[Firestore] loadContent:', e.message);
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
//  GALLERY — LOAD / ADD / DELETE
// ═══════════════════════════════════════════════════════
async function loadGallery() {
  nLoad('noticeGallery');
  const tb = $('galleryTbody');
  if (!tb) return;
  tb.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:1.5rem">Memuat galeri...</td></tr>';
  try {
    const sn = await getDocs(query(collection(db, 'gallery'), orderBy('order')));
    if (sn.empty) {
      tb.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:2rem">Belum ada item galeri.</td></tr>';
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
    console.error('[Firestore] loadGallery:', e.message);
    tb.innerHTML = `<tr><td colspan="3" style="color:#E05B5B;padding:1.5rem;text-align:center">Gagal: ${e.message}</td></tr>`;
    nWarn('noticeGallery', 'Gagal memuat galeri: ' + e.message);
  }
}
async function addGalleryItem() {
  const url = prompt('URL foto publik\n(Google Drive, Cloudinary, Imgur, Supabase, dll):');
  if (!url?.trim()) return;
  const caption = prompt('Keterangan foto (opsional):') || '';
  try {
    await addDoc(collection(db, 'gallery'), {
      imageUrl: url.trim(), caption, order: Date.now(), createdAt: serverTimestamp(),
    });
    loadGallery();
  } catch (e) { alert('Gagal menambahkan item galeri: ' + e.message); }
}
async function deleteGalleryItem(id) {
  if (!confirm('Hapus item galeri ini?')) return;
  try {
    await deleteDoc(doc(db, 'gallery', id));
    loadGallery();
  } catch (e) { alert('Gagal menghapus item galeri: ' + e.message); }
}

// ═══════════════════════════════════════════════════════
//  KEYBOARD
// ═══════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && $lf && $lf.style.display !== 'none') doLogin();
});

// ═══════════════════════════════════════════════════════
//  EXPOSE KE WINDOW (wajib untuk onclick attributes di HTML)
// ═══════════════════════════════════════════════════════
Object.assign(window, {
  doLogin, doLogout, showPanel,
  saveContact, saveHours, saveBrand, saveSeo,
  saveProduct, editProduct, confirmDelete, clearProductForm,
  saveContent,
  addGalleryItem, deleteGalleryItem,
});
