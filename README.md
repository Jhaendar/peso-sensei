# Peso Sensei - Personal Finance Tracker

## Project Overview

Peso Sensei is a Next.js application designed for personal finance tracking. It allows users to manage their income and expenses, categorize transactions, and view financial reports. The application uses Firebase for backend services, including authentication (Email/Password) and Firestore for database storage. It also features AI-driven receipt scanning to simplify expense input.

## Features (Conceptual)
* User authentication (Login, Signup)
* Transaction management (Create, Read, Update, Delete income and expenses)
* Category management for transactions
* Dashboard overview of financial status
* Monthly financial reports and charts
* AI-powered receipt scanning and data extraction for quick expense logging
* Light and Dark theme support

## Prerequisites

Before you begin, ensure you have the following tools installed:
- **Node.js**: Version 20.x or later (LTS recommended)
- **npm** (Node Package Manager) or **yarn**: npm is included with Node.js.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd peso-sensei
    ```
    (Replace `<repository-url>` with the actual URL of the repository)

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    or if you prefer yarn:
    ```bash
    yarn install
    ```

3.  **Set up Environment Variables (Firebase Configuration):**
    Create a `.env.local` file in the root of your project and add your Firebase project configuration:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```
    These variables are essential for connecting to your Firebase backend.

4.  **Enable Firebase Services in the Firebase Console:**
    *   **Authentication:**
        *   Go to **Authentication** -> **Sign-in method** tab.
        *   Enable the **Email/Password** provider (and any other providers you intend to use).
    *   **Cloud Firestore (Database):**
        *   Go to **Firestore Database**.
        *   Click **"Create database"**.
        *   Choose your initial **security rules** (Test mode is fine for early development, but remember to secure it later with appropriate rules, e.g., in `firestore.rules`).
        *   Select a **location** for your database. This cannot be changed later.

5.  **Firestore Data Structure & Indexes:**
    *   **Data Structure:** Firestore is a NoSQL database. Collections (like `transactions` and `categories`) and their document structures will be created automatically by the application the first time data is written to them. The fields within your documents will match the types defined in `src/lib/types.ts`.
    *   **Composite Indexes:** For optimal query performance, some queries require composite indexes. You create these in the Firebase Console (**Firestore Database -> Indexes tab**). If an index is missing, your application will usually log an error in the console with a direct link to create the required index.
        *   **Likely required for `transactions` collection:**
            *   Fields: `userId` (Ascending), `date` (Ascending)
            *   Purpose: Used on the dashboard and transaction pages to fetch a user's transactions.
        *   **Likely required for `categories` collection:**
            *   Fields: `userId` (Ascending), `type` (Ascending)
            *   Purpose: Used in the transaction form to fetch a user's categories filtered by type (income/expense).

6.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the application, typically on `http://localhost:9002` (as configured in the `dev` script).

## Available Scripts

The `package.json` file includes several scripts for development and maintenance:

-   `npm run dev`: Starts the Next.js development server with Turbopack on port 9002.
-   `npm run genkit:dev`: Starts the Genkit development server for AI features.
-   `npm run genkit:watch`: Starts the Genkit development server with watch mode.
-   `npm run build`: Builds the application for production.
-   `npm run start`: Starts a Next.js production server (after running `build`).
-   `npm run lint`: Runs ESLint to identify and fix code style issues.
-   `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
-   `npm run test`: Runs unit and component tests with Vitest in watch mode.
-   `npm run test:run`: Runs all Vitest tests once.
-   `npm run test:ui`: Opens the Vitest UI for interactive test running and debugging.
-   `npm run coverage`: Runs Vitest tests and generates code coverage reports.

## Testing

### Unit and Component Tests

This project uses [Vitest](https://vitest.dev/) for unit and component testing.
-   **Configuration**: `vitest.config.mts`
-   **Setup File**: `src/vitest.setup.ts` (configures `@testing-library/jest-dom` matchers)
-   **Test Files**: Located alongside the code they test (e.g., `*.test.ts` or `*.test.tsx`) within the `src` directory.

**Running Tests:**
-   Run all tests once: `npm run test:run`
-   Run tests in watch mode: `npm run test`
-   Open Vitest UI: `npm run test:ui`
-   Generate coverage report: `npm run coverage` (reports in `./vitest-coverage/`)

### End-to-End (E2E) / Integration Tests

[Playwright](https://playwright.dev/) has been installed and configured for end-to-end testing.
-   **Configuration**: `playwright.config.ts`
-   **Test Files**: Located in the `tests/` directory (e.g., `auth.spec.ts`).

**Running E2E Tests:**
-   Run all Playwright tests: `npx playwright test`
-   Run tests with UI mode: `npx playwright test --ui`

**Note**: During recent development, running Playwright tests encountered environment-specific timeouts related to starting the Next.js development server within the testing sandbox. While the test setup and a sample login flow test (`tests/auth.spec.ts`) exist, these tests might be skipped or require manual server startup in some environments until the timeout issues are resolved.

## Linting and Type Checking

-   **ESLint**: To check for code quality and style issues, run `npm run lint`. This command will also attempt to automatically fix some issues.
-   **TypeScript**: To perform static type checking, run `npm run typecheck`.

It's recommended to run these checks before committing code.

## Deployment

The application is configured for deployment using Firebase App Hosting. The configuration can be found in `apphosting.yaml`. This file includes settings like `maxInstances` for server scaling. Ensure your Firebase project is set up for App Hosting and connected to your GitHub repository for automated builds and deployments.

---

The main application logic for authenticated users starts at `src/app/(main)/page.tsx`, and the login flow is at `src/app/(auth)/login/page.tsx`.
The original README content regarding Firebase setup and Firestore indexes has been integrated into the "Getting Started" section.
