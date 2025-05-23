import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if the essential API key is missing.
// This log will appear in the server console during development if the key is not set.
if (!firebaseConfig.apiKey) {
  console.error(
    "CRITICAL: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or empty. " +
    "Please ensure it is correctly set in your .env.local file or environment variables. " +
    "Firebase will fail to initialize, leading to 'auth/invalid-api-key' errors."
  );
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase, ensuring it's done only once across client/server.
if (getApps().length === 0) {
  // If firebaseConfig.apiKey is undefined here, initializeApp will throw an error.
  // The console.error above should provide a clue to the user.
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Use the existing app if already initialized.
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
