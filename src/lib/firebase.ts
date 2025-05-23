
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

// This initial check helps identify missing API key early.
if (!firebaseConfig.apiKey) {
  console.error(
    "CRITICAL: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or empty in environment variables. " +
    "Firebase initialization will likely fail. Please check your .env.local file."
  );
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
  if (getApps().length === 0) {
    // This will throw an error if firebaseConfig.apiKey is invalid (e.g., "YOUR_..." placeholder)
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
    if (!db) {
      // This case should be rare if getFirestore itself doesn't throw
      console.error("CRITICAL: Firestore DB instance (db) is undefined after Firebase app initialization. Firestore might not be enabled or properly configured in your Firebase project.");
    }
  } else {
    // This case would be hit if getApp() returned undefined when apps exist, which is unlikely.
    // Or if initializeApp itself failed and returned undefined (also unlikely, it usually throws).
    console.error("CRITICAL: Firebase App instance (app) is undefined after attempting initialization.");
  }
} catch (error: any) {
  console.error("CRITICAL: Firebase initialization failed with an error:", error.message);
  console.error("Full error stack:", error.stack);
  console.error("Firebase config used:", JSON.stringify({
    apiKey: firebaseConfig.apiKey ? '********' : 'MISSING_OR_EMPTY', // Don't log full API key
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    // Add other config properties if needed for debugging, but be careful with sensitive info
  }));
  // app, auth, and db will remain undefined if an error is caught here.
}

export { app, auth, db };
