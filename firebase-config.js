/**
 * CHOCO STORE TIMIKA — Firebase Configuration
 *
 * PENTING: Jangan commit file ini ke repository publik (GitHub, dsb.)
 * sebelum Anda mengamankan credentials. Tambahkan ke .gitignore.
 *
 * Cara mendapatkan konfigurasi Firebase:
 * 1. Buka https://console.firebase.google.com
 * 2. Buat project baru atau pilih project yang ada
 * 3. Buka Project Settings → Your apps → Web app
 * 4. Copy konfigurasi dan paste di bawah ini
 */

// ─── LANGKAH 1: ISI KONFIGURASI FIREBASE ─────────────────────────────────────
const firebaseConfig = {
  apiKey:            "GANTI_DENGAN_API_KEY_ANDA",
  authDomain:        "GANTI.firebaseapp.com",
  projectId:         "GANTI_DENGAN_PROJECT_ID",
  storageBucket:     "GANTI.appspot.com",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId:             "GANTI_DENGAN_APP_ID",
};

// ─── LANGKAH 2: INISIALISASI (uncomment setelah mengisi config) ───────────────
/*
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
async function getProducts(category = null) {
  let q = query(
    collection(db, "products"),
    where("available", "==", true),
    orderBy("order", "asc")
  );
  if (category && category !== 'all') {
    q = query(q, where("category", "==", category));
  }
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ─── BRAND CONFIG ─────────────────────────────────────────────────────────────
async function getBrandConfig() {
  const docRef = doc(db, "config", "brand");
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// ─── ADMIN AUTH ───────────────────────────────────────────────────────────────
async function adminLogin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

async function adminLogout() {
  return signOut(auth);
}

function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export { db, storage, auth, getProducts, getBrandConfig, adminLogin, adminLogout, onAuthChange };
*/

// ─── FIRESTORE COLLECTIONS MAP ────────────────────────────────────────────────
/**
 * Struktur koleksi Firestore yang direncanakan:
 *
 * /products/{id}
 *   name, category, description, price, images[], available, featured, order
 *
 * /config/brand
 *   name, shortName, tagline, description, logoUrl, faviconUrl
 *
 * /config/contact
 *   whatsapp, email, address, mapsEmbed, instagram, facebook
 *
 * /config/hours
 *   weekday, weekend, holiday, note
 *
 * /config/seo
 *   title, description, keywords, canonical, ogImage
 *
 * /config/hero
 *   eyebrow, headline, subtext, ctaPrimary, ctaSecondary, backgroundImage
 *
 * /gallery/{id}
 *   imageUrl, caption, order, visible
 *
 * /content/wholesale
 *   retail: { title, description, features[] }
 *   wholesale: { title, description, features[] }
 */

console.log('[Firebase] Config siap. Aktifkan dengan mengisi credentials dan uncomment kode di atas.');
