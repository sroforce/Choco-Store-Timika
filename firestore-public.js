/**
 * CHOCO STORE TIMIKA — Public Site Firestore Reader
 * Memuat konfigurasi dan produk dari Firestore lalu menerapkannya ke halaman publik.
 * Jika Firestore tidak tersedia / gagal, halaman tetap berfungsi dengan data fallback.
 *
 * File ini diimpor oleh index.html sebagai <script type="module">.
 * Import path: firebase-config.js berada satu folder di atas (root).
 */

import { db } from '../firebase-config.js';
import {
  doc, getDoc, collection, getDocs, query, orderBy,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

(async function applyFirestoreData() {
  try {
    // ── Muat config kontak + jam + konten hero secara paralel ──────────────
    const [contactSnap, hoursSnap, heroSnap] = await Promise.all([
      getDoc(doc(db, 'config', 'contact')),
      getDoc(doc(db, 'config', 'hours')),
      getDoc(doc(db, 'content', 'hero')),
    ]);

    // ── Kontak ─────────────────────────────────────────────────────────────
    if (contactSnap.exists()) {
      const c = contactSnap.data();

      // Update nomor WhatsApp di CONFIG global (C.wa) agar semua tombol WA ikut berubah
      if (c.whatsapp && window.C) {
        window.C.wa = c.whatsapp;
      }

      // Update tampilan kontak di section Contact
      if (c.whatsapp) _updateContactEl('whatsapp', c.whatsapp);
      if (c.email)    _updateContactEl('email', c.email);

      if (c.address) {
        _updateContactEl('alamat', `${c.address}<br><span style="color:rgba(247,241,232,.5)">Timika, Papua, Indonesia</span>`);
      }

      // Google Maps Embed — ganti placeholder div dengan iframe nyata
      if (c.mapsEmbed) {
        const mapp = document.querySelector('.mapp');
        if (mapp) {
          mapp.style.padding = '0';
          mapp.style.height  = '220px';
          mapp.innerHTML = `<iframe
            src="${c.mapsEmbed}"
            width="100%" height="100%"
            style="border:0;border-radius:4px;display:block"
            allowfullscreen="" loading="lazy"
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>`;
        }
      }
    }

    // ── Jam Operasional ────────────────────────────────────────────────────
    if (hoursSnap.exists()) {
      const h = hoursSnap.data();
      const lines = [h.weekday, h.weekend, h.note].filter(Boolean);
      if (lines.length) {
        _updateContactEl('jam operasional', lines.join('<br>'));
      }
    }

    // ── Hero Section ────────────────────────────────────────────────────────
    if (heroSnap.exists()) {
      const h = heroSnap.data();
      if (h.headline) {
        const el = document.querySelector('.hh1');
        if (el) {
          // Pertahankan tag <em> untuk kata "Chocolate" yang berwarna gold
          const parts = h.headline.split(/chocolate/i);
          if (parts.length > 1) {
            el.innerHTML = `${parts[0]}<em>Chocolate</em>${parts[1]}`;
          } else {
            el.textContent = h.headline;
          }
        }
      }
      if (h.subtext) {
        const el = document.querySelector('.hdesc');
        if (el) el.textContent = h.subtext;
      }
    }

    // ── Produk dari Firestore ───────────────────────────────────────────────
    const pSnap = await getDocs(
      query(collection(db, 'products'), orderBy('order'))
    );

    if (!pSnap.empty) {
      // Mapping Firestore document → format yang digunakan render() di index.html
      window._CST_PRODUCTS = pSnap.docs
        .filter(d => d.data().available !== false) // Sembunyikan produk stok habis
        .map(d => {
          const p = d.data();
          return {
            id:   d.id,
            cat:  p.category,
            name: p.name,
            desc: p.description,
            feat: !!p.featured,
            available: p.available !== false,
            price: p.price?.label || 'Hubungi untuk harga',
            // Gunakan foto nyata jika ada, jika tidak pakai gradient fallback
            bg: p.imageUrl
              ? `url("${p.imageUrl}") center/cover no-repeat`
              : (p._gradient || _defaultGradient(p.category)),
          };
        });

      // Re-render katalog produk dengan data Firestore
      if (typeof render === 'function') {
        render('all');
        // Reset filter buttons ke "Semua"
        document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('on'));
        const allBtn = document.querySelector('.fbtn[data-f="all"]');
        if (allBtn) allBtn.classList.add('on');
      }
    }

  } catch (e) {
    // Silent fail — tidak tampilkan error ke pengunjung, cukup gunakan data fallback
    console.log('[Choco Store] Menggunakan data fallback:', e.message);
  }
})();

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Update teks di elemen .cv berdasarkan label .clb yang cocok.
 * Toleran terhadap huruf besar/kecil.
 */
function _updateContactEl(labelText, htmlValue) {
  if (!htmlValue) return;
  document.querySelectorAll('.cit').forEach(item => {
    const lbl = item.querySelector('.clb');
    if (lbl && lbl.textContent.trim().toLowerCase().includes(labelText.toLowerCase())) {
      const val = item.querySelector('.cv');
      if (val) val.innerHTML = htmlValue;
    }
  });
}

/**
 * Gradient fallback per kategori produk (digunakan jika produk tidak punya foto).
 */
function _defaultGradient(category) {
  const map = {
    dark:   'radial-gradient(ellipse at 25% 28%,#C79552 0%,#9B5B35 18%,#3A211B 100%)',
    milk:   'linear-gradient(135deg,#D2691E 0%,#A0522D 60%,#2B1712 100%)',
    white:  'linear-gradient(135deg,#F7DFA3 0%,#C79552 55%,#8B6914 100%)',
    gift:   'linear-gradient(155deg,#2B1712 0%,#593629 45%,#C79552 80%,#2B1712 100%)',
    baking: 'linear-gradient(135deg,#2B1712 0%,#3A211B 55%,#593629 100%)',
  };
  return map[category] || 'linear-gradient(135deg,#2B1712,#593629)';
}
