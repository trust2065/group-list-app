import { test, expect } from '@playwright/test';

// ───────────────────────────────────────────────
// 1. History page (home) loads correctly
// ───────────────────────────────────────────────
test('history page loads and shows header', async ({ page }) => {
  await page.goto('/');
  // Wait for page to finish loading (Firestore query may take a moment)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
  // Verify the "New" button exists (could be "New Team" or "New Session")
  await expect(page.getByRole('button', { name: /New/i })).toBeVisible();
});

// ───────────────────────────────────────────────
// 2. Navigate to "New" input page
// ───────────────────────────────────────────────
test('clicking New navigates to input page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /New/i }).click({ timeout: 10_000 });
  await expect(page).toHaveURL('/new');
  await expect(page.locator('textarea')).toHaveCount(3);
});

// ───────────────────────────────────────────────
// 3. Input page has 3 textareas with default content
// ───────────────────────────────────────────────
test('input page has 3 team textareas with pre-filled names', async ({ page }) => {
  await page.goto('/new');
  const textareas = page.locator('textarea');
  await expect(textareas).toHaveCount(3);

  // First textarea should contain some default names
  const firstValue = await textareas.first().inputValue();
  expect(firstValue).toContain('Ann L');
});

// ───────────────────────────────────────────────
// 4. Help page loads
// ───────────────────────────────────────────────
test('help page loads and shows feature cards', async ({ page }) => {
  await page.goto('/help');
  await expect(page.getByText('Drag & Drop')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Pro Tips')).toBeVisible();
});

// ───────────────────────────────────────────────
// 5. Help page back button works
// ───────────────────────────────────────────────
test('help page back button navigates back', async ({ page }) => {
  await page.goto('/');
  // Wait for home page to load
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
  // Click the help/? button
  await page.locator('button[title*="use"], button[title*="help"]').first().click();
  await expect(page).toHaveURL('/help');
  await page.getByRole('button', { name: /Back/i }).click();
  await expect(page).toHaveURL('/');
});

// ───────────────────────────────────────────────
// 6. Generate & Save creates session and redirects
// ───────────────────────────────────────────────
test('generate & save creates a new session', async ({ page }) => {
  await page.goto('/new');

  const generateBtn = page.getByRole('button', { name: /Generate|Save/i });
  await expect(generateBtn).toBeVisible();
  await generateBtn.click();

  // Should navigate to /session/<id>
  await expect(page).toHaveURL(/\/session\//, { timeout: 10_000 });

  // Should see team names on the result page
  await expect(page.getByText('Team 1')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Team 2')).toBeVisible();
  await expect(page.getByText('Team 3')).toBeVisible();
});

// ───────────────────────────────────────────────
// 7. Result page – member names are visible
// ───────────────────────────────────────────────
test('result page shows member names from input', async ({ page }) => {
  await page.goto('/new');
  await page.getByRole('button', { name: /Generate|Save/i }).click();
  await expect(page).toHaveURL(/\/session\//, { timeout: 10_000 });

  // Check a few names from the defaults
  await expect(page.getByText('Ann L (Host)')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Raphael Lee')).toBeVisible();
  await expect(page.getByText('Bassam Nassim')).toBeVisible();
});

// ───────────────────────────────────────────────
// 8. Unknown routes redirect to home
// ───────────────────────────────────────────────
test('unknown routes redirect to home', async ({ page }) => {
  await page.goto('/this-does-not-exist');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
});

// ───────────────────────────────────────────────
// 9. Input page validation – empty textareas
// ───────────────────────────────────────────────
test('shows error when all textareas are empty', async ({ page }) => {
  await page.goto('/new');

  // Clear all 3 textareas
  const textareas = page.locator('textarea');
  for (let i = 0; i < 3; i++) {
    await textareas.nth(i).fill('');
  }

  await page.getByRole('button', { name: /Generate|Save/i }).click();
  await expect(page.getByText(/please paste/i)).toBeVisible();
});

// ───────────────────────────────────────────────
// 10. Input page player count updates
// ───────────────────────────────────────────────
test('player count updates when typing names', async ({ page }) => {
  await page.goto('/new');

  const firstTextarea = page.locator('textarea').first();
  await firstTextarea.fill('Alice\nBob\nCharlie');

  // Should show "3 players" below the first textarea
  await expect(page.getByText('3 players').first()).toBeVisible();
});
