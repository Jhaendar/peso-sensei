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
2. Run `npm install` or `yarn install`.
3. Run `npm run dev` or `yarn dev`.
4. Open your browser to `http://localhost:9002` (or the port specified in your dev script).

The main application logic starts at `src/app/(main)/page.tsx` for authenticated users and `src/app/(auth)/login/page.tsx` for login.
