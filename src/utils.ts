export function shortenAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text).catch(() => {});
};
