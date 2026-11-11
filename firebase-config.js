
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKGfeDDlw6-FJnCgi8ZI-LKMKj25OolWY",
  authDomain: "choco-store-timika.firebaseapp.com",
  projectId: "choco-store-timika",
  storageBucket: "choco-store-timika.firebasestorage.app",
  messagingSenderId: "562581944405",
  appId: "1:562581944405:web:2c5f231c333a216059bcdc"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi layanan Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
