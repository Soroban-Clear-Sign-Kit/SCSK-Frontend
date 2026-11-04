// @vitest-environment node
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ClearSignModal } from "../../src/ClearSignModal.js";
import {
  AuthorizationTree,
  AuthTreeNode,
} from "../../src/components/AuthorizationTree.js";
import {
  WarningList,
  WarningViewModel,
} from "../../src/components/WarningList.js";
import { AddressHashView } from "../../src/components/AddressHashView.js";
import {
  StateDiffViewer,
  StateDiffItem,
} from "../../src/components/StateDiffViewer.js";
import { ClearSignProvider, DEFAULT_MESSAGES } from "../../src/i18n/index.js";
import {
  handleCopy,
  formatGroupedMonospace,
  shortenAddress,
} from "../../src/utils.js";
import { freighterAdapter } from "../../src/adapters/freighter.js";
import { stellarWalletsKitAdapter } from "../../src/adapters/stellar-wallets-kit.js";
import { ClearSignPreview } from "@clearsign/core";

describe("Server-Side Rendering (SSR) & Node Environment Safety", () => {
  it("runs in a pure Node.js environment where browser DOM globals are undefined", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
    // In Node 21+, globalThis.navigator exists as a lightweight platform object, but clipboard and DOM APIs are undefined
    expect(
      typeof (globalThis.navigator as unknown as { clipboard?: unknown })
        ?.clipboard,
    ).toBe("undefined");
  });

  const basePreview: ClearSignPreview = {
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
      sequence: "100",
      fee: "100",
      operations: [],
    },
    invocation: {
      specSource: "wasm",
      contractId: "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
      functionName: "transfer",
      args: [
        {
          name: "to",
          typeName: "address",
          value: {
            kind: "address",
            value: "GDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTPEKGQKJZLDEOJKIOPU",
            addressType: "account",
          },
        },
        {
          name: "amount",
          typeName: "i128",
          value: {
            kind: "int",
            type: "i128",
            value: "50000000",
          },
        },
      ],
    },
    auth: [
      {
        credentials: {
          type: "address",
          address: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
          nonce: "1",
          signatureExpirationLedger: 500,
          signed: true,
        },
        root: {
          kind: "contract-fn",
          contractId:
            "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
          functionName: "transfer",
          args: [],
          depth: 1,
          children: [],
        },
      },
    ],
    simulation: { status: "success" },
    effects: [
      {
        account: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        delta: "-50",
        formatted: "-50.00",
        symbol: "USDC",
        tokenContractId:
          "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
      },
    ],
    summary: ["Transfer 50 USDC to Bob"],
    raw: {
      xdr: "AAAAAgAAAABl0k+u9eD8z9vE...",
    },
  };

  describe("ClearSignModal SSR Rendering across all states", () => {
    it("renders 'ready' state to static markup without DOM access", () => {
      const html = renderToString(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain("Transaction Preview");
      expect(html).toContain("Decoded and verified");
      expect(html).toContain("Transfer 50 USDC to Bob");
      expect(html).toContain("Approve");
      expect(html).toContain("Reject");
    });

    it("renders 'loading' state to static markup", () => {
      const html = renderToString(
        <ClearSignModal
          preview={null}
          loading={true}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(html).toContain('aria-busy="true"');
      expect(html).toContain("Decoding and simulating the transaction…");
      expect(html).toContain("Reject");
    });

    it("renders 'review' state with warning list to static markup", () => {
      const reviewPreview: ClearSignPreview = {
        ...basePreview,
        risk: "review",
        warnings: [
          {
            code: "UNVERIFIED_CONTRACT",
            severity: "review",
            message: "Target contract is unverified",
          },
        ],
      };

      const html = renderToString(
        <ClearSignModal
          preview={reviewPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(html).toContain("Review carefully");
      expect(html).toContain("UNVERIFIED_CONTRACT");
      expect(html).toContain("Target contract is unverified");
      expect(html).toContain('type="checkbox"');
    });

    it("renders 'blocked' state to static markup without approve button", () => {
      const blockedPreview: ClearSignPreview = {
        ...basePreview,
        risk: "blocked",
        warnings: [
          {
            code: "DRAIN_ATTACK",
            severity: "blocked",
            message: "Unlimited balance drain",
          },
        ],
      };

      const html = renderToString(
        <ClearSignModal
          preview={blockedPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(html).toContain("Signing blocked");
      expect(html).toContain("DRAIN_ATTACK");
      expect(html).not.toContain("Approve");
      expect(html).toContain("Reject");
    });

    it("renders 'error' state to static markup", () => {
      const html = renderToString(
        <ClearSignModal
          preview={null}
          status="error"
          errorMessage="SimulateTransaction failed: Horizon RPC connection timeout"
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain(
        "SimulateTransaction failed: Horizon RPC connection timeout",
      );
      expect(html).toContain("Reject");
      expect(html).not.toContain("Approve");
    });

    it("renders 'success' state to static markup", () => {
      const html = renderToString(
        <ClearSignModal
          preview={basePreview}
          status="success"
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      );

      expect(html).toContain("Transaction Signed");
      expect(html).toContain("Close");
      expect(html).not.toContain("Approve");
    });
  });

  describe("Sub-components SSR Rendering", () => {
    it("renders AuthorizationTree on server", () => {
      const mockAuthTree: AuthTreeNode[] = [
        {
          id: "node-1",
          contract: "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
          functionName: "swap",
          args: [
            {
              name: "amount",
              value: { kind: "int", type: "u32", value: "100" },
            },
          ],
          children: [],
        },
      ];

      const html = renderToString(<AuthorizationTree nodes={mockAuthTree} />);

      expect(html).toContain('role="tree"');
      expect(html).toContain('role="treeitem"');
      expect(html).toContain("swap");
      expect(html).toContain("amount");
    });

    it("renders WarningList on server", () => {
      const warnings: WarningViewModel[] = [
        {
          code: "TEST_WARN",
          severity: "review",
          title: "Warning Title",
          explanation: "Warning explanation",
          docsUrl: "https://example.com/docs",
        },
      ];

      const html = renderToString(<WarningList warnings={warnings} />);

      expect(html).toContain("TEST_WARN");
      expect(html).toContain("Warning explanation");
      expect(html).toContain("https://example.com/docs");
    });

    it("renders AddressHashView on server", () => {
      const html = renderToString(
        <AddressHashView
          value="GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"
          kind="address"
        />,
      );

      expect(html).toContain("GBRP...OX2H");
    });

    it("renders StateDiffViewer on server", () => {
      const diffs: StateDiffItem[] = [
        {
          type: "create",
          key: "Balance",
          after: "100 XLM",
        },
      ];

      const html = renderToString(<StateDiffViewer entries={diffs} />);

      expect(html).toContain("Balance");
      expect(html).toContain("100 XLM");
    });

    it("renders with ClearSignProvider i18n overrides on server", () => {
      const html = renderToString(
        <ClearSignProvider
          messages={{
            ...DEFAULT_MESSAGES,
            modalTitle: "Previsualización de Transacción",
          }}
        >
          <ClearSignModal
            preview={basePreview}
            onApprove={vi.fn()}
            onReject={vi.fn()}
          />
        </ClearSignProvider>,
      );

      expect(html).toContain("Previsualización de Transacción");
    });
  });

  describe("Utility & Adapter Import-Time and Runtime Safety", () => {
    it("safely invokes handleCopy in Node without throwing ReferenceError", () => {
      expect(() => handleCopy("text-to-copy")).not.toThrow();
    });

    it("formats grouped monospace chunks safely in Node", () => {
      expect(formatGroupedMonospace("GBRPYHIL")).toBe("GBRP YHIL");
      expect(
        shortenAddress(
          "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        ),
      ).toBe("GBRP...OX2H");
    });

    it("initializes freighterAdapter without accessing window during instantiation", () => {
      const adapter = freighterAdapter();
      expect(adapter).toBeDefined();
      expect(typeof adapter.getAddress).toBe("function");
      expect(typeof adapter.signTransaction).toBe("function");
    });

    it("initializes stellarWalletsKitAdapter safely", () => {
      const mockKit = {
        getPublicKey: vi.fn(),
        signTransaction: vi.fn(),
      };
      const adapter = stellarWalletsKitAdapter({ kit: mockKit });
      expect(adapter).toBeDefined();
      expect(typeof adapter.getAddress).toBe("function");
      expect(typeof adapter.signTransaction).toBe("function");
    });
  });
});
