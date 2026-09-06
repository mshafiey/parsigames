import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendMagicLinkEmail } from '../src/lib/email';

describe('sendMagicLinkEmail', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to the Resend API with the expected body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'abc' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await sendMagicLinkEmail('re_test_key', 'sara@example.com', 'https://parsigames.org/auth/magic-verify?token=xyz');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer re_test_key');
    const body = JSON.parse(options.body);
    expect(body.to).toEqual(['sara@example.com']);
    expect(body.html).toContain('https://parsigames.org/auth/magic-verify?token=xyz');
  });

  it('throws if the Resend API responds with a non-2xx status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad request', { status: 400 })));
    await expect(
      sendMagicLinkEmail('re_test_key', 'sara@example.com', 'https://parsigames.org/auth/magic-verify?token=xyz')
    ).rejects.toThrow();
  });
});
