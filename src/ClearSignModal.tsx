import React, { useState, useEffect, useRef } from "react";
import { ClearSignPreview } from "@clearsign/core";
import styles from "./styles.module.css";
import { handleCopy, shortenAddress } from "./utils.js";
import { DisplayValueRenderer } from "./components/DisplayValueRenderer.js";
import { AuthNodeRenderer } from "./components/AuthNodeRenderer.js";
import {
  AuthorizationTree,
  AuthTreeNode,
  convertCoreAuthToTree,
} from "./components/AuthorizationTree.js";

export interface ClearSignModalProps {
  preview: ClearSignPreview | null;
  /** Shows a busy dialog (with a Reject button) while the preview is still being built. */
  loading?: boolean;
  onApprove: () => void;
  onReject: () => void;
  isSigning?: boolean;
  isPending?: boolean;
  status?: "decoding" | "ready" | "review" | "blocked" | "error";
  errorMessage?: string;
  useAuthorizationTree?: boolean;
  authTree?: AuthTreeNode[];
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
  onApprove,
  onReject,
  isSigning = false,
  isPending = false,
  status,
  errorMessage,
  useAuthorizationTree = false,
  authTree,
}) => {
  const [reviewed, setReviewed] = useState(false);
  const [xdrExpanded, setXdrExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onRejectRef = useRef(onReject);
  useEffect(() => {
    onRejectRef.current = onReject;
  }, [onReject]);

  const pendingSignature = isSigning || isPending;

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
        onReject();
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
  }, [onReject, pendingSignature]);

  if (!preview) {
    if (!loading) return null;
    return (
      <div className={styles.modalOverlay}>
        <div
          className={styles.modalContent}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clearsign-modal-title"
          aria-busy="true"
          ref={modalRef}
          tabIndex={-1}
        >
          <div className={styles.modalHeader}>
            <h2 id="clearsign-modal-title">Transaction Preview</h2>
          </div>
          <div className={styles.modalBody}>
            <p role="status">Decoding and simulating the transaction&hellip;</p>
          </div>
          <div className={styles.modalFooter}>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonReject}`}
                onClick={onReject}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRiskBannerInfo = () => {
    switch (preview.risk) {
      case "ok":
        return {
          text: "Decoded and verified",
          className: styles.riskOk,
          icon: <CheckCircleIcon />,
        };
      case "review":
        return {
          text: "Review carefully",
          className: styles.riskReview,
          icon: <AlertTriangleIcon />,
        };
      case "blocked":
        return {
          text: "Signing blocked",
          className: styles.riskBlocked,
          icon: <ShieldAlertIcon />,
        };
      default:
        return {
          text: "Unknown risk",
          className: styles.riskBlocked,
          icon: <AlertCircleIcon />,
        };
    }
  };

  const getStatusAnnouncement = () => {
    const currentStatus =
      status ||
      (errorMessage
        ? "error"
        : pendingSignature
          ? "pending"
          : preview.risk === "ok"
            ? "ready"
            : preview.risk === "review"
              ? "review"
              : preview.risk === "blocked"
                ? "blocked"
                : "ready");

    switch (currentStatus) {
      case "decoding":
        return "Decoding transaction preview...";
      case "ready":
        return "Transaction preview ready. Decoded and verified.";
      case "review":
        return "Transaction requires review: warnings detected.";
      case "blocked":
        return "Transaction signing blocked: high risk detected.";
      case "pending":
        return "Transaction signature pending...";
      case "error":
        return `Error: ${errorMessage || "Unable to verify transaction."}`;
      default:
        return "Transaction preview updated.";
    }
  };

  const riskInfo = getRiskBannerInfo();

  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clearsign-modal-title"
        aria-describedby="clearsign-modal-description"
        ref={modalRef}
        tabIndex={-1}
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
          <h2 id="clearsign-modal-title">Transaction Preview</h2>
        </div>

        <div className={styles.modalBody}>
          <div
            id="clearsign-modal-description"
            className={`${styles.riskBanner} ${riskInfo.className}`}
          >
            <span className={styles.riskIcon} aria-hidden="true">
              {riskInfo.icon}
            </span>
            <span>{riskInfo.text}</span>
          </div>

          {preview.summary && preview.summary.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Summary</h3>
              {preview.summary.map((line, i) => (
                <p key={i} className={styles.summaryLine}>
                  {line}
                </p>
              ))}
            </div>
          )}

          {preview.effects && preview.effects.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Balance Changes</h3>
              {preview.effects.map((effect, i) => {
                const isNegative = effect.delta.startsWith("-");
                return (
                  <div key={i} className={styles.balanceDelta}>
                    <span title={effect.account}>
                      {shortenAddress(effect.account)}
                    </span>
                    <span
                      className={
                        isNegative
                          ? styles.balanceNegative
                          : styles.balancePositive
                      }
                    >
                      <span aria-hidden="true">{isNegative ? "" : "+"}</span>
                      {effect.formatted || effect.delta}{" "}
                      {effect.symbol || "tokens"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {preview.invocation && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Call Details</h3>
              <div>
                Contract:{" "}
                <span title={preview.invocation.contractId}>
                  {shortenAddress(preview.invocation.contractId)}
                </span>
              </div>
              <div>Function: {preview.invocation.functionName}</div>
              {preview.invocation.args &&
                preview.invocation.args.length > 0 && (
                  <ul>
                    {preview.invocation.args.map((arg, i) => (
                      <li key={i}>
                        <strong>{arg.name || "arg"}:</strong>{" "}
                        <DisplayValueRenderer val={arg.value} />
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          {preview.auth && preview.auth.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Authorizations</h3>
              {useAuthorizationTree || authTree ? (
                <AuthorizationTree
                  nodes={
                    authTree ||
                    convertCoreAuthToTree(preview.auth, preview.warnings)
                  }
                />
              ) : (
                preview.auth.map((entry, i) => (
                  <div key={i}>
                    <div>Credentials: {entry.credentials.type}</div>
                    <AuthNodeRenderer node={entry.root} />
                  </div>
                ))
              )}
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Network</h3>
            <div>{preview.network.passphrase}</div>
            <div>
              {preview.network.verified
                ? "Network verified against the RPC"
                : "Network not verified"}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Fees</h3>
            <div>Declared Fee: {preview.envelope.fee}</div>
            {preview.simulation.minResourceFee && (
              <div>
                Simulated Resource Fee: {preview.simulation.minResourceFee}
              </div>
            )}
          </div>

          {preview.warnings && preview.warnings.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Warnings</h3>
              {preview.warnings.map((w, i) => (
                <div
                  key={i}
                  className={`${styles.warningItem} ${
                    w.severity === "blocked" ? styles.warningBlocked : ""
                  }`}
                >
                  <span
                    className={styles.riskIcon}
                    aria-hidden="true"
                    style={{ marginRight: 6 }}
                  >
                    {w.severity === "blocked" ? (
                      <ShieldAlertIcon />
                    ) : (
                      <AlertTriangleIcon />
                    )}
                  </span>
                  <strong>{w.code}</strong>: {w.message}
                </div>
              ))}
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <button
                type="button"
                onClick={() => setXdrExpanded(!xdrExpanded)}
                aria-expanded={xdrExpanded}
              >
                {xdrExpanded ? "Hide Raw XDR" : "Show Raw XDR"}
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
                  Copy XDR
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          {preview.risk === "review" && (
            <label className={styles.reviewCheckbox}>
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
                disabled={pendingSignature}
              />
              I have reviewed the warnings
            </label>
          )}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonReject}`}
              onClick={onReject}
              disabled={pendingSignature}
            >
              Reject
            </button>
            {preview.risk !== "blocked" && (
              <button
                type="button"
                className={`${styles.button} ${styles.buttonApprove}`}
                onClick={onApprove}
                disabled={
                  (preview.risk === "review" && !reviewed) || pendingSignature
                }
              >
                {pendingSignature ? "Signing..." : "Approve"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
