import { test, expect } from '@playwright/test';

test.describe('GAME-INPUT: Browser Real Keyboard & Focus Suite', () => {
  test('E2E-INPUT-001: mouse click on start automatically focuses #typing and receives keyboard input', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    });
    await page.goto('/');

    const startBtn = page.locator('#start');
    await expect(startBtn).toBeVisible();

    // Click start with mouse
    await startBtn.click();

    const typingInput = page.locator('#typing');
    // Ensure document.activeElement is the input
    await expect(typingInput).toBeFocused();

    // Type on keyboard directly without calling typingInput.focus()
    await page.keyboard.press('k');
    await expect(typingInput).toHaveValue('k');

    await page.keyboard.press('e');
    await expect(typingInput).toHaveValue('ke');
  });

  test('E2E-INPUT-002: Daqian Zhuyin physical key K types ㄜ into input', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    });
    await page.goto('/');

    // Switch to Zhuyin
    await page.getByRole('button', { name: /Zhuyin|繁[體体]注音/i }).click();

    // Start challenge
    await page.locator('#start').click();

    const typingInput = page.locator('#typing');
    await expect(typingInput).toBeFocused();

    // Press physical key K
    await page.keyboard.press('KeyK');
    await expect(typingInput).toHaveValue('ㄜ');
  });

  test('E2E-INPUT-003: Restart flow maintains focus and accepts typing on second round', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    });
    await page.goto('/');

    await page.locator('#start').click();
    const typingInput = page.locator('#typing');
    await expect(typingInput).toBeFocused();

    await page.keyboard.press('k');
    await expect(typingInput).toHaveValue('k');

    // Click abandon / restart
    const restartBtn = page.locator('#restart');
    await restartBtn.click();

    const startBtn = page.locator('#start');
    await expect(startBtn).toBeVisible();

    // Start again
    await startBtn.click();
    await expect(typingInput).toBeFocused();

    await page.keyboard.press('k');
    await expect(typingInput).toHaveValue('k');
  });

  test('E2E-INPUT-004: Clicking anywhere on typing arena refocuses input when running', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    });
    await page.goto('/');

    await page.locator('#start').click();
    const typingInput = page.locator('#typing');
    await expect(typingInput).toBeFocused();

    // User clicks the target display card
    await page.locator('#word').click();

    // Should still accept keypress and focus input
    await page.keyboard.press('k');
    await expect(typingInput).toHaveValue('k');
  });

  test('E2E-HARDEN-001: Enter key in idle state starts challenge once and focuses input', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    });
    await page.goto('/');

    const typingInput = page.locator('#typing');
    // Focus typing input while idle and press Enter
    await typingInput.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.status-running')).toBeVisible();
    await expect(typingInput).toBeFocused();
    await expect(typingInput).toBeEnabled();
  });

  test('E2E-HARDEN-002: Zhuyin mode produces single ㄜ for physical KeyK', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    });
    await page.goto('/');

    await page.getByRole('button', { name: /Zhuyin|繁[體体]注音/i }).click();
    await page.locator('#start').click();

    const typingInput = page.locator('#typing');
    await expect(typingInput).toBeFocused();

    await page.keyboard.press('KeyK');
    await expect(typingInput).toHaveValue('ㄜ');
  });

  test('E2E-HARDEN-003: Escape pause and Space resume execute reliably without duplication', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
    });
    await page.goto('/');

    await page.locator('#start').click();
    const typingInput = page.locator('#typing');
    await expect(typingInput).toBeFocused();

    // Pause via Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('.status-paused')).toBeVisible();
    await expect(typingInput).toBeDisabled();

    // Resume via Space
    await page.keyboard.press('Space');
    await expect(page.locator('.status-running')).toBeVisible();
    await expect(typingInput).toBeEnabled();
    await expect(typingInput).toBeFocused();
  });
});
