import React from "react";
import styles from "../styles.module.css";

export type WarningSeverity = "blocked" | "review" | "info";

export interface WarningViewModel {
  code: string;
  severity: WarningSeverity;
  title: string;
  explanation: string;
  docsUrl?: string;
}

export interface GroupedWarnings {
  blocked: WarningViewModel[];
  review: WarningViewModel[];
  info: WarningViewModel[];
}

const ShieldAlertIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const AlertTriangleIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/**
 * Maps whatever warning shape the package receives onto the local WarningViewModel
 */
export function mapToWarningViewModel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- handles arbitrary backend/external warnings
  raw: any,
): WarningViewModel {
  const code = String(raw?.code || "UNKNOWN_WARNING");
  const rawSev = String(raw?.severity || "").toLowerCase();

  const severity: WarningSeverity =
    rawSev === "blocked" ? "blocked" : rawSev === "info" ? "info" : "review";

  const title =
    raw?.title ||
    code
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const explanation =
    raw?.explanation ||
    raw?.message ||
    "No additional explanation available for this warning.";

  const docsUrl =
    raw?.docsUrl || `https://docs.clearsign.io/warnings/${code.toLowerCase()}`;

  return {
    code,
    severity,
    title,
    explanation,
    docsUrl,
  };
}

/**
 * Groups warnings by severity for structured display
 */
export function groupWarningsBySeverity(
  warnings: WarningViewModel[],
): GroupedWarnings {
  const grouped: GroupedWarnings = {
    blocked: [],
    review: [],
    info: [],
  };

  for (const w of warnings) {
    if (w.severity === "blocked") {
      grouped.blocked.push(w);
    } else if (w.severity === "info") {
      grouped.info.push(w);
    } else {
      grouped.review.push(w);
    }
  }

  return grouped;
}

export interface WarningListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warnings: Array<WarningViewModel | any>;
  className?: string;
}

export const WarningList: React.FC<WarningListProps> = ({
  warnings,
  className = "",
}) => {
  if (!warnings || warnings.length === 0) return null;

  const normalizedWarnings: WarningViewModel[] = warnings.map((w) =>
    "title" in w && "explanation" in w ? w : mapToWarningViewModel(w),
  );

  const grouped = groupWarningsBySeverity(normalizedWarnings);

  const renderItem = (w: WarningViewModel, key: string | number) => {
    const isBlocked = w.severity === "blocked";
    const isInfo = w.severity === "info";

    return (
      <div
        key={key}
        className={`${styles.warningItem} ${
          isBlocked
            ? styles.warningBlocked
            : isInfo
              ? styles.warningInfo
              : styles.warningReview
        }`}
        role="alert"
      >
        <div className={styles.warningTitleRow}>
          <div className={styles.warningCodeTitle}>
            <span className={styles.riskIcon} aria-hidden="true">
              {isBlocked ? (
                <ShieldAlertIcon />
              ) : isInfo ? (
                <InfoIcon />
              ) : (
                <AlertTriangleIcon />
              )}
            </span>
            <strong>{w.code}</strong>
            {w.title && w.title !== w.code && <span>— {w.title}</span>}
          </div>

          {w.docsUrl && (
            <a
              href={w.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.warningDocsLink}
              aria-label={`Docs: ${w.code} documentation`}
            >
              Docs ↗
            </a>
          )}
        </div>

        <p className={styles.warningExplanation}>{w.explanation}</p>
      </div>
    );
  };

  return (
    <div
      className={`${styles.section} ${className}`}
      aria-label="Transaction Warnings"
    >
      {grouped.blocked.length > 0 && (
        <div className={styles.warningGroup}>
          <div className={styles.warningGroupTitle}>
            <span aria-hidden="true">🛑</span>
            <span>Blocked ({grouped.blocked.length})</span>
          </div>
          {grouped.blocked.map((w, idx) =>
            renderItem(w, `blocked-${w.code}-${idx}`),
          )}
        </div>
      )}

      {grouped.review.length > 0 && (
        <div className={styles.warningGroup}>
          <div className={styles.warningGroupTitle}>
            <span aria-hidden="true">⚠️</span>
            <span>Review Required ({grouped.review.length})</span>
          </div>
          {grouped.review.map((w, idx) =>
            renderItem(w, `review-${w.code}-${idx}`),
          )}
        </div>
      )}

      {grouped.info.length > 0 && (
        <div className={styles.warningGroup}>
          <div className={styles.warningGroupTitle}>
            <span aria-hidden="true">ℹ️</span>
            <span>Informational ({grouped.info.length})</span>
          </div>
          {grouped.info.map((w, idx) => renderItem(w, `info-${w.code}-${idx}`))}
        </div>
      )}
    </div>
  );
};
