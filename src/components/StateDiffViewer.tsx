import React, { useState, useMemo } from "react";
import { AddressHashView } from "./AddressHashView.js";
import { ClearSignMessages } from "../i18n/messages.js";
import { useClearSignMessages } from "../i18n/context.js";
import styles from "../styles.module.css";

export interface StateDiffItem {
  key?: string | undefined;
  account?: string | undefined;
  asset?: string | undefined;
  tokenContractId?: string | undefined;
  delta?: string | undefined;
  formatted?: string | undefined;
  symbol?: string | undefined;
  type?: "create" | "update" | "delete" | "modify" | string | undefined;
  before?: unknown;
  after?: unknown;
  contract?: string | undefined;
}

export interface StateDiffViewerProps {
  entries: readonly StateDiffItem[];
  pageSize?: number | undefined;
  pageSizeOptions?: readonly number[] | undefined;
  messages?: Partial<ClearSignMessages> | undefined;
  className?: string | undefined;
  title?: string | undefined;
}

export const StateDiffViewer: React.FC<StateDiffViewerProps> = ({
  entries,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  messages,
  className,
  title,
}) => {
  const m = useClearSignMessages(messages);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  const totalEntries = entries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  // Keep page within bounds if entries/pageSize changes
  const activePage = Math.min(currentPage, totalPages);

  const paginatedEntries = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;
    return entries.slice(startIndex, startIndex + pageSize);
  }, [entries, activePage, pageSize]);

  if (totalEntries === 0) {
    return null;
  }

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div
      className={`${styles.diffViewer} ${className || ""}`}
      role="region"
      aria-label={title || m.sectionBalanceChanges}
    >
      <div className={styles.diffEntriesList}>
        {paginatedEntries.map((entry, index) => {
          const entryKey = entry.key || entry.account || `diff-${index}`;
          const isBalanceDelta = Boolean(entry.account || entry.delta);

          if (isBalanceDelta) {
            const deltaStr = String(entry.delta || "0");
            const isNegative = deltaStr.startsWith("-");
            return (
              <div
                key={entryKey}
                className={styles.balanceDelta}
                data-testid="diff-entry"
              >
                {entry.account && (
                  <AddressHashView
                    value={entry.account}
                    kind="address"
                    messages={messages}
                  />
                )}
                {entry.contract && (
                  <AddressHashView
                    value={entry.contract}
                    kind="address"
                    messages={messages}
                  />
                )}
                <span
                  className={
                    isNegative ? styles.balanceNegative : styles.balancePositive
                  }
                >
                  <span aria-hidden="true">{isNegative ? "" : "+"}</span>
                  {entry.formatted || entry.delta} {entry.symbol || "tokens"}
                </span>
              </div>
            );
          }

          // Generic storage / state diff
          return (
            <div
              key={entryKey}
              className={styles.stateDiffRow}
              data-testid="diff-entry"
            >
              <div className={styles.stateDiffHeader}>
                {entry.type && (
                  <span
                    className={`${styles.stateDiffTypeBadge} ${
                      entry.type === "delete"
                        ? styles.stateDiffTypeDelete
                        : entry.type === "create"
                          ? styles.stateDiffTypeCreate
                          : styles.stateDiffTypeModify
                    }`}
                  >
                    {entry.type}
                  </span>
                )}
                {entry.key && (
                  <AddressHashView
                    value={entry.key}
                    kind="hash"
                    messages={messages}
                  />
                )}
              </div>
              {(entry.before !== undefined || entry.after !== undefined) && (
                <div className={styles.stateDiffValues}>
                  {entry.before !== undefined && (
                    <div className={styles.stateDiffBefore}>
                      <span className={styles.stateDiffLabel}>Before:</span>{" "}
                      <code>{JSON.stringify(entry.before)}</code>
                    </div>
                  )}
                  {entry.after !== undefined && (
                    <div className={styles.stateDiffAfter}>
                      <span className={styles.stateDiffLabel}>After:</span>{" "}
                      <code>{JSON.stringify(entry.after)}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalEntries > pageSize && (
        <div className={styles.diffPagination}>
          <div className={styles.diffPaginationInfo} aria-live="polite">
            {m.diffPaginationStatus(activePage, totalPages, totalEntries)}
          </div>
          <div className={styles.diffPaginationControls}>
            <button
              type="button"
              className={styles.diffPaginationBtn}
              onClick={handlePrevPage}
              disabled={activePage <= 1}
              aria-label={m.diffPaginationPrevious}
            >
              {m.diffPaginationPrevious}
            </button>
            <span className={styles.diffPaginationCurrentPage}>
              {activePage} / {totalPages}
            </span>
            <button
              type="button"
              className={styles.diffPaginationBtn}
              onClick={handleNextPage}
              disabled={activePage >= totalPages}
              aria-label={m.diffPaginationNext}
            >
              {m.diffPaginationNext}
            </button>

            {pageSizeOptions.length > 1 && (
              <label className={styles.diffPageSizeSelector}>
                <span>{m.diffPageSizeLabel}</span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className={styles.diffPageSizeSelect}
                  aria-label={m.diffPageSizeLabel}
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
