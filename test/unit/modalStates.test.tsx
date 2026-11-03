import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClearSignModal } from "../../src/ClearSignModal.js";
import { ClearSignPreview } from "@clearsign/core";

describe("Modal States Testing", () => {
  const basePreview: ClearSignPreview = {
    version: 1,
    risk: "ok",
    warnings: [],
    network: {
      passphrase: "Test SDF Network ; September 2015",
      rpcMatches: true,
      signatureBound: true,
    },
    envelope: { source: "G1234", sequence: "1", fee: "100", operations: [] },
    auth: [],
    simulation: { status: "success" },
    effects: [],
    summary: ["Transfer 100 XLM"],
    raw: { xdr: "AAAA..." },
  };

  describe("1. Loading State", () => {
    it("renders busy dialog when loading=true and preview=null", () => {
      const onReject = vi.fn();
      render(
        <ClearSignModal
          preview={null}
          loading={true}
          onApprove={vi.fn()}
          onReject={onReject}
        />,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-busy", "true");
      expect(
        screen.getByText("Decoding and simulating the transaction…"),
      ).toBeInTheDocument();

      const rejectBtn = screen.getByRole("button", { name: "Reject" });
      expect(rejectBtn).toBeInTheDocument();
      fireEvent.click(rejectBtn);
      expect(onReject).toHaveBeenCalledTimes(1);
    });

    it("does not render modal when preview=null and loading=false without error/success", () => {
      const { container } = render(
        <ClearSignModal
          preview={null}
          loading={false}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("2. Ready State", () => {
    it("renders ready state when risk='ok' with enabled approve button", () => {
      const onApprove = vi.fn();
      render(
        <ClearSignModal
          preview={basePreview}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("Decoded and verified")).toBeInTheDocument();
      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toHaveTextContent(
        "Transaction preview ready. Decoded and verified.",
      );

      const approveBtn = screen.getByRole("button", { name: "Approve" });
      expect(approveBtn).toBeEnabled();

      fireEvent.click(approveBtn);
      expect(onApprove).toHaveBeenCalledTimes(1);

      expect(
        screen.queryByRole("checkbox", {
          name: /I have reviewed the warnings/i,
        }),
      ).not.toBeInTheDocument();
    });

    it("honors explicit status='ready'", () => {
      render(
        <ClearSignModal
          preview={basePreview}
          status="ready"
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );
      expect(screen.getByText("Decoded and verified")).toBeInTheDocument();
    });
  });

  describe("3. Review State", () => {
    const reviewPreview: ClearSignPreview = {
      ...basePreview,
      risk: "review",
      warnings: [
        {
          code: "UNVERIFIED_CONTRACT",
          severity: "review",
          message: "Contract bytecode is unverified",
        },
      ],
    };

    it("gates signing until the review acknowledgment checkbox is checked", () => {
      const onApprove = vi.fn();
      render(
        <ClearSignModal
          preview={reviewPreview}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("Review carefully")).toBeInTheDocument();
      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toHaveTextContent(
        "Transaction requires review: warnings detected.",
      );

      const checkbox = screen.getByRole("checkbox", {
        name: /I have reviewed the warnings/i,
      });
      expect(checkbox).not.toBeChecked();

      const approveBtn = screen.getByRole("button", { name: "Approve" });
      expect(approveBtn).toBeDisabled();

      fireEvent.click(approveBtn);
      expect(onApprove).not.toHaveBeenCalled();

      // Check the box
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
      expect(approveBtn).toBeEnabled();

      fireEvent.click(approveBtn);
      expect(onApprove).toHaveBeenCalledTimes(1);
    });

    it("activates review state from status='review' prop even without warnings", () => {
      render(
        <ClearSignModal
          preview={basePreview}
          status="review"
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("Review carefully")).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", {
          name: /I have reviewed the warnings/i,
        }),
      ).toBeInTheDocument();
    });
  });

  describe("4. Blocked State", () => {
    const blockedPreview: ClearSignPreview = {
      ...basePreview,
      risk: "blocked",
      warnings: [
        {
          code: "DRAIN_ATTACK",
          severity: "blocked",
          message: "Potential wallet drain detected",
        },
      ],
    };

    it("hides approve button and announces blocked risk", () => {
      render(
        <ClearSignModal
          preview={blockedPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("Signing blocked")).toBeInTheDocument();
      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toHaveTextContent(
        "Transaction signing blocked: high risk detected.",
      );

      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reject" }),
      ).toBeInTheDocument();
    });

    it("respects status='blocked' prop override", () => {
      render(
        <ClearSignModal
          preview={basePreview}
          status="blocked"
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("Signing blocked")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("5. Error State", () => {
    it("renders error state when preview is null and status='error'", () => {
      const onReject = vi.fn();
      render(
        <ClearSignModal
          preview={null}
          status="error"
          errorMessage="SimulateTransaction failed: Horizon timeout"
          onApprove={vi.fn()}
          onReject={onReject}
        />,
      );

      expect(
        screen.getByText("SimulateTransaction failed: Horizon timeout"),
      ).toBeInTheDocument();
      const alertRegion = screen.getByRole("alert");
      expect(alertRegion).toHaveTextContent(
        "SimulateTransaction failed: Horizon timeout",
      );

      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument();

      const rejectBtn = screen.getByRole("button", { name: "Reject" });
      fireEvent.click(rejectBtn);
      expect(onReject).toHaveBeenCalledTimes(1);
    });

    it("renders error state banner when preview exists and status='error'", () => {
      render(
        <ClearSignModal
          preview={basePreview}
          status="error"
          errorMessage="Signature rejected by ledger"
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(
        screen.getByText("Signature rejected by ledger"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("6. Success State", () => {
    it("renders success state when preview is null and status='success'", () => {
      const onReject = vi.fn();
      render(
        <ClearSignModal
          preview={null}
          status="success"
          onApprove={vi.fn()}
          onReject={onReject}
        />,
      );

      expect(screen.getByText("Transaction Signed")).toBeInTheDocument();
      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toHaveTextContent("Transaction Signed");

      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument();

      const closeBtn = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeBtn);
      expect(onReject).toHaveBeenCalledTimes(1);
    });

    it("renders success state banner and Close button when preview is present and status='success'", () => {
      const onReject = vi.fn();
      render(
        <ClearSignModal
          preview={basePreview}
          status="success"
          onApprove={vi.fn()}
          onReject={onReject}
        />,
      );

      expect(screen.getByText("Transaction Signed")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument();

      const closeBtn = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeBtn);
      expect(onReject).toHaveBeenCalledTimes(1);
    });
  });
});
