import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import type { AxeMatchers } from "vitest-axe";
import { ClearSignModal } from "../../src/ClearSignModal.js";
import { ClearSignPreview } from "@clearsign/core";

expect.extend(matchers);

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  export interface Assertion<T = any> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface AsymmetricMatchersContaining extends AxeMatchers {}
}

describe("ClearSignModal Accessibility & Keyboard Navigation", () => {
  const basePreview: ClearSignPreview = {
    version: 1,
    risk: "ok",
    warnings: [],
    network: { passphrase: "test", rpcMatches: true, signatureBound: true },
    envelope: { source: "G123", sequence: "1", fee: "100", operations: [] },
    auth: [],
    simulation: { status: "success" },
    effects: [],
    summary: ["Transfer 100 USDC to Alice"],
    raw: { xdr: "AAAA" },
  };

  describe("Axe Automated Accessibility Audit (Zero Violations)", () => {
    it("has zero axe violations in risk ok state", async () => {
      const { container } = render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has zero axe violations in risk review state", async () => {
      const reviewPreview: ClearSignPreview = {
        ...basePreview,
        risk: "review",
        warnings: [
          {
            code: "AUTH_EXPIRING",
            message: "Signature authorization expires soon",
            severity: "review",
          },
        ],
      };
      const { container } = render(
        <ClearSignModal
          preview={reviewPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has zero axe violations in risk blocked state", async () => {
      const blockedPreview: ClearSignPreview = {
        ...basePreview,
        risk: "blocked",
        warnings: [
          {
            code: "MALICIOUS_TARGET",
            message: "Contract address is on the blocklist",
            severity: "blocked",
          },
        ],
      };
      const { container } = render(
        <ClearSignModal
          preview={blockedPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has zero axe violations while signing is pending", async () => {
      const { container } = render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
          isSigning={true}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has zero axe violations with complex effects, invocations, and authorizations", async () => {
      const detailedPreview: ClearSignPreview = {
        ...basePreview,
        effects: [
          {
            account: "GDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTPEKGQKJZLDEOJKIOPU",
            delta: "-50",
            symbol: "XLM",
            formatted: "50",
            tokenContractId: "CTOKEN1",
          },
          {
            account: "GBXXXXXX2VGDR2FYWLIYAQIEGXTQVTPEKGQKJZLDEOJKIOPU",
            delta: "100",
            symbol: "USDC",
            formatted: "100",
            tokenContractId: "CTOKEN2",
          },
        ],
        invocation: {
          specSource: "wasm",
          contractId: "CDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTPEKGQKJZLDEOJKIOPU",
          functionName: "swap",
          args: [
            {
              name: "amount",
              typeName: "u32",
              value: { kind: "int", type: "u32", value: "100" },
            },
            {
              name: "recipient",
              typeName: "address",
              value: {
                kind: "address",
                value: "GDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTPEKGQKJZLDEOJKIOPU",
                addressType: "account",
              },
            },
          ],
        },
        auth: [
          {
            credentials: {
              type: "address",
              address: "GDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTPEKGQKJZLDEOJKIOPU",
              nonce: "1",
              signatureExpirationLedger: 500,
              signed: true,
            },
            root: {
              kind: "contract-fn",
              contractId:
                "CDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTPEKGQKJZLDEOJKIOPU",
              functionName: "transfer",
              args: [],
              depth: 1,
              children: [],
            },
          },
        ],
        warnings: [
          {
            code: "WARN_FEE",
            message: "Simulated fee exceeds usual bounds",
            severity: "review",
          },
        ],
      };

      const { container } = render(
        <ClearSignModal
          preview={detailedPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Keyboard Operability & Focus Management", () => {
    it("shifts focus into the dialog on mount and restores on unmount", () => {
      const triggerBtn = document.createElement("button");
      triggerBtn.textContent = "Open Modal";
      document.body.appendChild(triggerBtn);
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      const { unmount } = render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveFocus();

      unmount();
      expect(document.activeElement).toBe(triggerBtn);
      document.body.removeChild(triggerBtn);
    });

    it("closes modal on Escape key when signature is not pending", () => {
      const onReject = vi.fn();
      render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={onReject}
          isSigning={false}
        />,
      );

      fireEvent.keyDown(document, { key: "Escape" });
      expect(onReject).toHaveBeenCalledTimes(1);
    });

    it("prevents Escape key from closing modal when signature is pending (isSigning: true)", () => {
      const onReject = vi.fn();
      render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={onReject}
          isSigning={true}
        />,
      );

      fireEvent.keyDown(document, { key: "Escape" });
      expect(onReject).not.toHaveBeenCalled();
    });

    it("prevents Escape key from closing modal when signature is pending (isPending: true)", () => {
      const onReject = vi.fn();
      render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={onReject}
          isPending={true}
        />,
      );

      fireEvent.keyDown(document, { key: "Escape" });
      expect(onReject).not.toHaveBeenCalled();
    });

    it("traps Tab key focus inside the modal", () => {
      render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      const detailsTab = screen.getByRole("tab", { name: "Details" });
      const rejectBtn = screen.getByRole("button", { name: "Reject" });
      const approveBtn = screen.getByRole("button", { name: "Approve" });

      expect(rejectBtn).toBeInTheDocument();

      // Focus first element
      detailsTab.focus();
      expect(document.activeElement).toBe(detailsTab);

      // Shift+Tab on first element cycles to last element
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(approveBtn);

      // Tab on last element cycles back to first element
      fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
      expect(document.activeElement).toBe(detailsTab);
    });
  });

  describe("ARIA Dialog Structure and Live Announcements", () => {
    it("has valid role='dialog' with aria-labelledby and aria-describedby", () => {
      render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute(
        "aria-labelledby",
        "clearsign-modal-title",
      );
      expect(dialog).toHaveAttribute(
        "aria-describedby",
        "clearsign-modal-description",
      );

      const title = screen.getByText("Transaction Preview");
      expect(title).toHaveAttribute("id", "clearsign-modal-title");

      const description = document.getElementById(
        "clearsign-modal-description",
      );
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent("Decoded and verified");
    });

    it("renders aria-live polite region with appropriate status announcements", () => {
      const { rerender } = render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
      expect(liveRegion).toHaveTextContent(
        "Transaction preview ready. Decoded and verified.",
      );

      // Review state announcement
      const reviewPreview = { ...basePreview, risk: "review" as const };
      rerender(
        <ClearSignModal
          preview={reviewPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );
      expect(liveRegion).toHaveTextContent(
        "Transaction requires review: warnings detected.",
      );

      // Blocked state announcement
      const blockedPreview = { ...basePreview, risk: "blocked" as const };
      rerender(
        <ClearSignModal
          preview={blockedPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );
      expect(liveRegion).toHaveTextContent(
        "Transaction signing blocked: high risk detected.",
      );

      // Pending signing announcement
      rerender(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
          isSigning={true}
        />,
      );
      expect(liveRegion).toHaveTextContent("Transaction signature pending...");

      // Explicit status prop overrides
      rerender(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
          status="decoding"
        />,
      );
      expect(liveRegion).toHaveTextContent("Decoding transaction preview...");

      rerender(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
          status="error"
          errorMessage="Network timeout"
        />,
      );
      expect(liveRegion).toHaveTextContent("Error: Network timeout");
    });
  });

  describe("Risk and Financial Changes Conveyed Without Color Alone", () => {
    it("displays icons and distinct textual descriptions for risk", () => {
      const { rerender } = render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      const banner = document.getElementById("clearsign-modal-description");
      expect(banner).toHaveTextContent("Decoded and verified");
      const iconSvg = banner?.querySelector("svg");
      expect(iconSvg).toHaveAttribute("aria-hidden", "true");

      // Review state
      rerender(
        <ClearSignModal
          preview={{ ...basePreview, risk: "review" }}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );
      expect(banner).toHaveTextContent("Review carefully");

      // Blocked state
      rerender(
        <ClearSignModal
          preview={{ ...basePreview, risk: "blocked" }}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );
      expect(banner).toHaveTextContent("Signing blocked");
    });

    it("displays explicit '+' and '-' signs on balance changes", () => {
      const effectsPreview: ClearSignPreview = {
        ...basePreview,
        effects: [
          {
            account: "GAAA",
            delta: "25",
            symbol: "USDC",
            tokenContractId: "CTOKEN1",
          },
          {
            account: "GBBB",
            delta: "-10",
            symbol: "USDC",
            tokenContractId: "CTOKEN2",
          },
        ],
      };

      render(
        <ClearSignModal
          preview={effectsPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("+")).toBeInTheDocument();
      expect(screen.getByText(/25 USDC/)).toBeInTheDocument();
      expect(screen.getByText(/-10 USDC/)).toBeInTheDocument();
    });
  });
});
