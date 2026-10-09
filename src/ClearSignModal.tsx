import React, { useState, useEffect, useRef } from "react";
import { ClearSignPreview } from "@clearsign/core";
import styles from "./styles.module.css";

export interface ClearSignModalProps {
  preview: ClearSignPreview | null;
  onApprove: () => void;
  onReject: () => void;
}

import { handleCopy, shortenAddress } from "./utils.js";
import { DisplayValueRenderer } from "./components/DisplayValueRenderer.js";
import { AuthNodeRenderer } from "./components/AuthNodeRenderer.js";

export const ClearSignModal: React.FC<ClearSignModalProps> = ({
  preview,
  onApprove,
  onReject,
}) => {
  const [reviewed, setReviewed] = useState(false);
  const [xdrExpanded, setXdrExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement;
    if (modalRef.current) {
      modalRef.current.focus();
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onReject();

      // Basic focus trap
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
  }, [onReject]);

  if (!preview) return null;

  const getRiskBannerInfo = () => {
    switch (preview.risk) {
      case "ok":
        return { text: "Decoded and verified", className: styles.riskOk };
      case "review":
        return { text: "Review carefully", className: styles.riskReview };
      case "blocked":
        return { text: "Signing blocked", className: styles.riskBlocked };
      default:
        return { text: "Unknown risk", className: styles.riskBlocked };
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
        ref={modalRef}
        tabIndex={-1}
      >
        <div className={styles.modalHeader}>
          <h2 id="clearsign-modal-title">Transaction Preview</h2>
        </div>

        <div className={styles.modalBody}>
          <div className={`${styles.riskBanner} ${riskInfo.className}`}>
            {riskInfo.text}
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
              {preview.effects.map((effect, i) => (
                <div key={i} className={styles.balanceDelta}>
                  <span title={effect.account}>
                    {shortenAddress(effect.account)}
                  </span>
                  <span
                    className={
                      effect.delta.startsWith("-")
                        ? styles.balanceNegative
                        : styles.balancePositive
                    }
                  >
                    {effect.formatted || effect.delta}{" "}
                    {effect.symbol || "tokens"}
                  </span>
                </div>
              ))}
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
              {preview.auth.map((entry, i) => (
                <div key={i}>
                  <div>Credentials: {entry.credentials.type}</div>
                  <AuthNodeRenderer node={entry.root} />
                </div>
              ))}
            </div>
          )}

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
                  className={`${styles.warningItem} ${w.severity === "blocked" ? styles.warningBlocked : ""}`}
                >
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
              />
              I have reviewed the warnings
            </label>
          )}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonReject}`}
              onClick={onReject}
            >
              Reject
            </button>
            {preview.risk !== "blocked" && (
              <button
                type="button"
                className={`${styles.button} ${styles.buttonApprove}`}
                onClick={onApprove}
                disabled={preview.risk === "review" && !reviewed}
              >
                Approve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
