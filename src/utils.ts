export function shortenAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

/**
 * Formats a string (e.g. address, public key, transaction hash, hex) into monospace groups.
 * Default chunk size is 4 characters (e.g., "GABC DEFG HIJK...").
 */
export function formatGroupedMonospace(value: string, chunkSize = 4): string {
  if (!value) return "";
  const cleaned = value.replace(/\s+/g, "");
  if (cleaned.length <= chunkSize) return cleaned;
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length; i += chunkSize) {
    chunks.push(cleaned.slice(i, i + chunkSize));
  }
  return chunks.join(" ");
}

export const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text).catch(() => {});
};

/** Returns warnings with blocking ones first, otherwise keeping their original order. */
export function orderWarnings<T extends { severity: "review" | "blocked" }>(
  warnings: readonly T[],
): T[] {
  return [
    ...warnings.filter((w) => w.severity === "blocked"),
    ...warnings.filter((w) => w.severity !== "blocked"),
  ];
}
