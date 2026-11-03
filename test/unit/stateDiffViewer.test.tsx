import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StateDiffViewer, StateDiffItem } from "../../src/index.js";
import { ClearSignModal } from "../../src/ClearSignModal.js";
import { ClearSignPreview } from "@clearsign/core";

describe("StateDiffViewer Component", () => {
  const smallDiffs: StateDiffItem[] = [
    {
      account: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      delta: "-50",
      formatted: "-50.00",
      symbol: "USDC",
    },
    {
      account: "GA2C5RFPE6GCKMY3US5PAB6UZLKIGSPIUKSLRB6Q723BM2OARMDUBGVQ",
      delta: "50",
      formatted: "+50.00",
      symbol: "USDC",
    },
  ];

  it("renders small diff lists directly without pagination controls", () => {
    render(<StateDiffViewer entries={smallDiffs} pageSize={10} />);

    expect(screen.getByText("GBRP...OX2H")).toBeInTheDocument();
    expect(screen.getByText("GA2C...BGVQ")).toBeInTheDocument();
    expect(screen.getByText("-50.00 USDC")).toBeInTheDocument();
    expect(screen.getByText("+50.00 USDC")).toBeInTheDocument();

    // No pagination controls when total <= pageSize
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
  });

  it("renders generic state / storage diffs with type badges and before/after values", () => {
    const storageDiffs: StateDiffItem[] = [
      {
        key: "0102030405060708090a0b0c0d0e0f10",
        type: "modify",
        before: { balance: 100 },
        after: { balance: 250 },
      },
      {
        key: "11223344556677889900aabbccddeeff",
        type: "create",
        after: { owner: "Bob" },
      },
    ];

    render(<StateDiffViewer entries={storageDiffs} />);

    expect(screen.getByText("modify")).toBeInTheDocument();
    expect(screen.getByText("create")).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it("paginates entries when count exceeds page size", () => {
    const entries: StateDiffItem[] = Array.from({ length: 35 }, (_, i) => ({
      key: `key-entry-${i + 1}`,
      type: "modify",
      before: i,
      after: i + 1,
    }));

    render(
      <StateDiffViewer
        entries={entries}
        pageSize={10}
        pageSizeOptions={[10, 20]}
      />,
    );

    // Initial page shows 10 items
    expect(screen.getAllByTestId("diff-entry")).toHaveLength(10);
    expect(screen.getByText("Page 1 of 4 (35 entries)")).toBeInTheDocument();

    // Previous is disabled on page 1
    const prevBtn = screen.getByRole("button", { name: "Previous" });
    const nextBtn = screen.getByRole("button", { name: "Next" });
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Advance to page 2
    fireEvent.click(nextBtn);
    expect(screen.getByText("Page 2 of 4 (35 entries)")).toBeInTheDocument();
    expect(screen.getAllByTestId("diff-entry")).toHaveLength(10);
    expect(prevBtn).toBeEnabled();

    // Page size dropdown change
    const select = screen.getByLabelText("Per page:");
    fireEvent.change(select, { target: { value: "20" } });
    expect(screen.getByText("Page 1 of 2 (35 entries)")).toBeInTheDocument();
    expect(screen.getAllByTestId("diff-entry")).toHaveLength(20);
  });

  it("handles a 1,000-entry diff efficiently with pagination", () => {
    // Generate 1,000 balance delta entries
    const large1000Diff: StateDiffItem[] = Array.from(
      { length: 1000 },
      (_, i) => ({
        account: `GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7O${String(i).padStart(3, "0")}`,
        delta: String((i % 2 === 0 ? 1 : -1) * (i + 1)),
        formatted: `${(i % 2 === 0 ? "+" : "-") + (i + 1)}.00`,
        symbol: "XLM",
      }),
    );

    const startTime = performance.now();
    render(<StateDiffViewer entries={large1000Diff} pageSize={25} />);
    const renderDuration = performance.now() - startTime;

    // Fast render: rendering 1000 paginated entries should take < 500ms
    expect(renderDuration).toBeLessThan(500);

    // Only 25 entries mounted in DOM
    const renderedItems = screen.getAllByTestId("diff-entry");
    expect(renderedItems).toHaveLength(25);

    // Shows accurate status
    expect(screen.getByText("Page 1 of 40 (1000 entries)")).toBeInTheDocument();

    // First item has interactive reveal button (no value is available only in truncated form)
    const revealBtns = screen.getAllByRole("button", {
      name: /reveal full address/i,
    });
    expect(revealBtns.length).toBeGreaterThan(0);
    const firstRevealBtn = revealBtns[0];
    if (firstRevealBtn) {
      fireEvent.click(firstRevealBtn);
    }

    // Navigating works smoothly across pages
    const nextBtn = screen.getByRole("button", { name: "Next" });
    fireEvent.click(nextBtn);
    expect(screen.getByText("Page 2 of 40 (1000 entries)")).toBeInTheDocument();
    expect(screen.getAllByTestId("diff-entry")).toHaveLength(25);
  });

  it("integrates seamlessly into ClearSignModal for 1,000-entry effects", () => {
    const large1000Effects = Array.from({ length: 1000 }, (_, i) => ({
      account: `GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7O${String(i).padStart(3, "0")}`,
      delta: `${i + 1}`,
      formatted: `+${i + 1}.00`,
      symbol: "USDC",
      tokenContractId:
        "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
    }));

    const preview: ClearSignPreview = {
      version: 1,
      risk: "ok",
      warnings: [],
      network: { passphrase: "test", rpcMatches: true, signatureBound: true },
      envelope: { source: "G123", sequence: "1", fee: "100", operations: [] },
      simulation: { status: "success" },
      effects: large1000Effects,
      summary: [],
      raw: { xdr: "AAAA" },
      auth: [],
    };

    render(
      <ClearSignModal
        preview={preview}
        onApprove={() => {}}
        onReject={() => {}}
      />,
    );

    expect(screen.getByText("Balance Changes")).toBeInTheDocument();
    expect(
      screen.getByText("Page 1 of 100 (1000 entries)"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("diff-entry")).toHaveLength(10);
  });
});
