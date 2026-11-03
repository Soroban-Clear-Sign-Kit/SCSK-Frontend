import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClearSignModal } from "../../src/ClearSignModal.js";
import {
  ClearSignProvider,
  createPseudoLocalizedMessages,
  DEFAULT_MESSAGES,
  ClearSignMessages,
} from "../../src/i18n/index.js";
import { ClearSignPreview } from "@clearsign/core";

const mockPreview = {
  version: 1,
  risk: "review",
  summary: ["Transfer 50 USDC to Bob"],
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
  invocation: {
    contractId: "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
    functionName: "transfer",
    args: [
      {
        name: "to",
        value: {
          kind: "address",
          value: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
          addressType: "account",
        },
      },
      {
        name: "amount",
        value: {
          kind: "int",
          value: "50",
        },
      },
    ],
  },
  auth: [
    {
      credentials: {
        type: "source-account",
        address: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      },
      root: {
        kind: "contract-fn",
        contractId: "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
        functionName: "transfer",
        args: [],
      },
    },
  ],
  warnings: [
    {
      code: "UNKNOWN_RECIPIENT",
      severity: "review",
      message: "The recipient account is newly created.",
    },
  ],
  network: {
    passphrase: "Test SDF Network ; September 2015",
    rpcMatches: true,
    signatureBound: true,
  },
  envelope: {
    source: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
    sequence: "123456",
    fee: "100",
    operations: [{ type: "invokeHostFunction", decoded: true }],
  },
  simulation: {
    status: "success",
    minResourceFee: "150",
  },
  raw: {
    xdr: "AAAAAgAAAAA...",
  },
} as unknown as ClearSignPreview;

