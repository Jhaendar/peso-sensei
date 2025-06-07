import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow a user to log in and redirect to the dashboard', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Verify we are on the login page (optional, good practice)
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /Welcome Back!/i })).toBeVisible();

    // Fill in the email and password
    // Assuming standard input field names or identifiable labels/placeholders
    await page.getByPlaceholder('you@example.com').fill('testuser@example.com');
    await page.getByPlaceholder('••••••••').fill('password123');

    // Click the login button
    // Assuming the main submit button is identifiable by its text 'Log In'
    await page.getByRole('button', { name: /Log In/i }).click();

    // Assert that the user is redirected to the dashboard page (usually '/')
    // Increase timeout for this expectation as navigation can take time
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Optional: Further assert that dashboard specific content is visible
    // For example, if the dashboard has a heading "Dashboard" or a specific element:
    // await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  });

  // TODO: Add a test for signup if time permits or as a follow-up
  // test('should allow a user to sign up and redirect to the dashboard', async ({ page }) => {
  //   // ...
  // });

  // TODO: Add a test for logout if time permits or as a follow-up
  // test('should allow a logged-in user to log out', async ({ page }) => {
  //   // First, log in the user (can be a helper function or reuse login steps)
  //   await page.goto('/login');
  //   await page.getByPlaceholder('you@example.com').fill('testuser@example.com');
  //   await page.getByPlaceholder('••••••••').fill('password123');
  //   await page.getByRole('button', { name: /Log In/i }).click();
  //   await expect(page).toHaveURL('/', { timeout: 10000 });

  //   // Now, perform logout
  //   // Assuming a logout button is available in the navbar or a user menu
  //   // This selector will depend on your Navbar component structure
  //   const logoutButton = page.getByRole('button', { name: /Logout/i });
  //   if (await logoutButton.isVisible()) {
  //       await logoutButton.click();
  //   } else {
  //       // Fallback for mobile: open menu first if logout is inside a sheet/dropdown
  //       const menuButton = page.getByRole('button', { name: /Open menu/i });
  //       if (await menuButton.isVisible()) {
  //           await menuButton.click();
  //           await page.getByRole('button', { name: /Logout/i }).click();
  //       } else {
  //           throw new Error("Logout button not found");
  //       }
  //   }

  //   // Assert redirection to login page after logout
  //   await expect(page).toHaveURL('/login', { timeout: 10000 });
  //   await expect(page.getByRole('heading', { name: /Welcome Back!/i })).toBeVisible();
  // });
});
