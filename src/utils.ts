export function shortenAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text).catch(() => {});
};

/** Returns warnings with blocking ones first, otherwise keeping their original order. */
export function orderWarnings<T extends { severity: 'review' | 'blocked' }>(warnings: readonly T[]): T[] {
  return [
    ...warnings.filter((w) => w.severity === 'blocked'),
    ...warnings.filter((w) => w.severity !== 'blocked'),
  ];
}
