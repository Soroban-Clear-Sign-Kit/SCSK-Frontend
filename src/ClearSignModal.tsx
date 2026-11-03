import React, { useState, useEffect, useRef, useMemo } from "react";
import { ClearSignPreview } from "@clearsign/core";
import styles from "./styles.module.css";
import { handleCopy } from "./utils.js";
import { DisplayValueRenderer } from "./components/DisplayValueRenderer.js";
import { AuthNodeRenderer } from "./components/AuthNodeRenderer.js";
import { AddressHashView } from "./components/AddressHashView.js";
import {
  StateDiffViewer,
  StateDiffItem,
} from "./components/StateDiffViewer.js";
import {
  AuthorizationTree,
  AuthTreeNode,
  convertCoreAuthToTree,
} from "./components/AuthorizationTree.js";
import {
  WarningList,
  WarningViewModel,
  mapToWarningViewModel,
} from "./components/WarningList.js";
import { ClearSignMessages } from "./i18n/messages.js";
import { useClearSignMessages } from "./i18n/context.js";

export interface ClearSignModalProps {
  preview: ClearSignPreview | null;
  /** Shows a busy dialog (with a Reject button) while the preview is still being built. */
  loading?: boolean | undefined;
  onApprove: (acknowledgedWarnings?: WarningViewModel[]) => void;
  onReject: () => void;
  isSigning?: boolean | undefined;
  isPending?: boolean | undefined;
  status?: "decoding" | "ready" | "review" | "blocked" | "error" | undefined;
  errorMessage?: string | undefined;
  useAuthorizationTree?: boolean | undefined;
  authTree?: AuthTreeNode[] | undefined;
  messages?: Partial<ClearSignMessages> | undefined;
  theme?: "light" | "dark" | "auto" | undefined;
  stateDiffs?: readonly StateDiffItem[] | undefined;
}

const CheckCircleIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertTriangleIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
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

const ShieldAlertIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const AlertCircleIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export const ClearSignModal: React.FC<ClearSignModalProps> = ({
  preview,
  loading = false,
  onApprove,
  onReject,
  isSigning = false,
  isPending = false,
  status,
  errorMessage,
  useAuthorizationTree = false,
  authTree,
  messages,
  theme,
  stateDiffs,
}) => {
  const m = useClearSignMessages(messages);
  const [reviewed, setReviewed] = useState(false);
  const [xdrExpanded, setXdrExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onRejectRef = useRef(onReject);
  useEffect(() => {
    onRejectRef.current = onReject;
  }, [onReject]);

  const dataTheme = theme && theme !== "auto" ? theme : undefined;
  const pendingSignature = isSigning || isPending;
  const visible = preview !== null || loading;

  const mappedWarnings = useMemo(
    () => (preview?.warnings || []).map(mapToWarningViewModel),
    [preview?.warnings],
  );

  const isBlocked =
    status === "blocked" ||
    preview?.risk === "blocked" ||
    mappedWarnings.some((w) => w.severity === "blocked");

  const isReview =
    !isBlocked &&
    (status === "review" ||
      preview?.risk === "review" ||
      mappedWarnings.some((w) => w.severity === "review"));

  const txIdentifier =
    preview?.raw?.xdr || preview?.envelope?.sequence || preview;

  const [prevTxIdentifier, setPrevTxIdentifier] = useState(txIdentifier);
  if (txIdentifier !== prevTxIdentifier) {
    setPrevTxIdentifier(txIdentifier);
    setReviewed(false);
  }

  const handleApprove = () => {
    if (isBlocked) {
      return;
    }
    if (isReview && !reviewed) {
      return;
    }
    if (pendingSignature) {
      return;
    }
    onApprove(mappedWarnings);
  };

  useEffect(() => {
    if (!visible) return;
    triggerRef.current = document.activeElement as HTMLElement;
    if (modalRef.current) {
      modalRef.current.focus();
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (pendingSignature) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        onRejectRef.current();
      }

      // Accessible Tab / Shift+Tab focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length > 0) {
          const first = focusable[0] as HTMLElement;
          const last = focusable[focusable.length - 1] as HTMLElement;
          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [visible, pendingSignature]);

  if (!preview) {
    if (!loading) return null;
    return (
      <div className={styles.modalOverlay} data-theme={dataTheme}>
        <div
          className={styles.modalContent}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clearsign-modal-title"
          aria-busy="true"
          ref={modalRef}
          tabIndex={-1}
          data-theme={dataTheme}
        >
          <div className={styles.modalHeader}>
            <h2 id="clearsign-modal-title">{m.modalTitle}</h2>
          </div>
          <div className={styles.modalBody}>
            <p role="status">{m.decodingPreview}</p>
          </div>
          <div className={styles.modalFooter}>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonReject}`}
                onClick={onReject}
              >
                {m.reject}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRiskBannerInfo = () => {
    if (isBlocked) {
      return {
        text: m.riskBlocked,
        className: styles.riskBlocked,
        icon: <ShieldAlertIcon />,
      };
    }
    if (isReview) {
      return {
        text: m.riskReview,
        className: styles.riskReview,
        icon: <AlertTriangleIcon />,
      };
    }
    if (preview.risk === "ok") {
      return {
        text: m.riskOk,
        className: styles.riskOk,
        icon: <CheckCircleIcon />,
      };
    }
    return {
      text: m.riskUnknown,
      className: styles.riskBlocked,
      icon: <AlertCircleIcon />,
    };
  };

  const getStatusAnnouncement = () => {
    const currentStatus =
      status ||
      (errorMessage
        ? "error"
        : pendingSignature
          ? "pending"
          : isBlocked
            ? "blocked"
            : isReview
              ? "review"
              : preview.risk === "ok"
                ? "ready"
                : "ready");

    switch (currentStatus) {
      case "decoding":
        return m.announcementDecoding;
      case "ready":
        return m.announcementReady;
      case "review":
        return m.announcementReview;
      case "blocked":
        return m.announcementBlocked;
      case "pending":
        return m.announcementPending;
      case "error":
        return m.announcementError(errorMessage);
      default:
        return m.announcementUpdated;
    }
  };

  const riskInfo = getRiskBannerInfo();

  return (
    <div className={styles.modalOverlay} data-theme={dataTheme}>
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clearsign-modal-title"
        aria-describedby="clearsign-modal-description"
        ref={modalRef}
        tabIndex={-1}
        data-theme={dataTheme}
      >
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={styles.srOnly}
        >
          {getStatusAnnouncement()}
        </div>

        <div className={styles.modalHeader}>
          <h2 id="clearsign-modal-title">{m.modalTitle}</h2>
        </div>

        <div className={styles.modalBody}>
          <div
            id="clearsign-modal-description"
            className={`${styles.riskBanner} ${riskInfo.className}`}
            role={isBlocked || isReview ? "alert" : undefined}
          >
            <span className={styles.riskIcon} aria-hidden="true">
              {riskInfo.icon}
            </span>
            <span>{riskInfo.text}</span>
          </div>

          {preview.summary && preview.summary.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{m.sectionSummary}</h3>
              {preview.summary.map((line, i) => (
                <p key={i} className={styles.summaryLine}>
                  {line}
                </p>
              ))}
            </div>
          )}

          {((preview.effects && preview.effects.length > 0) ||
            (stateDiffs && stateDiffs.length > 0)) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                {stateDiffs && stateDiffs.length > 0
                  ? m.sectionStateDiffs
                  : m.sectionBalanceChanges}
              </h3>
              <StateDiffViewer
                entries={stateDiffs || preview.effects}
                messages={messages}
              />
            </div>
          )}

          {preview.invocation && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{m.sectionCallDetails}</h3>
              <div>
                {m.contractLabel}{" "}
                <AddressHashView
                  value={preview.invocation.contractId}
                  kind="address"
                  messages={{
                    ...messages,
                    copyAddressAriaLabel: m.copyContractAriaLabel,
                  }}
                />
              </div>
              <div>
                {m.functionLabel} {preview.invocation.functionName}
              </div>
              {preview.invocation.args &&
                preview.invocation.args.length > 0 && (
                  <ul>
                    {preview.invocation.args.map((arg, i) => (
                      <li key={i}>
                        <strong>{arg.name || "arg"}:</strong>{" "}
                        <DisplayValueRenderer
                          val={arg.value}
                          messages={messages}
                        />
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          {preview.auth && preview.auth.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{m.sectionAuthorizations}</h3>
              {useAuthorizationTree || authTree ? (
                <AuthorizationTree
                  nodes={
                    authTree ||
                    convertCoreAuthToTree(preview.auth, preview.warnings)
                  }
                  messages={messages}
                />
              ) : (
                preview.auth.map((entry, i) => (
                  <div key={i}>
                    <div>
                      {m.credentialsLabel} {entry.credentials.type}
                    </div>
                    <AuthNodeRenderer node={entry.root} messages={messages} />
                  </div>
                ))
              )}
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{m.sectionNetwork}</h3>
            <div>{preview.network.passphrase}</div>
            <div>
              {(
                "verified" in preview.network
                  ? Boolean(
                      (preview.network as { verified?: boolean }).verified,
                    )
                  : Boolean(preview.network.rpcMatches)
              )
                ? m.networkVerified
                : m.networkNotVerified}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{m.sectionFees}</h3>
            <div>
              {m.declaredFeeLabel} {preview.envelope.fee}
            </div>
            {preview.simulation.minResourceFee && (
              <div>
                {m.simulatedResourceFeeLabel}{" "}
                {preview.simulation.minResourceFee}
              </div>
            )}
            {preview.simulation.status && (
              <div>
                {m.simulationStatusLabel} {preview.simulation.status}
              </div>
            )}
            {preview.simulation.error && (
              <div>
                {m.simulationErrorLabel} {preview.simulation.error}
              </div>
            )}
          </div>

          {mappedWarnings.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{m.sectionWarnings}</h3>
              <WarningList warnings={mappedWarnings} messages={messages} />
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <button
                type="button"
                onClick={() => setXdrExpanded(!xdrExpanded)}
                aria-expanded={xdrExpanded}
              >
                {xdrExpanded ? m.hideRawXdr : m.showRawXdr}
              </button>
            </h3>
            {xdrExpanded && (
              <div className={styles.rawXdr}>
                {preview.raw.xdr}
                <br />
                <button
                  type="button"
                  onClick={() => handleCopy(preview.raw.xdr)}
                >
                  {m.copyXdr}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          {isReview && (
            <label className={styles.reviewCheckbox}>
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
                disabled={pendingSignature}
              />
              {m.reviewCheckboxLabel}
            </label>
          )}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonReject}`}
              onClick={onReject}
              disabled={pendingSignature}
            >
              {m.reject}
            </button>
            {!isBlocked && (
              <button
                type="button"
                className={`${styles.button} ${styles.buttonApprove}`}
                onClick={handleApprove}
                disabled={(isReview && !reviewed) || pendingSignature}
              >
                {pendingSignature ? m.signing : m.approve}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
