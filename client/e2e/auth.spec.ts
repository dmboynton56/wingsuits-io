// Install playwright if needed: npx playwright install

import { test, expect } from '@playwright/test';

test('Auth to race flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Login with Google'); // Mock or use test account
  await expect(page.locator('[data-testid="profile-card"]')).toBeVisible(); // Stub data-testid on Card
  await page.click('text=Open Map Terminal');
  await page.click('text=Alpine Dash');
  await page.click('text=Start Race');
  await expect(page.locator('.progress')).toBeVisible(); // HUD
  await page.keyboard.press('KeyW'); // Fly stub
  await expect(page.locator('text=Checkpoint')).toContainText('2'); // After move
});
