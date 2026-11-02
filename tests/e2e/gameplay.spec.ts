import { test, expect } from '@playwright/test';

/** Pre-seed localStorage to skip the onboarding guide in gameplay tests */
async function skipOnboarding(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
  });
}

test.describe('TriType Arena — End-to-End E2E Suite', () => {
  test('E2E-001: complete English gameplay flow', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('TriType');
    const startBtn = page.locator('#start');
    await expect(startBtn).toBeVisible();

    await startBtn.click();
    const typingInput = page.locator('#typing');
    await expect(typingInput).toBeFocused();

    // Type active target word
    const targetChars = await page.locator('.target-characters .target-char').allInnerTexts();
    await typingInput.pressSequentially(targetChars.join(''), { delay: 50 });

    // Word count should increment to 1
    await expect(page.locator('.stat-box').filter({ hasText: /Completed Words|完成詞數/ }).locator('strong')).toHaveText('1');
  });

  test('E2E-002: Simplified Pinyin gameplay flow', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');

    // Switch to Pinyin
    await page.getByRole('button', { name: /Hanyu Pinyin|簡[體体]拼音/i }).click();
    await expect(page.locator('#word')).not.toBeEmpty();

    await page.locator('#start').click();
    const typingInput = page.locator('#typing');

    // Type active pinyin word
    const targetChars = await page.locator('.target-characters .target-char').allInnerTexts();
    await typingInput.pressSequentially(targetChars.join(''), { delay: 50 });
    await expect(page.locator('.stat-box').filter({ hasText: /Completed Words|完成詞數/ }).locator('strong')).toHaveText('1');
  });

  test('E2E-003: Traditional Zhuyin Daqian layout and key highlighting', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');

    // Switch to Zhuyin
    await page.getByRole('button', { name: /Zhuyin|繁[體体]注音/i }).click();
    await expect(page.locator('#word')).not.toBeEmpty();

    // Daqian keyboard must be visible
    const keyboard = page.locator('.keyboard-container');
    await expect(keyboard).toBeVisible();

    await page.locator('#start').click();
    const typingInput = page.locator('#typing');

    // In Daqian, the first character's key is active on the keyboard
    const activeKey = page.locator('.key-cap.key-active');
    await expect(activeKey).toBeVisible();
    const latinKey = (await activeKey.locator('.key-latin').innerText()).toLowerCase();
    const zhuyinSymbol = await activeKey.locator('.key-zhuyin').innerText();
    await typingInput.press(latinKey);
    await expect(typingInput).toHaveValue(zhuyinSymbol);
  });

  test('E2E-004: Anti-cheat paste prevention', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');
    await page.locator('#start').click();

    const typingInput = page.locator('#typing');
    // Simulate paste event
    await typingInput.evaluate((el) => {
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: { getData: () => 'keyboard practice challenge' },
      });
      el.dispatchEvent(pasteEvent);
    });

    // Value must remain empty (paste rejected)
    await expect(typingInput).toHaveValue('');
  });

  test('E2E-005: Pause and resume session', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');
    await page.locator('#start').click();

    const typingInput = page.locator('#typing');
    await typingInput.press('Escape');

    await expect(page.locator('.status-text')).toContainText(/(SESSION PAUSED|練習已暫停)/);
    await expect(typingInput).toBeDisabled();

    // Click resume
    await page.getByRole('button', { name: /Resume|繼續挑戰/i }).click();
    await expect(page.locator('.status-text')).toContainText(/(LIVE CHALLENGE|挑戰進行中)/);
    await expect(typingInput).toBeEnabled();
  });

  test('E2E-006: Responsive mobile viewport check', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('.hero-heading')).toBeVisible();
    await expect(page.locator('.mode-selector')).toBeVisible();
    await expect(page.locator('.typing-arena')).toBeVisible();
  });

  // ── V0.3 i18n & Onboarding E2E ────────────────────────────────────────────

  test('E2E-007: locale selector switches to English UI', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');

    // Default should be either zh-TW or en depending on navigator
    const localeSelect = page.locator('#ui-locale');
    await expect(localeSelect).toBeVisible();

    // Switch to English
    await localeSelect.selectOption('en');
    await expect(page.locator('.brand-subtitle')).toContainText('Tri-language Typing Arena');
  });

  test('E2E-008: locale selector switches to Simplified Chinese', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');

    await page.locator('#ui-locale').selectOption('zh-CN');
    await expect(page.locator('.brand-subtitle')).toContainText('中英打字竞技场');
  });

  test('E2E-009: onboarding dialog shows on first visit', async ({ page }) => {
    // Do NOT skip onboarding — fresh localStorage
    await page.goto('/');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Skip button dismisses dialog
    await page.getByRole('button', { name: /跳過|Skip/i }).first().click();
    await expect(dialog).not.toBeVisible();
  });

  test('E2E-010: onboarding guide can be navigated step by step', async ({ page }) => {
    await page.goto('/');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Step 1 → 2
    await page.getByRole('button', { name: /下一步|Next/i }).click();
    await expect(dialog.locator('[aria-live]')).toContainText('2/3');

    // Step 2 → 3
    await page.getByRole('button', { name: /下一步|Next/i }).click();
    await expect(dialog.locator('[aria-live]')).toContainText('3/3');

    // Finish
    await page.getByRole('button', { name: /開始使用|Start playing/i }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('E2E-011: reopen guide button appears after guide dismissed', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /跳過|Skip/i }).first().click();
    const reopenBtn = page.locator('#onboarding-reopen-btn');
    await expect(reopenBtn).toBeVisible();

    // Click reopen
    await reopenBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
