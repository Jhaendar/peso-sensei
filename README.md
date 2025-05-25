
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

2. **Enable Firebase Services in the Firebase Console:**
    - **Authentication:**
        - Go to **Authentication** -> **Sign-in method** tab.
        - Enable the **Email/Password** provider (and any other providers you intend to use).
    - **Cloud Firestore (Database):**
        - Go to **Firestore Database**.
        - Click **"Create database"**.
        - Choose your initial **security rules** (Test mode is fine for early development, but remember to secure it later).
        - Select a **location** for your database. This cannot be changed later.

3. **Firestore Data Structure & Indexes:**
    - **Data Structure:** Firestore is a NoSQL database. You do not define a "schema" or "table structure" in the console beforehand. Collections (like `transactions` and `categories`) and their document structures will be created automatically by the application the first time data is written to them. The fields within your documents will match the types defined in `src/lib/types.ts`.
    - **Composite Indexes:** For optimal query performance, some queries require composite indexes. You create these in the Firebase Console (**Firestore Database -> Indexes tab**). If an index is missing, your application will usually log an error in the console with a direct link to create the required index.
        - **Likely required for `transactions` collection:**
            - Fields: `userId` (Ascending), `date` (Ascending)
            - Purpose: Used on the dashboard to fetch a user's transactions for the current month.
        - **Likely required for `categories` collection:**
            - Fields: `userId` (Ascending), `type` (Ascending)
            - Purpose: Used in the transaction form to fetch a user's categories filtered by type (income/expense).

4. Run `npm install` or `yarn install`.
5. Run `npm run dev` or `yarn dev`.
6. Open your browser to `http://localhost:9002` (or the port specified in your dev script).

The main application logic starts at `src/app/(main)/page.tsx` for authenticated users and `src/app/(auth)/login/page.tsx` for login.
