/**
 * CHOCO STORE TIMIKA — Public Site Firestore Reader
 * LOKASI: root/ (dipindah dari js/ untuk kompatibilitas GitHub Pages)
 *
 * FIX ROOT CAUSE: Import path diubah ke './firebase-config.js'
 * FIX XSS: Semua data Firestore dimasukkan ke DOM via textContent dan DOM API,
 * bukan innerHTML. URL divalidasi sebelum digunakan sebagai href/src.
 */

import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs, query, orderBy }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

(async function applyFirestoreData() {
  try {
    const [contactSnap, hoursSnap, heroSnap] = await Promise.all([
      getDoc(doc(db, 'config', 'contact')),
      getDoc(doc(db, 'config', 'hours')),
      getDoc(doc(db, 'content', 'hero')),
    ]);

    // ── Kontak ─────────────────────────────────────────────────────────────
    if (contactSnap.exists()) {
      const c = contactSnap.data();

      // Update C.wa agar semua tombol WA ikut berubah
      if (c.whatsapp && window.C) window.C.wa = c.whatsapp;

      // FIX XSS: gunakan textContent, bukan innerHTML
      if (c.whatsapp) _updateContactText('whatsapp', c.whatsapp);
      if (c.email)    _updateContactText('email', c.email);
      if (c.address)  _updateContactAddress(c.address);

      // Google Maps embed — validasi URL
      if (c.mapsEmbed && _validHttpsUrl(c.mapsEmbed)) {
        const mapp = document.querySelector('.mapp');
        if (mapp) {
          mapp.style.padding = '0';
          mapp.style.height  = '220px';
          // iframe src dengan URL yang sudah divalidasi
          const iframe = document.createElement('iframe');
          iframe.src = c.mapsEmbed;
          iframe.width = '100%'; iframe.height = '100%';
          iframe.style.cssText = 'border:0;border-radius:4px;display:block';
          iframe.setAttribute('allowfullscreen', '');
          iframe.setAttribute('loading', 'lazy');
          iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
          mapp.textContent = '';
          mapp.appendChild(iframe);
        }
      }
    }

    // ── Jam Operasional ─────────────────────────────────────────────────────
    if (hoursSnap.exists()) {
      const h = hoursSnap.data();
      const lines = [h.weekday, h.weekend, h.note].filter(Boolean);
      if (lines.length) _updateContactLines('jam operasional', lines);
    }

    // ── Hero Section ────────────────────────────────────────────────────────
    if (heroSnap.exists()) {
      const h = heroSnap.data();
      if (h.headline) _updateHeroHeadline(h.headline);
      if (h.subtext) {
        const el = document.querySelector('.hdesc');
        // FIX XSS: textContent
        if (el) el.textContent = h.subtext;
      }
    }

    // ── Produk dari Firestore ───────────────────────────────────────────────
    const pSnap = await getDocs(query(collection(db,'products'), orderBy('order')));
    if (!pSnap.empty) {
      window._CST_PRODUCTS = pSnap.docs
        .filter(d => d.data().available !== false)
        .map(d => {
          const p = d.data();
          return {
            id:        d.id,
            cat:       p.category,
            name:      p.name   || '',  // escaping dilakukan di render() di index.html
            desc:      p.description || '',
            feat:      !!p.featured,
            available: true,
            price:     p.price?.label || 'Hubungi untuk harga',
            bg:        _validImageBg(p.imageUrl, p.category),
          };
        });

      if (typeof render === 'function') {
        render('all');
        document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('on'));
        const allBtn = document.querySelector('.fbtn[data-f="all"]');
        if (allBtn) allBtn.classList.add('on');
      }
    }

  } catch (e) {
    // Silent fail — public site tetap berjalan dengan data fallback
    console.log('[Choco Store Public] Menggunakan data fallback:', e.message);
  }
})();

// ── DOM Helpers (XSS-safe) ───────────────────────────────────────────────────

