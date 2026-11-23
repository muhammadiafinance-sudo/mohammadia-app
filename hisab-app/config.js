/* 🔥 Firebase config of the NEW project for this app (not the shop app's project).
   Firebase Console → ⚙️ Project settings → General → "Your apps" → Web app (</>) → "SDK setup and configuration" → Config.
   Copy the values in below. This config is not secret; your Firestore Rules protect the data. */
window.HISAB_FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

/* The two login accounts. Create them in the NEW project:
   Firebase Console → Authentication → Users → Add user (email + password).
   Must match firestore.rules. */
window.HISAB_ROLE_EMAILS = {
  "muhammadiafinance+shop@gmail.com": "admin",     // Shop login  → Daily Hisab only
  "muhammadiafinance+bank@gmail.com": "employee"   // Bank login  → full Bank portal
};
