import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AddressHashView, formatGroupedMonospace } from "../../src/index.js";
import { ClearSignProvider } from "../../src/i18n/index.js";

describe("formatGroupedMonospace Utility", () => {
  it("returns empty string for empty input", () => {
    expect(formatGroupedMonospace("")).toBe("");
  });

  it("returns short strings unchanged when shorter than chunk size", () => {
    expect(formatGroupedMonospace("ABC", 4)).toBe("ABC");
    expect(formatGroupedMonospace("ABCD", 4)).toBe("ABCD");
  });

  it("splits a 56-char Stellar address into 14 groups of 4 chars", () => {
    const address = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    const chunked = formatGroupedMonospace(address, 4);
    const groups = chunked.split(" ");
    expect(groups).toHaveLength(14);
    expect(groups[0]).toBe("GBRP");
    expect(groups[1]).toBe("YHIL");
    expect(groups[13]).toBe("OX2H");
    expect(chunked.replace(/\s+/g, "")).toBe(address);
  });

  it("supports custom chunk sizes", () => {
    const hex = "0123456789abcdef";
    expect(formatGroupedMonospace(hex, 8)).toBe("01234567 89abcdef");
    expect(formatGroupedMonospace(hex, 2)).toBe("01 23 45 67 89 ab cd ef");
  });
});

describe("AddressHashView Component", () => {
  const sampleAddress =
    "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
  const sampleHash =
    "4d6f636b5472616e73616374696f6e4861736831323334353637383930616263";

  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders middle-truncated address by default with expand and copy buttons", () => {
    render(<AddressHashView value={sampleAddress} />);

    // Default 4 prefix and 4 suffix
    expect(screen.getByText("GBRP...OX2H")).toBeInTheDocument();

    const expandBtn = screen.getByRole("button", {
      name: /reveal full address/i,
    });
    expect(expandBtn).toBeInTheDocument();
    expect(expandBtn).toHaveAttribute("aria-expanded", "false");

    const copyBtn = screen.getByRole("button", { name: /copy address/i });
    expect(copyBtn).toBeInTheDocument();
  });

  it("reveals full value in grouped monospace chunks on demand", () => {
    render(<AddressHashView value={sampleAddress} />);

    const expandBtn = screen.getByRole("button", {
      name: /reveal full address/i,
    });
    fireEvent.click(expandBtn);

    // Grouped monospace should now be rendered
    const expectedGrouped = formatGroupedMonospace(sampleAddress, 4);
    expect(screen.getByText(expectedGrouped)).toBeInTheDocument();

    // Button should now be for collapsing
    const collapseBtn = screen.getByRole("button", {
      name: /hide full address/i,
    });
    expect(collapseBtn).toBeInTheDocument();
    expect(collapseBtn).toHaveAttribute("aria-expanded", "true");

    // Collapsing restores truncated representation
    fireEvent.click(collapseBtn);
    expect(screen.getByText("GBRP...OX2H")).toBeInTheDocument();
  });

  it("copies full untruncated value to clipboard when copy button is clicked", () => {
    render(<AddressHashView value={sampleAddress} />);

    const copyBtn = screen.getByRole("button", { name: /copy address/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith(sampleAddress);

    // Shows "Copied!" feedback
    expect(screen.getByText("Copied!")).toBeInTheDocument();

    // Feedback reverts after 2000ms
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
  });

  it("handles hash kind with appropriate aria labels", () => {
    render(<AddressHashView value={sampleHash} kind="hash" />);

    // Truncated default
    expect(screen.getByText("4d6f...6263")).toBeInTheDocument();

    const expandBtn = screen.getByRole("button", {
      name: /reveal full value/i,
    });
    expect(expandBtn).toBeInTheDocument();

    fireEvent.click(expandBtn);
    expect(
      screen.getByText(formatGroupedMonospace(sampleHash, 4)),
    ).toBeInTheDocument();

    const copyBtn = screen.getByRole("button", { name: /copy full value/i });
    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalledWith(sampleHash);
  });

  it("renders short values without truncation or expand toggle", () => {
    render(<AddressHashView value="XLM" />);

    expect(screen.getByText("XLM")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reveal/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });

  it("respects custom prefix and suffix lengths", () => {
    render(
      <AddressHashView
        value={sampleAddress}
        prefixLength={6}
        suffixLength={6}
      />,
    );

    expect(screen.getByText("GBRPYH...C7OX2H")).toBeInTheDocument();
  });

  it("respects custom messages from provider", () => {
    const customMessages = {
      revealFullAddress: "Mostrar dirección completa",
      hideFullAddress: "Ocultar dirección",
      copyAddressAriaLabel: "Copiar dirección",
      copied: "¡Copiado!",
      copy: "Copiar",
    };

    render(
      <ClearSignProvider messages={customMessages}>
        <AddressHashView value={sampleAddress} />
      </ClearSignProvider>,
    );

    const expandBtn = screen.getByRole("button", {
      name: "Mostrar dirección completa",
    });
    expect(expandBtn).toBeInTheDocument();

    const copyBtn = screen.getByRole("button", { name: "Copiar dirección" });
    expect(copyBtn).toHaveTextContent("Copiar");

    fireEvent.click(copyBtn);
    expect(screen.getByText("¡Copiado!")).toBeInTheDocument();
  });
});