/** Update teks pada .cv berdasarkan label .clb yang cocok — menggunakan textContent */
function _updateContactText(labelText, value) {
  if (!value) return;
  document.querySelectorAll('.cit').forEach(item => {
    const lbl = item.querySelector('.clb');
    if (lbl && lbl.textContent.trim().toLowerCase().includes(labelText.toLowerCase())) {
      const val = item.querySelector('.cv');
      // FIX XSS: textContent menggantikan innerHTML
      if (val) val.textContent = value;
    }
  });
}

/** Update alamat — teks diikuti baris tetap "Timika, Papua, Indonesia" */
function _updateContactAddress(address) {
  document.querySelectorAll('.cit').forEach(item => {
    const lbl = item.querySelector('.clb');
    if (lbl && lbl.textContent.trim().toLowerCase().includes('alamat')) {
      const val = item.querySelector('.cv');
      if (val) {
        val.textContent = '';
        // FIX XSS: DOM API untuk baris-baris teks
        val.appendChild(document.createTextNode(address));
        val.appendChild(document.createElement('br'));
        const loc = document.createElement('span');
        loc.style.color = 'rgba(247,241,232,0.5)';
        loc.textContent = 'Timika, Papua, Indonesia';
        val.appendChild(loc);
      }
    }
  });
}

/** Update jam operasional dengan baris-baris teks (menggantikan <br> di innerHTML) */
function _updateContactLines(labelText, lines) {
  document.querySelectorAll('.cit').forEach(item => {
    const lbl = item.querySelector('.clb');
    if (lbl && lbl.textContent.trim().toLowerCase().includes(labelText.toLowerCase())) {
      const val = item.querySelector('.cv');
      if (val) {
        val.textContent = '';
        // FIX XSS: DOM API untuk multi-line
        lines.forEach((line, i) => {
          if (i > 0) val.appendChild(document.createElement('br'));
          val.appendChild(document.createTextNode(line));
        });
      }
    }
  });
}

/** Update hero headline — pertahankan <em> untuk kata "Chocolate" */
function _updateHeroHeadline(headline) {
  const el = document.querySelector('.hh1');
  if (!el) return;
  el.textContent = '';
  // FIX XSS: DOM API — cari kata "Chocolate" dan bungkus dengan <em>
  const idx = headline.toLowerCase().indexOf('chocolate');
  if (idx >= 0) {
    el.appendChild(document.createTextNode(headline.slice(0, idx)));
    const em = document.createElement('em');
    em.textContent = headline.slice(idx, idx + 9);
    el.appendChild(em);
    el.appendChild(document.createTextNode(headline.slice(idx + 9)));
  } else {
    el.textContent = headline;
  }
}

/** Validasi URL untuk background image produk */
function _validImageBg(imageUrl, category) {
  if (imageUrl && _validHttpsUrl(imageUrl)) {
    return `url("${imageUrl}") center/cover no-repeat`;
  }
  const gradients = {
    dark:   'radial-gradient(ellipse at 25% 28%,#C79552 0%,#9B5B35 18%,#3A211B 100%)',
    milk:   'linear-gradient(135deg,#D2691E 0%,#A0522D 60%,#2B1712 100%)',
    white:  'linear-gradient(135deg,#F7DFA3 0%,#C79552 55%,#8B6914 100%)',
    gift:   'linear-gradient(155deg,#2B1712 0%,#593629 45%,#C79552 80%,#2B1712 100%)',
    baking: 'linear-gradient(135deg,#2B1712 0%,#3A211B 55%,#593629 100%)',
  };
  return gradients[category] || 'linear-gradient(135deg,#2B1712,#593629)';
}

/** Validasi bahwa URL menggunakan https:// (blokir javascript: dan data:) */
function _validHttpsUrl(s) {
  return typeof s === 'string' && /^https:\/\//i.test(s.trim());
}
