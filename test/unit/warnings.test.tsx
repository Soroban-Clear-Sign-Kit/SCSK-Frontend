import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClearSignModal } from "../../src/ClearSignModal.js";
import {
  WarningList,
  WarningViewModel,
  mapToWarningViewModel,
  groupWarningsBySeverity,
} from "../../src/components/WarningList.js";
import { ClearSignPreview } from "@clearsign/core";

describe("Warning System and Signing Gating", () => {
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
    summary: [],
    raw: { xdr: "AAAA..." },
  };

  describe("Severity Paths and Gating", () => {
    it("handles 'ok' severity: enabled immediately with no warnings or checkbox", () => {
      const onApprove = vi.fn();
      render(
        <ClearSignModal
          preview={basePreview}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("Decoded and verified")).toBeInTheDocument();
      expect(
        screen.queryByRole("checkbox", {
          name: /I have reviewed the warnings/i,
        }),
      ).not.toBeInTheDocument();

      const approveBtn = screen.getByRole("button", { name: "Approve" });
      expect(approveBtn).toBeEnabled();

      fireEvent.click(approveBtn);
      expect(onApprove).toHaveBeenCalledWith([]);
    });

    it("handles 'review' severity: requires explicit acknowledgement before signing", () => {
      const onApprove = vi.fn();
      const reviewPreview: ClearSignPreview = {
        ...basePreview,
        risk: "review",
        warnings: [
          {
            code: "AUTH_EXPIRING",
            message: "Authorization expires soon",
            severity: "review",
          },
        ],
      };

      render(
        <ClearSignModal
          preview={reviewPreview}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("Review carefully")).toBeInTheDocument();
      expect(
        screen.getByText("Transaction requires review: warnings detected."),
      ).toBeInTheDocument();

      const checkbox = screen.getByRole("checkbox", {
        name: /I have reviewed the warnings/i,
      });
      expect(checkbox).not.toBeChecked();

      const approveBtn = screen.getByRole("button", { name: "Approve" });
      expect(approveBtn).toBeDisabled();

      // Clicking disabled approve button does not call onApprove
      fireEvent.click(approveBtn);
      expect(onApprove).not.toHaveBeenCalled();

      // Check the acknowledgement
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
      expect(approveBtn).toBeEnabled();

      // Approve now works and reports acknowledged warnings to callback
      fireEvent.click(approveBtn);
      expect(onApprove).toHaveBeenCalledTimes(1);
      const call = onApprove.mock.calls[0];
      expect(call).toBeDefined();
      const acknowledged = call?.[0];
      expect(acknowledged).toHaveLength(1);
      expect(acknowledged?.[0]?.code).toBe("AUTH_EXPIRING");
      expect(acknowledged?.[0]?.severity).toBe("review");
    });

    it("handles 'blocked' severity: disables signing and props cannot re-enable it", () => {
      const onApprove = vi.fn();
      const blockedPreview: ClearSignPreview = {
        ...basePreview,
        risk: "blocked",
        warnings: [
          {
            code: "MALICIOUS_RECIPIENT",
            message: "Target is on the security blocklist",
            severity: "blocked",
          },
        ],
      };

      const { rerender } = render(
        <ClearSignModal
          preview={blockedPreview}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("Signing blocked")).toBeInTheDocument();
      expect(
        screen.getByText("Transaction signing blocked: high risk detected."),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument();

      // Attempting to pass status='ready' to bypass blocked state fails
      rerender(
        <ClearSignModal
          preview={blockedPreview}
          status="ready"
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("Signing blocked")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument();
      expect(onApprove).not.toHaveBeenCalled();
    });

    it("treats any warning with severity 'blocked' as blocked even if preview.risk is 'review'", () => {
      const onApprove = vi.fn();
      const mixedPreview: ClearSignPreview = {
        ...basePreview,
        risk: "review",
        warnings: [
          { code: "LOW_FEE", message: "Fee might be low", severity: "review" },
          {
            code: "UNTRUSTED_BYTECODE",
            message: "Contract bytecode hash unverified",
            severity: "blocked",
          },
        ],
      };

      render(
        <ClearSignModal
          preview={mixedPreview}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      );

      // Blocked trumps review
      expect(screen.getByText("Signing blocked")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Approve" }),
      ).not.toBeInTheDocument();
      expect(onApprove).not.toHaveBeenCalled();
    });

    it("handles informational warnings: visible in list without gating signing", () => {
      const onApprove = vi.fn();
      const infoPreview: ClearSignPreview = {
        ...basePreview,
        risk: "ok",
        warnings: [
          {
            code: "MEMO_RECOMMENDED",
            message: "Destination exchange may require a memo",
            severity: "info" as never,
          },
        ],
      };

      render(
        <ClearSignModal
          preview={infoPreview}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      );

      expect(screen.getByText("Decoded and verified")).toBeInTheDocument();
      expect(screen.getByText("MEMO_RECOMMENDED")).toBeInTheDocument();
      expect(
        screen.queryByRole("checkbox", {
          name: /I have reviewed the warnings/i,
        }),
      ).not.toBeInTheDocument();

      const approveBtn = screen.getByRole("button", { name: "Approve" });
      expect(approveBtn).toBeEnabled();
      fireEvent.click(approveBtn);
      expect(onApprove).toHaveBeenCalled();
    });
  });

  describe("Acknowledgement Reset on Transaction Change", () => {
    it("resets reviewed acknowledgement when the transaction changes", () => {
      const onApprove = vi.fn();
      const initialPreview: ClearSignPreview = {
        ...basePreview,
        risk: "review",
        raw: { xdr: "XDR_TX_ALPHA" },
        warnings: [
          {
            code: "EXPIRED_CONTRACT",
            message: "Contract data TTL expiring",
            severity: "review",
          },
        ],
      };

      const { rerender } = render(
        <ClearSignModal
          preview={initialPreview}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      );

      const checkbox = screen.getByRole("checkbox", {
        name: /I have reviewed the warnings/i,
      });
      const approveBtn = screen.getByRole("button", { name: "Approve" });

      expect(checkbox).not.toBeChecked();
      expect(approveBtn).toBeDisabled();

      // User checks the acknowledgement
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
      expect(approveBtn).toBeEnabled();

      // Transaction changes (new XDR / sequence)
      const updatedPreview: ClearSignPreview = {
        ...basePreview,
        risk: "review",
        raw: { xdr: "XDR_TX_BETA" },
        envelope: { ...basePreview.envelope, sequence: "2" },
        warnings: [
          {
            code: "EXPIRED_CONTRACT",
            message: "Contract data TTL expiring",
            severity: "review",
          },
        ],
      };

      rerender(
        <ClearSignModal
          preview={updatedPreview}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      );

      // Checkbox must be reset to unchecked and approve disabled again
      const resetCheckbox = screen.getByRole("checkbox", {
        name: /I have reviewed the warnings/i,
      });
      const resetApproveBtn = screen.getByRole("button", { name: "Approve" });

      expect(resetCheckbox).not.toBeChecked();
      expect(resetApproveBtn).toBeDisabled();
    });
  });

  describe("WarningList Component", () => {
    const testWarnings: WarningViewModel[] = [
      {
        code: "MALICIOUS_CALL",
        severity: "blocked",
        title: "Malicious Call",
        explanation: "This call attempts unauthorized storage writes.",
        docsUrl: "https://docs.clearsign.io/warnings/malicious_call",
      },
      {
        code: "HIGH_FEE",
        severity: "review",
        title: "High Fee",
        explanation: "Declared fee is 10x higher than estimated.",
        docsUrl: "https://docs.clearsign.io/warnings/high_fee",
      },
      {
        code: "SIMULATION_NOTE",
        severity: "info",
        title: "Simulation Note",
        explanation: "Simulation completed in 12ms.",
        docsUrl: "https://docs.clearsign.io/warnings/simulation_note",
      },
    ];

    it("groups warnings by severity with headers, explanations, and docs links", () => {
      render(<WarningList warnings={testWarnings} />);

      // Headers with counts
      expect(screen.getByText("Blocked (1)")).toBeInTheDocument();
      expect(screen.getByText("Review Required (1)")).toBeInTheDocument();
      expect(screen.getByText("Informational (1)")).toBeInTheDocument();

      // Codes & Titles
      expect(screen.getByText("MALICIOUS_CALL")).toBeInTheDocument();
      expect(screen.getByText("— Malicious Call")).toBeInTheDocument();
      expect(screen.getByText("HIGH_FEE")).toBeInTheDocument();
      expect(screen.getByText("SIMULATION_NOTE")).toBeInTheDocument();

      // Explanations
      expect(
        screen.getByText("This call attempts unauthorized storage writes."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Declared fee is 10x higher than estimated."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Simulation completed in 12ms."),
      ).toBeInTheDocument();

      // Accessible documentation links
      const docsLinks = screen.getAllByRole("link", { name: /Docs:/i });
      expect(docsLinks).toHaveLength(3);
      expect(docsLinks[0]).toHaveAttribute(
        "href",
        "https://docs.clearsign.io/warnings/malicious_call",
      );
      expect(docsLinks[0]).toHaveAttribute("target", "_blank");
      expect(docsLinks[0]).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("returns null when warnings array is empty", () => {
      const { container } = render(<WarningList warnings={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("mapToWarningViewModel and groupWarningsBySeverity", () => {
    it("maps arbitrary warning shapes to WarningViewModel correctly", () => {
      const raw = {
        code: "UNEXPECTED_STORAGE_KEY",
        message: "Key is not in contract spec",
      };

      const vm = mapToWarningViewModel(raw);
      expect(vm.code).toBe("UNEXPECTED_STORAGE_KEY");
      expect(vm.title).toBe("Unexpected Storage Key");
      expect(vm.explanation).toBe("Key is not in contract spec");
      expect(vm.severity).toBe("review"); // default fallback
      expect(vm.docsUrl).toBe(
        "https://docs.clearsign.io/warnings/unexpected_storage_key",
      );
    });

    it("respects explicit severity and docsUrl when provided", () => {
      const raw = {
        code: "KNOWN_EXPLOIT",
        severity: "blocked",
        title: "Critical Exploit",
        explanation: "Contract matches known drainer pattern",
        docsUrl: "https://security.example.com/advisory-123",
      };

      const vm = mapToWarningViewModel(raw);
      expect(vm.severity).toBe("blocked");
      expect(vm.title).toBe("Critical Exploit");
      expect(vm.explanation).toBe("Contract matches known drainer pattern");
      expect(vm.docsUrl).toBe("https://security.example.com/advisory-123");
    });

    it("groups view models accurately into blocked, review, and info buckets", () => {
      const items: WarningViewModel[] = [
        {
          code: "B1",
          severity: "blocked",
          title: "B1",
          explanation: "b1",
        },
        {
          code: "R1",
          severity: "review",
          title: "R1",
          explanation: "r1",
        },
        {
          code: "R2",
          severity: "review",
          title: "R2",
          explanation: "r2",
        },
        {
          code: "I1",
          severity: "info",
          title: "I1",
          explanation: "i1",
        },
      ];

      const grouped = groupWarningsBySeverity(items);
      expect(grouped.blocked).toHaveLength(1);
      expect(grouped.review).toHaveLength(2);
      expect(grouped.info).toHaveLength(1);
      expect(grouped.blocked[0]?.code).toBe("B1");
      expect(grouped.review.map((w) => w.code)).toEqual(["R1", "R2"]);
      expect(grouped.info[0]?.code).toBe("I1");
    });
  });
});
