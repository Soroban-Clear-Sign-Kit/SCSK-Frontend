import React, { useState } from "react";
import { formatGroupedMonospace, handleCopy } from "../utils.js";
import { ClearSignMessages } from "../i18n/messages.js";
import { useClearSignMessages } from "../i18n/context.js";
import styles from "../styles.module.css";

export interface AddressHashViewProps {
  value: string;
  prefixLength?: number | undefined;
  suffixLength?: number | undefined;
  chunkSize?: number | undefined;
  copyable?: boolean | undefined;
  defaultExpanded?: boolean | undefined;
  messages?: Partial<ClearSignMessages> | undefined;
  className?: string | undefined;
  mono?: boolean | undefined;
  kind?: "address" | "hash" | "hex" | "value" | undefined;
}

export const AddressHashView: React.FC<AddressHashViewProps> = ({
  value,
  prefixLength = 4,
  suffixLength = 4,
  chunkSize = 4,
  copyable = true,
  defaultExpanded = false,
  messages,
  className,
  mono = true,
  kind = "address",
}) => {
  const m = useClearSignMessages(messages);
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [copied, setCopied] = useState<boolean>(false);

  if (!value) {
    return null;
  }

  const isAddress = kind === "address";
  const revealLabel = isAddress ? m.revealFullAddress : m.revealFullValue;
  const hideLabel = isAddress ? m.hideFullAddress : m.hideFullValue;
  const copyLabel = isAddress ? m.copyAddressAriaLabel : m.copyValueAriaLabel;

  const shouldTruncate = value.length > prefixLength + suffixLength + 3;
  const truncatedDisplay = shouldTruncate
    ? `${value.slice(0, prefixLength)}...${value.slice(-suffixLength)}`
    : value;

  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCopy(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  return (
    <span
      className={`${styles.addressHashContainer} ${mono ? styles.addressHashMono : ""} ${className || ""}`}
    >
      {!isExpanded ? (
        <span className={styles.addressHashCollapsed} title={value}>
          <span className={styles.addressHashText}>{truncatedDisplay}</span>
          {shouldTruncate && (
            <button
              type="button"
              className={styles.addressHashExpandBtn}
              onClick={toggleExpand}
              aria-label={revealLabel}
              aria-expanded={false}
              title={revealLabel}
            >
              <span aria-hidden="true">↔</span>
            </button>
          )}
        </span>
      ) : (
        <span className={styles.addressHashExpanded}>
          <code className={styles.addressHashGrouped}>
            {formatGroupedMonospace(value, chunkSize)}
          </code>
          {shouldTruncate && (
            <button
              type="button"
              className={styles.addressHashExpandBtn}
              onClick={toggleExpand}
              aria-label={hideLabel}
              aria-expanded={true}
              title={hideLabel}
            >
              <span aria-hidden="true">↩</span>
            </button>
          )}
        </span>
      )}

      {copyable && (
        <button
          type="button"
          className={styles.addressHashCopyBtn}
          onClick={onCopy}
          aria-label={copyLabel}
          title={copyLabel}
        >
          {copied ? m.copied : m.copy}
        </button>
      )}
    </span>
  );
};
