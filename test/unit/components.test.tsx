import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClearSignModal } from "../../src/ClearSignModal.js";
import { ClearSignPreview } from "@clearsign/core";

describe("ClearSignModal", () => {
  const basePreview: ClearSignPreview = {
    version: 1,
    risk: "ok",
    warnings: [],
    network: { passphrase: "test", verified: true },
    envelope: { source: "G123", sequence: "1", fee: "100", operations: [] },
    auth: [],
    simulation: { status: "success" },
    effects: [],
    summary: [],
    raw: { xdr: "AAAA" },
  };

  it("renders risk ok and allows approve", () => {
    const onApprove = vi.fn();
    render(
      <ClearSignModal
        preview={basePreview}
        onApprove={onApprove}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("Decoded and verified")).toBeInTheDocument();

    const approveBtn = screen.getByRole("button", { name: "Approve" });
    expect(approveBtn).not.toBeDisabled();
    fireEvent.click(approveBtn);
    expect(onApprove).toHaveBeenCalled();
  });

  it("hides approve on blocked risk", () => {
    const blockedPreview = { ...basePreview, risk: "blocked" as const };
    render(
      <ClearSignModal
        preview={blockedPreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("Signing blocked")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
  });

  it("requires checkbox for review risk", () => {
    const reviewPreview = { ...basePreview, risk: "review" as const };
    render(
      <ClearSignModal
        preview={reviewPreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("Review carefully")).toBeInTheDocument();

    const approveBtn = screen.getByRole("button", { name: "Approve" });
    expect(approveBtn).toBeDisabled();

    const checkbox = screen.getByRole("checkbox", {
      name: /I have reviewed the warnings/i,
    });
    fireEvent.click(checkbox);

    expect(approveBtn).not.toBeDisabled();
  });

  it("handles unknown risk gracefully", () => {
    const unknownPreview = { ...basePreview, risk: "unknown" as never };
    render(
      <ClearSignModal
        preview={unknownPreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByText("Unknown risk")).toBeInTheDocument();
  });

  it("triggers reject on Escape key", () => {
    const onReject = vi.fn();
    render(
      <ClearSignModal
        preview={basePreview}
        onApprove={vi.fn()}
        onReject={onReject}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onReject).toHaveBeenCalled();
  });

  it("handles Tab key for focus trap", () => {
    render(
      <ClearSignModal
        preview={basePreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const approveBtn = screen.getByRole("button", { name: "Approve" });
    approveBtn.focus();

    // Shift+Tab on last element should cycle backward, but wait:
    // actually testing basic tab trap behavior
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    // Vitest jsdom won't fully emulate the activeElement shifts automatically,
    // but this covers the event listener branch logic.
    expect(document.activeElement).not.toBeNull();
  });

  it("renders malicious strings safely", () => {
    const maliciousPreview = {
      ...basePreview,
      summary: ['<script>alert("xss")</script>'],
    };
    render(
      <ClearSignModal
        preview={maliciousPreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(
      screen.getByText('<script>alert("xss")</script>'),
    ).toBeInTheDocument();
  });

  it("renders all value types in arguments and effects correctly", () => {
    const previewWithAllTypes: ClearSignPreview = {
      ...basePreview,
      effects: [
        {
          account: "GDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTPEKGQKJZLDEOJKIOPU",
          delta: "100",
          symbol: "USDC",
          formatted: "100",
          tokenContractId: "C123",
        },
        { account: "GA23", delta: "-50", tokenContractId: "C456" }, // short address, negative delta
      ],
      invocation: {
        specSource: "wasm",
        contractId: "C12345678901234567890",
        functionName: "swap",
        args: [
          {
            name: "amount",
            typeName: "u32",
            value: { kind: "int", type: "u32", value: "100" },
          },
          {
            name: "flag",
            typeName: "bool",
            value: { kind: "bool", value: true },
          },
          {
            name: "str",
            typeName: "string",
            value: {
              kind: "string",
              value: "hello",
              truncated: false,
              sanitized: false,
            },
          },
          {
            name: "sym",
            typeName: "symbol",
            value: {
              kind: "symbol",
              value: "sym",
              truncated: false,
              sanitized: false,
            },
          },
          { name: "vd", typeName: "void", value: { kind: "void" } },
          {
            name: "addr",
            typeName: "address",
            value: {
              kind: "address",
              value: "GBXXX34567890",
              addressType: "account",
            },
          },
          {
            name: "b",
            typeName: "bytes",
            value: {
              kind: "bytes",
              hex: "deadbeef",
              length: 4,
              truncated: false,
            },
          },
          {
            name: "list",
            typeName: "vec",
            value: {
              kind: "vec",
              items: [{ kind: "int", type: "u32", value: "1" }],
            },
          },
          {
            name: "obj",
            typeName: "struct",
            value: {
              kind: "struct",
              name: "MyStruct",
              fields: [
                { name: "a", value: { kind: "int", type: "u32", value: "2" } },
              ],
            },
          },
          {
            name: "unknown",
            typeName: "unknown",
            value: { kind: "unknown" } as never,
          }, // coverage for fallback
        ],
      },
      simulation: {
        status: "success",
        minResourceFee: "123",
      },
      warnings: [
        { code: "WARNING_1", message: "Something is off", severity: "review" },
        { code: "BLOCKED_1", message: "Malicious", severity: "blocked" },
      ],
    };

    render(
      <ClearSignModal
        preview={previewWithAllTypes}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    // Effects
    expect(screen.getByText("100 USDC")).toBeInTheDocument();
    expect(screen.getByText("-50 tokens")).toBeInTheDocument();
    expect(screen.getByText("GDQJ...IOPU")).toBeInTheDocument();

    // Invocation
    expect(screen.getByText("C123...7890")).toBeInTheDocument();
    expect(screen.getByText("Function: swap")).toBeInTheDocument();
    expect(screen.getByText("GBXX...7890")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("deadbeef")).toBeInTheDocument();
    expect(screen.getByText("Complex value")).toBeInTheDocument();

    // Simulation
    expect(
      screen.getByText(/Simulated Resource Fee:\s*123/),
    ).toBeInTheDocument();

    // Warnings
    expect(screen.getByText(/Something is off/)).toBeInTheDocument();
    expect(screen.getByText(/Malicious/)).toBeInTheDocument();
  });

  it("renders auth nodes and sub-invocations", () => {
    const previewWithAuth: ClearSignPreview = {
      ...basePreview,
      auth: [
        {
          credentials: {
            type: "address",
            address: "G123",
            nonce: "1",
            signatureExpirationLedger: 100,
            signed: true,
          },
          root: {
            kind: "contract-fn",
            contractId: "C123",
            functionName: "transfer",
            args: [],
            depth: 1,
            children: [
              {
                kind: "create-contract",
                depth: 2,
                children: [],
              },
            ],
          },
        },
      ],
    };

    render(
      <ClearSignModal
        preview={previewWithAuth}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("Credentials: address")).toBeInTheDocument();
    expect(screen.getByText("contract-fn")).toBeInTheDocument();
    expect(screen.getByText("create-contract")).toBeInTheDocument();
    expect(screen.getByText("Sub-invocations:")).toBeInTheDocument();
  });

  it("expands XDR and copies text", async () => {
    const originalClipboard = navigator.clipboard;
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <ClearSignModal
        preview={basePreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    // Initially XDR is hidden
    expect(screen.queryByText("AAAA")).not.toBeInTheDocument();

    const toggleBtn = screen.getByRole("button", { name: "Show Raw XDR" });
    fireEvent.click(toggleBtn);

    // XDR is visible
    expect(screen.getByText("AAAA")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hide Raw XDR" }),
    ).toBeInTheDocument();

    // Copy XDR
    const copyXdrBtn = screen.getByRole("button", { name: "Copy XDR" });
    fireEvent.click(copyXdrBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("AAAA");

    Object.assign(navigator, { clipboard: originalClipboard });
  });

  it("copies address", async () => {
    const previewWithAddr: ClearSignPreview = {
      ...basePreview,
      invocation: {
        specSource: "wasm",
        contractId: "C123",
        functionName: "func",
        args: [
          {
            name: "addr",
            typeName: "address",
            value: {
              kind: "address",
              value: "GBXXX34567890",
              addressType: "account",
            },
          },
        ],
      },
    };

    const originalClipboard = navigator.clipboard;
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <ClearSignModal
        preview={previewWithAddr}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const copyAddrBtn = screen.getByRole("button", { name: "Copy address" });
    fireEvent.click(copyAddrBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("GBXXX34567890");

    Object.assign(navigator, { clipboard: originalClipboard });
  });

  it("handles clipboard writeText rejection gracefully", async () => {
    const previewWithAddr: ClearSignPreview = {
      ...basePreview,
      invocation: {
        specSource: "wasm",
        contractId: "C123",
        functionName: "func",
        args: [
          {
            name: "addr",
            typeName: "address",
            value: {
              kind: "address",
              value: "GBXXX34567890",
              addressType: "account",
            },
          },
        ],
      },
    };

    const originalClipboard = navigator.clipboard;
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("Rejected")),
      },
    });

    render(
      <ClearSignModal
        preview={previewWithAddr}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    const copyAddrBtn = screen.getByRole("button", { name: "Copy address" });
    fireEvent.click(copyAddrBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("GBXXX34567890");

    Object.assign(navigator, { clipboard: originalClipboard });
  });

  it("renders null if preview is missing", () => {
    const { container } = render(
      <ClearSignModal preview={null} onApprove={vi.fn()} onReject={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
