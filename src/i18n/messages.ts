export interface ClearSignMessages {
  // Modal Header & Status
  modalTitle: string;
  decodingPreview: string;

  // Actions
  reject: string;
  approve: string;
  close: string;
  signing: string;
  copy: string;
  copyXdr: string;
  hideRawXdr: string;
  showRawXdr: string;
  hide: string;
  reveal: string;

  // Risk Banners
  riskBlocked: string;
  riskReview: string;
  riskOk: string;
  riskUnknown: string;
  statusSuccess: string;

  // Announcements (aria-live)
  announcementDecoding: string;
  announcementReady: string;
  announcementReview: string;
  announcementBlocked: string;
  announcementPending: string;
  announcementError: (errorMessage?: string) => string;
  announcementSuccess: string;
  announcementUpdated: string;

  // Section Titles
  sectionSummary: string;
  sectionBalanceChanges: string;
  sectionCallDetails: string;
  sectionAuthorizations: string;
  sectionNetwork: string;
  sectionFees: string;
  sectionWarnings: string;

  // Details Labels
  contractLabel: string;
  functionLabel: string;
  credentialsLabel: string;
  subInvocationsLabel: string;
  networkVerified: string;
  networkNotVerified: string;
  declaredFeeLabel: string;
  simulatedResourceFeeLabel: string;
  simulationStatusLabel: string;
  simulationErrorLabel: string;

  // Warnings
  warningsBlockedTitle: (count: number) => string;
  warningsReviewTitle: (count: number) => string;
  warningsInfoTitle: (count: number) => string;
  warningDocsLink: string;
  warningDocsAriaLabel: (code: string) => string;
  defaultWarningExplanation: string;
  reviewCheckboxLabel: string;

  // Authorization Tree
  authTreeAriaLabel: string;
  authTreeArgsAriaLabel: string;
  collapseSubInvocations: string;
  expandSubInvocations: string;
  hideFullContract: string;
  revealFullContract: string;
  hideFullArgValue: (argName?: string) => string;
  revealFullArgValue: (argName?: string) => string;

  // Value Display
  copyAddressAriaLabel: string;
  copyContractAriaLabel: string;
  revealFullAddress: string;
  hideFullAddress: string;
  revealFullValue: string;
  hideFullValue: string;
  copyValueAriaLabel: string;
  copied: string;
  truncatedBadge: string;
  sanitizedBadge: string;
  sanitizedTooltip: string;
  bytesFormatted: (length: number, truncated?: boolean) => string;
  emptyMap: string;
  optionNone: string;
  optionSomePrefix: string;
  timepointLabel: string;
  durationLabel: string;
  undecodedLabel: (scvalType?: string) => string;
  complexValue: string;

  // Raw Tab & Verification
  tabDetails: string;
  tabRaw: string;
  rawXdrTitle: string;
  rawJsonTitle: string;
  copyJson: string;
  copiedJson: string;
  copiedXdr: string;

  // State Diffs & Pagination
  sectionStateDiffs: string;
  diffPaginationPrevious: string;
  diffPaginationNext: string;
  diffPaginationStatus: (
    currentPage: number,
    totalPages: number,
    totalEntries: number,
  ) => string;
  diffPageSizeLabel: string;
}

