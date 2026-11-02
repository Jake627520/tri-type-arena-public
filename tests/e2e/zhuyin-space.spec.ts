import { test, expect } from '@playwright/test';

test.describe('ZH-SPACE: Deterministic Zhuyin First-Tone Space Key E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Inject deterministic lessons for Zhuyin mode and mark onboarding completed
    await page.addInitScript(() => {
      localStorage.setItem('tritype.onboarding.v1.completed', 'yes');
      (window as any).__TRI_TYPE_TEST_MODE__ = true;
      (window as any).__TRI_TYPE_TEST_LESSONS__ = [
        {
          id: 'test-zh-noon',
          mode: 'zhuyin',
          display: '中午',
          answer: 'ㄓㄨㄥㄨˇ',
          hint: 'ㄓㄨㄥ ㄨˇ',
          difficulty: 'beginner',
        },
        {
          id: 'test-zh-phone',
          mode: 'zhuyin',
          display: '手機',
          answer: 'ㄕㄡˇㄐㄧ',
          hint: 'ㄕㄡˇ ㄐㄧ',
          difficulty: 'beginner',
        },
      ];
    });
  });

  test('ZH-SPACE-DETERMINISTIC: Test 中午 and 手機 with first-tone Space key', async ({ page }) => {
    await page.goto('/');

    // Switch to Zhuyin mode
    await page.getByRole('button', { name: /Zhuyin|繁[體体]注音/i }).click();

    // Start challenge
    await page.locator('#start').click();
    const typingInput = page.locator('#typing');
    await expect(typingInput).toBeFocused();

    const spaceKey = page.locator('#daqian-space-key');
    await expect(spaceKey).toBeVisible();

    const statsGrid = page.locator('.stats-grid');
    const wordDisplay = page.locator('#word');

    // ==========================================
    // 1. Test 「中午」: 5 → j → / → Space → j → 3
    // ==========================================
    await expect(wordDisplay).toHaveText('中午');

    // Type ㄓ (5)
    await page.keyboard.press('5');
    // Type ㄨ (j)
    await page.keyboard.press('j');
    // Type ㄥ (/)
    await page.keyboard.press('/');

    // Next expected character is Space (' ') for 1st tone of "中"
    // 4. Verify Space key highlight
    await expect(spaceKey).toHaveClass(/key-active/);

    // 5. Verify ␣ display
    const spaceCharSpan = page.locator('.target-characters .target-char-space').first();
    await expect(spaceCharSpan).toBeVisible();
    await expect(spaceCharSpan).toHaveText('␣');
    await expect(spaceCharSpan).toHaveClass(/char-current/);

    // 8. Verify without pressing Space, typing subsequent syllable key cannot complete early
    await page.keyboard.press('j'); // mistype next syllable before Space
    await expect(page.locator('#typing')).toHaveValue('ㄓㄨㄥㄨ');
    await expect(statsGrid).toHaveAttribute('data-words', '0');
    // Clear typo with Backspace
    await page.keyboard.press('Backspace');
    await expect(page.locator('#typing')).toHaveValue('ㄓㄨㄥ');

    // 6. Verify Space increases totalKeys and correctKeys
    const totalKeysBeforeSpace1 = Number(await statsGrid.getAttribute('data-total-keys'));
    const correctKeysBeforeSpace1 = Number(await statsGrid.getAttribute('data-correct-keys'));

    // Press Space
    await page.keyboard.press('Space');

    const totalKeysAfterSpace1 = Number(await statsGrid.getAttribute('data-total-keys'));
    const correctKeysAfterSpace1 = Number(await statsGrid.getAttribute('data-correct-keys'));
    expect(totalKeysAfterSpace1).toBe(totalKeysBeforeSpace1 + 1);
    expect(correctKeysAfterSpace1).toBe(correctKeysBeforeSpace1 + 1);

    // Space key should no longer be active since next expected is ㄨ (j)
    await expect(spaceKey).not.toHaveClass(/key-active/);

    // Type second syllable "午": ㄨ (j) → ˇ (3)
    await page.keyboard.press('j');
    await page.keyboard.press('3');

    // 7. Verify words +1 after completion of "中午"
    await expect(statsGrid).toHaveAttribute('data-words', '1');

    // ==========================================
    // 2. Test 「手機」: g → . → 3 → r → u → Space
    // ==========================================
    await expect(wordDisplay).toHaveText('手機');

    // Type "手": ㄕ (g) → ㄡ (.) → ˇ (3)
    await page.keyboard.press('g');
    await page.keyboard.press('.');
    await page.keyboard.press('3');

    // Type "機" onset & rhyme: ㄐ (r) → ㄧ (u)
    await page.keyboard.press('r');
    await page.keyboard.press('u');

    // 3 & 8. Verify without pressing Space at the end, it cannot complete early
    await expect(statsGrid).toHaveAttribute('data-words', '1');
    await expect(wordDisplay).toHaveText('手機');

    // Verify Space key is highlighted for the final 1st tone of "機"
    await expect(spaceKey).toHaveClass(/key-active/);

    // Verify visual ␣
    const spaceCharSpanPhone = page.locator('.target-characters .target-char-space').first();
    await expect(spaceCharSpanPhone).toBeVisible();
    await expect(spaceCharSpanPhone).toHaveText('␣');
    await expect(spaceCharSpanPhone).toHaveClass(/char-current/);

    const totalKeysBeforeSpace2 = Number(await statsGrid.getAttribute('data-total-keys'));
    const correctKeysBeforeSpace2 = Number(await statsGrid.getAttribute('data-correct-keys'));

    // Press final Space to complete "手機"
    await page.keyboard.press('Space');

    const totalKeysAfterSpace2 = Number(await statsGrid.getAttribute('data-total-keys'));
    const correctKeysAfterSpace2 = Number(await statsGrid.getAttribute('data-correct-keys'));
    expect(totalKeysAfterSpace2).toBe(totalKeysBeforeSpace2 + 1);
    expect(correctKeysAfterSpace2).toBe(correctKeysBeforeSpace2 + 1);

    // Verify words is now 2
    await expect(statsGrid).toHaveAttribute('data-words', '2');
  });

  test('ZH-SPACE-GUIDANCE: First-tone space badge and virtual keyboard presence', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Zhuyin|繁[體体]注音/i }).click();
    await page.locator('#start').click();

    // Verify spacebar exists and guidance hint badge is displayed
    const spaceKey = page.locator('#daqian-space-key');
    await expect(spaceKey).toBeVisible();

    const spaceHint = page.locator('#zhuyin-space-hint');
    await expect(spaceHint).toBeVisible();
    await expect(spaceHint).toContainText(/Space|空白/);
  });
});
