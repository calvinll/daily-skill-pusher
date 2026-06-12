import { afterEach, describe, expect, it, vi } from 'vitest';

import { FeishuAdapter } from '../../src/channels/feishu.adapter.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FeishuAdapter', () => {
  it('sends interactive card with keyword and signing fields when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: 0, msg: 'success' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(Date, 'now').mockReturnValue(1_719_999_000_000);

    const adapter = new FeishuAdapter({
      enabled: true,
      webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
      botSecret: 'top-secret',
      requiredKeyword: '技能',
    });

    const result = await adapter.send({
      title: '今日精选',
      previewText: '这是正文',
      feishuCard: {
        header: {
          title: {
            tag: 'plain_text',
            content: '今日精选',
          },
        },
        elements: [],
      },
    });

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(requestInit.body));

    expect(body.msg_type).toBe('interactive');
    expect(body.card.header.title.content).toContain('[技能]');
    expect(body.timestamp).toBe('1719999000');
    expect(body.sign).toBeTypeOf('string');
  });

  it('treats feishu business errors as failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ code: 19024, msg: 'Key Words Not Found' }),
      }),
    );

    const adapter = new FeishuAdapter({
      enabled: true,
      webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
    });

    const result = await adapter.send({
      title: '今日精选',
      previewText: '这是正文',
      feishuCard: {
        header: {
          title: {
            tag: 'plain_text',
            content: '今日精选',
          },
        },
        elements: [],
      },
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('Key Words Not Found');
  });
});
