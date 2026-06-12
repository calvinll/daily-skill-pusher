import { describe, expect, it } from 'vitest';

import { createFeishuSignature } from '../../src/utils/crypto.js';
import { ensureKeyword, isFeishuPlaceholderWebhook } from '../../src/utils/feishu.js';

describe('feishu utils', () => {
  it('detects placeholder webhook', () => {
    expect(isFeishuPlaceholderWebhook('https://open.feishu.cn/open-apis/bot/v2/hook/replace-me')).toBe(true);
    expect(isFeishuPlaceholderWebhook('https://open.feishu.cn/open-apis/bot/v2/hook/abc')).toBe(false);
  });

  it('adds keyword when missing', () => {
    expect(ensureKeyword('正文', '技能')).toBe('[技能]\n正文');
    expect(ensureKeyword('[技能]\n正文', '技能')).toBe('[技能]\n正文');
  });

  it('creates deterministic signature', () => {
    expect(createFeishuSignature('1719999000', 'top-secret')).toBe('FY1BPbBKdLjjzHZVScR6wUMCPI/1x6SSD6lBLs67VmQ=');
  });
});
