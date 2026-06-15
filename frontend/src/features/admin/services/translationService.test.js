import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isTranslationConfigured, translateFields, translateTexts } from './translationService';

describe('translationService', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_TRANSLATE_PROXY_URL', 'https://proxy.test');
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reports configured when the proxy URL is set', () => {
    expect(isTranslationConfigured()).toBe(true);
  });

  it('throws NOT_CONFIGURED when the proxy URL is missing', async () => {
    vi.stubEnv('VITE_TRANSLATE_PROXY_URL', '');
    await expect(translateTexts(['hi'])).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
  });

  it('returns [] for empty input without calling the proxy', async () => {
    const out = await translateTexts([]);
    expect(out).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('batches non-empty fields into one request and maps results back', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { he: 'כותרת', en: 'Title', ar: 'عنوان' },
          { he: 'גוף', en: 'Body', ar: 'نص' },
        ],
      }),
    });

    const out = await translateFields({ title: 'כותרת', body: 'גוף', empty: '   ' }, ['title', 'body', 'empty']);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody.texts).toEqual(['כותרת', 'גוף']); // blank field skipped
    expect(out.title.en).toBe('Title');
    expect(out.body.ar).toBe('نص');
    expect(out.empty).toBeUndefined();
  });

  it('throws REQUEST_FAILED on a non-OK response', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 502 });
    await expect(translateTexts(['hi'])).rejects.toMatchObject({ code: 'REQUEST_FAILED' });
  });
});
