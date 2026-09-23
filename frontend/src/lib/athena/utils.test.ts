import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatRelativeTime, generateId, getInitials, truncate } from './utils';

afterEach(() => {
  vi.useRealTimers();
});

describe('getInitials', () => {
  it('returns the first two initials, uppercased', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL');
  });

  it('returns a single initial for a single name', () => {
    expect(getInitials('Grace')).toBe('G');
  });

  it('handles empty strings', () => {
    expect(getInitials('')).toBe('');
  });
});

describe('truncate', () => {
  it('returns the string unchanged when short enough', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('truncates longer strings', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcde…');
  });
});

describe('formatRelativeTime', () => {
  it('formats minutes ago', () => {
    vi.setSystemTime(new Date('2026-01-01T00:05:00Z'));
    expect(formatRelativeTime('2026-01-01T00:00:00Z')).toBe('5m ago');
  });

  it('returns "Just now" for recent timestamps', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:30Z'));
    expect(formatRelativeTime('2026-01-01T00:00:00Z')).toBe('Just now');
  });

  it('formats hours and days', () => {
    vi.setSystemTime(new Date('2026-01-02T02:00:00Z'));
    expect(formatRelativeTime('2026-01-02T00:00:00Z')).toBe('2h ago');
    vi.setSystemTime(new Date('2026-01-03T00:00:00Z'));
    expect(formatRelativeTime('2026-01-01T00:00:00Z')).toBe('2d ago');
  });
});

describe('generateId', () => {
  it('produces non-empty unique ids', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe('');
    expect(a).not.toBe(b);
  });
});