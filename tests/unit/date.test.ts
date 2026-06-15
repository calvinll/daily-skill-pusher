import { describe, expect, it } from 'vitest';

import { getLocalWeekday } from '../../src/utils/date.js';

describe('getLocalWeekday', () => {
  it('returns weekday in configured timezone', () => {
    const result = getLocalWeekday(new Date('2026-06-15T01:00:00.000Z'), 'Asia/Shanghai');
    expect(result).toBe('monday');
  });
});
