
# Peso Sensei

This is a NextJS application for personal finance tracking, built with Firebase Studio.

To get started:
1. Ensure you have Firebase environment variables set up in your project (e.g., in a `.env.local` file or your hosting environment).
   Required variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
2. **Enable Firebase Services:** In your Firebase project console:
    - Go to **Authentication** -> **Sign-in method** tab and enable the **Email/Password** provider (and any other providers you intend to use).
    - Go to **Firestore Database** and click **"Create database"**. Choose your initial security rules (Test mode is fine for early development) and a location.
3. Run `npm install` or `yarn install`.
4. Run `npm run dev` or `yarn dev`.
5. Open your browser to `http://localhost:9002` (or the port specified in your dev script).

The main application logic starts at `src/app/(main)/page.tsx` for authenticated users and `src/app/(auth)/login/page.tsx` for login.
