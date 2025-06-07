/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react'; // Required for testing React components

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(), // Add the React plugin
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'], // Added setup file
    reporters: ['default', 'html'], // Adds HTML reporter
    outputFile: {
      html: './vitest-report/index.html', // Specify output for HTML reporter
    },
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './vitest-coverage',
    },
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  },
});