describe("Pseudo-Localization Test", () => {
  it("renders all user-facing labels in pseudo-localized format when pseudo-localization is active", () => {
    const pseudoMessages = createPseudoLocalizedMessages();

    render(
      <ClearSignProvider messages={pseudoMessages}>
        <ClearSignModal
          preview={mockPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      </ClearSignProvider>,
    );

    // Title should be pseudo-localized with [!! ... !!]
    const headings = screen.getAllByRole("heading");
    const titleHeading = headings.find((h) =>
      h.textContent?.includes(pseudoMessages.modalTitle),
    );
    expect(titleHeading).toBeDefined();
    expect(titleHeading?.textContent).toContain("[!!");
    expect(titleHeading?.textContent).toContain("!!]");

    // Section headings should all be pseudo-localized
    expect(screen.getByText(pseudoMessages.sectionSummary)).toBeInTheDocument();
    expect(
      screen.getByText(pseudoMessages.sectionBalanceChanges),
    ).toBeInTheDocument();
    expect(
      screen.getByText(pseudoMessages.sectionCallDetails),
    ).toBeInTheDocument();
    expect(
      screen.getByText(pseudoMessages.sectionAuthorizations),
    ).toBeInTheDocument();
    expect(screen.getByText(pseudoMessages.sectionNetwork)).toBeInTheDocument();
    expect(screen.getByText(pseudoMessages.sectionFees)).toBeInTheDocument();
    expect(
      screen.getByText(pseudoMessages.sectionWarnings),
    ).toBeInTheDocument();

    // Risk banner should be pseudo-localized
    expect(screen.getByText(pseudoMessages.riskReview)).toBeInTheDocument();

    // Action buttons should be pseudo-localized
    expect(
      screen.getByRole("button", { name: pseudoMessages.reject }),
    ).toBeInTheDocument();

    // Checkbox label should be pseudo-localized
    expect(
      screen.getByText(pseudoMessages.reviewCheckboxLabel),
    ).toBeInTheDocument();

    // Warning list titles should be pseudo-localized
    expect(
      screen.getByText(pseudoMessages.warningsReviewTitle(1)),
    ).toBeInTheDocument();
  });
});

describe("No Hard-Coded Strings Verification", () => {
  it("replaces every string in the UI when custom messages dictionary is provided", () => {
    // Generate an all-prefixed messages dictionary
    const prefixMessages: Partial<ClearSignMessages> = {};
    for (const [key, val] of Object.entries(DEFAULT_MESSAGES)) {
      if (typeof val === "string") {
        (prefixMessages as Record<string, unknown>)[key] = `PREFIX_${val}`;
      } else if (typeof val === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prefixMessages as Record<string, unknown>)[key] = (...args: any[]) =>
          `PREFIX_${(val as (...a: unknown[]) => string)(...args)}`;
      }
    }

    const { container } = render(
      <ClearSignProvider messages={prefixMessages}>
        <ClearSignModal
          preview={mockPreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      </ClearSignProvider>,
    );

    // Verify key UI elements contain the PREFIX_
    expect(screen.getByText("PREFIX_Transaction Preview")).toBeInTheDocument();
    expect(screen.getByText("PREFIX_Summary")).toBeInTheDocument();
    expect(screen.getByText("PREFIX_Balance Changes")).toBeInTheDocument();
    expect(screen.getByText("PREFIX_Call Details")).toBeInTheDocument();
    expect(screen.getByText("PREFIX_Authorizations")).toBeInTheDocument();
    expect(screen.getByText("PREFIX_Network")).toBeInTheDocument();
    expect(screen.getByText("PREFIX_Fees")).toBeInTheDocument();
    expect(screen.getByText("PREFIX_Warnings")).toBeInTheDocument();
    expect(screen.getByText("PREFIX_Review carefully")).toBeInTheDocument();
    expect(
      screen.getByText("PREFIX_I have reviewed the warnings"),
    ).toBeInTheDocument();

    // Ensure none of the default hard-coded English strings appear as untranslated UI text
    const defaultStaticStrings = [
      DEFAULT_MESSAGES.modalTitle,
      DEFAULT_MESSAGES.sectionSummary,
      DEFAULT_MESSAGES.sectionBalanceChanges,
      DEFAULT_MESSAGES.sectionCallDetails,
      DEFAULT_MESSAGES.sectionAuthorizations,
      DEFAULT_MESSAGES.sectionNetwork,
      DEFAULT_MESSAGES.sectionFees,
      DEFAULT_MESSAGES.sectionWarnings,
      DEFAULT_MESSAGES.riskReview,
      DEFAULT_MESSAGES.reviewCheckboxLabel,
    ];

    for (const str of defaultStaticStrings) {
      // Find elements whose text exactly equals the un-prefixed English string
      const matches = Array.from(container.querySelectorAll("*")).filter(
        (el) => el.children.length === 0 && el.textContent === str,
      );
      expect(matches.length).toBe(0);
    }
  });

  it("translates loading dialog strings cleanly without hard-coded fallbacks", () => {
    const customMessages = {
      modalTitle: "CUSTOM_LOADING_TITLE",
      decodingPreview: "CUSTOM_DECODING_TEXT",
      reject: "CUSTOM_CANCEL",
    };

    render(
      <ClearSignModal
        preview={null}
        loading={true}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        messages={customMessages}
      />,
    );

    expect(screen.getByText("CUSTOM_LOADING_TITLE")).toBeInTheDocument();
    expect(screen.getByText("CUSTOM_DECODING_TEXT")).toBeInTheDocument();
    expect(screen.getByText("CUSTOM_CANCEL")).toBeInTheDocument();
  });
});

describe("Right-to-Left (RTL) Layout Check", () => {
  it("renders properly under dir='rtl' and preserves full interactivity", () => {
    const handleApprove = vi.fn();
    const handleReject = vi.fn();

    const { container } = render(
      <div dir="rtl" data-testid="rtl-wrapper">
        <ClearSignModal
          preview={mockPreview}
          onApprove={handleApprove}
          onReject={handleReject}
          useAuthorizationTree={true}
        />
      </div>,
    );

    const rtlWrapper = screen.getByTestId("rtl-wrapper");
    expect(rtlWrapper).toHaveAttribute("dir", "rtl");

    // Modal dialog is rendered within RTL context
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Raw XDR expansion in RTL
    const showXdrBtn = screen.getByText("Show Raw XDR");
    fireEvent.click(showXdrBtn);
    expect(screen.getByText("Hide Raw XDR")).toBeInTheDocument();
    expect(screen.getByText("Copy XDR")).toBeInTheDocument();

    // Checkbox toggle and approve in RTL
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    const approveBtn = screen.getByRole("button", { name: "Approve" });
    fireEvent.click(approveBtn);
    expect(handleApprove).toHaveBeenCalledTimes(1);

    // Reject in RTL
    const rejectBtn = screen.getByRole("button", { name: "Reject" });
    fireEvent.click(rejectBtn);
    expect(handleReject).toHaveBeenCalledTimes(1);

    // Verify tree items rendered with WAI-ARIA roles in RTL
    const tree = container.querySelector('[role="tree"]');
    expect(tree).toBeInTheDocument();
  });
});

describe("Theme Override Attribute Check", () => {
  it("applies data-theme='dark' when theme='dark' prop is passed", () => {
    render(
      <ClearSignModal
        preview={mockPreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        theme="dark"
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-theme", "dark");
  });

  it("applies data-theme='light' when theme='light' prop is passed", () => {
    render(
      <ClearSignModal
        preview={mockPreview}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        theme="light"
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-theme", "light");
  });
});
