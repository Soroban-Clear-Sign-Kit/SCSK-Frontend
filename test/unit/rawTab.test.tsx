import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ClearSignModal } from "../../src/ClearSignModal.js";
import { ClearSignPreview } from "@clearsign/core";

describe("ClearSignModal: Raw Tab & Copy Behavior", () => {
  const samplePreview: ClearSignPreview = {
    version: 1,
    risk: "ok",
    warnings: [],
    network: {
      passphrase: "Test SDF Network ; September 2015",
      rpcMatches: true,
      signatureBound: true,
    },
    envelope: {
      source: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      sequence: "12345678",
      fee: "100",
      operations: [{ type: "invokeHostFunction", decoded: true }],
    },
    invocation: {
      specSource: "wasm",
      contractId: "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
      functionName: "transfer",
      args: [],
    },
    simulation: { status: "success", minResourceFee: "150" },
    effects: [],
    summary: ["Transfer tokens"],
    raw: {
      xdr: "AAAAAgAAAAA3m5qLq37n...",
    },
    auth: [],
  };

  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders tablist with Details and Raw tabs and defaults to Details", () => {
    render(
      <ClearSignModal
        preview={samplePreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const tablist = screen.getByRole("tablist");
    expect(tablist).toBeInTheDocument();

    const detailsTab = screen.getByRole("tab", { name: "Details" });
    const rawTab = screen.getByRole("tab", { name: "Raw" });

    expect(detailsTab).toHaveAttribute("aria-selected", "true");
    expect(rawTab).toHaveAttribute("aria-selected", "false");

    // Details panel is visible
    expect(
      screen.getByRole("tabpanel", { name: "Details" }),
    ).not.toHaveAttribute("hidden");
  });

  it("switches to Raw tab on click and renders Base64 XDR and Decoded JSON", () => {
    render(
      <ClearSignModal
        preview={samplePreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const rawTab = screen.getByRole("tab", { name: "Raw" });
    fireEvent.click(rawTab);

    expect(rawTab).toHaveAttribute("aria-selected", "true");

    // Raw tab panel is rendered
    expect(
      screen.getByRole("heading", {
        name: "Transaction Envelope (XDR Base64)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Decoded Transaction (JSON)" }),
    ).toBeInTheDocument();

    // Verify raw base64 content
    expect(screen.getByText("AAAAAgAAAAA3m5qLq37n...")).toBeInTheDocument();

    // Verify decoded JSON contains parsed details
    expect(screen.getByText(/"sequence":\s*"12345678"/)).toBeInTheDocument();
  });

  it("copies transaction XDR to clipboard on button click", () => {
    render(
      <ClearSignModal
        preview={samplePreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const rawTab = screen.getByRole("tab", { name: "Raw" });
    fireEvent.click(rawTab);

    const copyXdrBtn = screen.getByRole("button", { name: "Copy XDR" });
    fireEvent.click(copyXdrBtn);

    expect(writeTextMock).toHaveBeenCalledWith(samplePreview.raw.xdr);
    expect(screen.getByText("Copied XDR!")).toBeInTheDocument();
  });

  it("copies decoded JSON to clipboard on button click", () => {
    render(
      <ClearSignModal
        preview={samplePreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const rawTab = screen.getByRole("tab", { name: "Raw" });
    fireEvent.click(rawTab);

    const copyJsonBtn = screen.getByRole("button", { name: "Copy JSON" });
    fireEvent.click(copyJsonBtn);

    expect(writeTextMock).toHaveBeenCalledWith(
      JSON.stringify(samplePreview, null, 2),
    );
    expect(screen.getByText("Copied JSON!")).toBeInTheDocument();
  });

  it("supports keyboard arrow navigation between tabs", () => {
    render(
      <ClearSignModal
        preview={samplePreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const detailsTab = screen.getByRole("tab", { name: "Details" });
    const rawTab = screen.getByRole("tab", { name: "Raw" });

    detailsTab.focus();
    expect(document.activeElement).toBe(detailsTab);

    // ArrowRight activates Raw tab
    fireEvent.keyDown(detailsTab, { key: "ArrowRight" });
    expect(rawTab).toHaveAttribute("aria-selected", "true");

    // ArrowLeft activates Details tab
    fireEvent.keyDown(rawTab, { key: "ArrowLeft" });
    expect(detailsTab).toHaveAttribute("aria-selected", "true");
  });

  it("has zero axe accessibility violations in Raw tab mode", async () => {
    const { container } = render(
      <ClearSignModal
        preview={samplePreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const rawTab = screen.getByRole("tab", { name: "Raw" });
    fireEvent.click(rawTab);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
