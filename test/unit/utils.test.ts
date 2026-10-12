import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleCopy, orderWarnings, shortenAddress } from '../../src/utils.js';

describe('shortenAddress', () => {
  it('abbreviates long addresses', () => {
    expect(shortenAddress('GABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe('GABC...WXYZ');
  });

  it('leaves short values untouched', () => {
    expect(shortenAddress('GA23')).toBe('GA23');
    expect(shortenAddress('12345678901')).toBe('12345678901');
  });

  it('abbreviates at exactly twelve characters', () => {
    expect(shortenAddress('123456789012')).toBe('1234...9012');
  });

  it('returns empty input as is', () => {
    expect(shortenAddress('')).toBe('');
  });
});

describe('orderWarnings', () => {
  const w = (code: string, severity: 'review' | 'blocked') => ({ code, severity });

  it('puts blocked warnings first and keeps relative order', () => {
    const out = orderWarnings([w('a', 'review'), w('b', 'blocked'), w('c', 'review'), w('d', 'blocked')]);
    expect(out.map((x) => x.code)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('does not mutate its input', () => {
    const input = [w('a', 'review'), w('b', 'blocked')];
    orderWarnings(input);
    expect(input.map((x) => x.code)).toEqual(['a', 'b']);
  });

  it('handles an empty list', () => {
    expect(orderWarnings([])).toEqual([]);
  });
});

describe('handleCopy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the text to the clipboard', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    handleCopy('GABC');

    expect(writeText).toHaveBeenCalledWith('GABC');
  });

  it('swallows clipboard failures', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });

    expect(() => handleCopy('GABC')).not.toThrow();
    await Promise.resolve();
  });
});
