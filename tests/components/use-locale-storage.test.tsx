import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLocale } from '../../src/i18n/useLocale';

describe('useLocale with restricted storage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses the browser language and permits changing locale when accessing storage throws', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-CN');
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError');
    });

    const { result } = renderHook(() => useLocale());
    expect(result.current.locale).toBe('zh-CN');
    act(() => result.current.setLocale('en'));
    expect(result.current.locale).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
