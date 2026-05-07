import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check if essential elements are present
    await expect(page.getByRole('heading', { name: /Giriş Yap|Login/i })).toBeVisible();
    await expect(page.getByLabel(/E-posta|Email/i)).toBeVisible();
    await expect(page.getByLabel(/Şifre|Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Giriş|Login/i })).toBeVisible();
  });
  
  test('should navigate to register page from login', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=/Kayıt Ol|Register/i');
    
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: /Kayıt Ol|Register/i })).toBeVisible();
  });
});