export const DEFAULT_MESSAGES: ClearSignMessages = {
  // Modal Header & Status
  modalTitle: "Transaction Preview",
  decodingPreview: "Decoding and simulating the transaction…",

  // Actions
  reject: "Reject",
  approve: "Approve",
  close: "Close",
  signing: "Signing...",
  copy: "Copy",
  copyXdr: "Copy XDR",
  hideRawXdr: "Hide Raw XDR",
  showRawXdr: "Show Raw XDR",
  hide: "Hide",
  reveal: "Reveal",

  // Risk Banners
  riskBlocked: "Signing blocked",
  riskReview: "Review carefully",
  riskOk: "Decoded and verified",
  riskUnknown: "Unknown risk",
  statusSuccess: "Transaction Signed",

  // Announcements
  announcementDecoding: "Decoding transaction preview...",
  announcementReady: "Transaction preview ready. Decoded and verified.",
  announcementReview: "Transaction requires review: warnings detected.",
  announcementBlocked: "Transaction signing blocked: high risk detected.",
  announcementPending: "Transaction signature pending...",
  announcementError: (errorMessage?: string) =>
    `Error: ${errorMessage || "Unable to verify transaction."}`,
  announcementSuccess: "Transaction signed successfully.",
  announcementUpdated: "Transaction preview updated.",

  // Section Titles
  sectionSummary: "Summary",
  sectionBalanceChanges: "Balance Changes",
  sectionCallDetails: "Call Details",
  sectionAuthorizations: "Authorizations",
  sectionNetwork: "Network",
  sectionFees: "Fees",
  sectionWarnings: "Warnings",

  // Details Labels
  contractLabel: "Contract:",
  functionLabel: "Function:",
  credentialsLabel: "Credentials:",
  subInvocationsLabel: "Sub-invocations:",
  networkVerified: "Network verified against the RPC",
  networkNotVerified: "Network not verified",
  declaredFeeLabel: "Declared Fee:",
  simulatedResourceFeeLabel: "Simulated Resource Fee:",
  simulationStatusLabel: "Simulation:",
  simulationErrorLabel: "Simulation error:",

  // Warnings
  warningsBlockedTitle: (count: number) => `Blocked (${count})`,
  warningsReviewTitle: (count: number) => `Review Required (${count})`,
  warningsInfoTitle: (count: number) => `Informational (${count})`,
  warningDocsLink: "Docs ↗",
  warningDocsAriaLabel: (code: string) => `Docs: ${code} documentation`,
  defaultWarningExplanation:
    "No additional explanation available for this warning.",
  reviewCheckboxLabel: "I have reviewed the warnings",

  // Authorization Tree
  authTreeAriaLabel: "Authorization Tree",
  authTreeArgsAriaLabel: "Decoded arguments",
  collapseSubInvocations: "Collapse sub-invocations",
  expandSubInvocations: "Expand sub-invocations",
  hideFullContract: "Hide full contract address",
  revealFullContract: "Reveal full contract address",
  hideFullArgValue: (argName?: string) =>
    `Hide full value for ${argName || "argument"}`,
  revealFullArgValue: (argName?: string) =>
    `Reveal full value for ${argName || "argument"}`,

  // Value Display
  copyAddressAriaLabel: "Copy address",
  copyContractAriaLabel: "Copy contract address",
  revealFullAddress: "Reveal full address",
  hideFullAddress: "Hide full address",
  revealFullValue: "Reveal full value",
  hideFullValue: "Hide full value",
  copyValueAriaLabel: "Copy full value",
  copied: "Copied!",
  truncatedBadge: "(truncated)",
  sanitizedBadge: "(sanitized)",
  sanitizedTooltip: "Hidden or control characters were removed",
  bytesFormatted: (length: number, truncated?: boolean) =>
    `(${length} bytes${truncated ? ", truncated" : ""})`,
  emptyMap: "Empty map",
  optionNone: "None",
  optionSomePrefix: "Some(",
  timepointLabel: "Timepoint",
  durationLabel: "Duration",
  undecodedLabel: (scvalType?: string) =>
    `Undecoded ${scvalType || ""} value (raw XDR available below)`,
  complexValue: "Complex value",

  // Raw Tab & Verification
  tabDetails: "Details",
  tabRaw: "Raw",
  rawXdrTitle: "Transaction Envelope (XDR Base64)",
  rawJsonTitle: "Decoded Transaction (JSON)",
  copyJson: "Copy JSON",
  copiedJson: "Copied JSON!",
  copiedXdr: "Copied XDR!",

  // State Diffs & Pagination
  sectionStateDiffs: "State Modifications",
  diffPaginationPrevious: "Previous",
  diffPaginationNext: "Next",
  diffPaginationStatus: (
    currentPage: number,
    totalPages: number,
    totalEntries: number,
  ) => `Page ${currentPage} of ${totalPages} (${totalEntries} entries)`,
  diffPageSizeLabel: "Per page:",
};

const PSEUDO_MAP: Record<string, string> = {
  a: "ȧ",
  b: "ƀ",
  c: "ƈ",
  d: "ḓ",
  e: "ḗ",
  f: "ƒ",
  g: "ɠ",
  h: "ħ",
  i: "ī",
  j: "ĵ",
  k: "ķ",
  l: "ŀ",
  m: "ḿ",
  n: "ƞ",
  o: "ǿ",
  p: "ƥ",
  q: "ʠ",
  r: "ř",
  s: "ṡ",
  t: "ṫ",
  u: "ŭ",
  v: "ṽ",
  w: "ẇ",
  x: "ẋ",
  y: "ẏ",
  z: "ẑ",
  A: "Ȧ",
  B: "Ɓ",
  C: "Ƈ",
  D: "Ḓ",
  E: "Ḗ",
  F: "Ƒ",
  G: "Ɠ",
  H: "Ħ",
  I: "Ī",
  J: "Ĵ",
  K: "Ķ",
  L: "Ŀ",
  M: "Ḿ",
  N: "Ƞ",
  O: "Ǿ",
  P: "Ƥ",
  Q: "Ǫ",
  R: "Ř",
  S: "Ṡ",
  T: "Ṫ",
  U: "Ŭ",
  V: "Ṽ",
  W: "Ẇ",
  X: "Ẋ",
  Y: "Ẏ",
  Z: "Ẑ",
};

/**
 * Transforms an English text string into a pseudo-localized string with extended characters.
 * Enclosed with [!! ... !!] to easily verify string localization boundaries.
 */
export function pseudoLocalizeString(input: string): string {
  const transformed = input
    .split("")
    .map((char) => PSEUDO_MAP[char] || char)
    .join("");
  return `[!! ${transformed} !!]`;
}

/**
 * Generates a full pseudo-localized messages object from DEFAULT_MESSAGES.
 */
export function createPseudoLocalizedMessages(): ClearSignMessages {
  const pseudo: Partial<ClearSignMessages> = {};

  for (const [key, val] of Object.entries(DEFAULT_MESSAGES)) {
    if (typeof val === "string") {
      (pseudo as Record<string, unknown>)[key] = pseudoLocalizeString(val);
    } else if (typeof val === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pseudo as Record<string, unknown>)[key] = (...args: any[]) => {
        const res = (val as (...a: unknown[]) => string)(...args);
        return pseudoLocalizeString(res);
      };
    }
  }

  return pseudo as ClearSignMessages;
}
