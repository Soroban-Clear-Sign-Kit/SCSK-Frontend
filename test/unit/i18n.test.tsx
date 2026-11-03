import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  DEFAULT_MESSAGES,
  pseudoLocalizeString,
  createPseudoLocalizedMessages,
} from "../../src/i18n/messages.js";
import {
  ClearSignProvider,
  useClearSignMessages,
} from "../../src/i18n/context.js";

describe("i18n message dictionary and provider", () => {
  it("provides comprehensive English defaults for all UI labels", () => {
    expect(DEFAULT_MESSAGES.modalTitle).toBe("Transaction Preview");
    expect(DEFAULT_MESSAGES.approve).toBe("Approve");
    expect(DEFAULT_MESSAGES.reject).toBe("Reject");
    expect(DEFAULT_MESSAGES.signing).toBe("Signing...");
    expect(DEFAULT_MESSAGES.riskBlocked).toBe("Signing blocked");
    expect(DEFAULT_MESSAGES.riskReview).toBe("Review carefully");
    expect(DEFAULT_MESSAGES.riskOk).toBe("Decoded and verified");
    expect(DEFAULT_MESSAGES.reviewCheckboxLabel).toBe(
      "I have reviewed the warnings",
    );
    expect(DEFAULT_MESSAGES.warningsBlockedTitle(3)).toBe("Blocked (3)");
    expect(DEFAULT_MESSAGES.warningsReviewTitle(2)).toBe("Review Required (2)");
    expect(DEFAULT_MESSAGES.warningsInfoTitle(1)).toBe("Informational (1)");
    expect(DEFAULT_MESSAGES.warningDocsAriaLabel("BAD_AUTH")).toBe(
      "Docs: BAD_AUTH documentation",
    );
  });

  it("allows consumer overrides via ClearSignProvider", () => {
    const customMessages = {
      modalTitle: "Aperçu de la transaction",
      approve: "Confirmer",
      reject: "Annuler",
    };

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ClearSignProvider messages={customMessages}>
        {children}
      </ClearSignProvider>
    );

    const { result } = renderHook(() => useClearSignMessages(), { wrapper });

    expect(result.current.modalTitle).toBe("Aperçu de la transaction");
    expect(result.current.approve).toBe("Confirmer");
    expect(result.current.reject).toBe("Annuler");
    // Non-overridden fallback to English defaults
    expect(result.current.signing).toBe("Signing...");
    expect(result.current.riskBlocked).toBe("Signing blocked");
  });

  it("supports local overrides in useClearSignMessages", () => {
    const { result } = renderHook(() =>
      useClearSignMessages({ approve: "Sign Now" }),
    );

    expect(result.current.approve).toBe("Sign Now");
    expect(result.current.modalTitle).toBe("Transaction Preview");
  });

  it("pseudoLocalizeString transforms Latin characters into accented equivalents and wraps in boundary brackets", () => {
    const localized = pseudoLocalizeString("Transaction Preview");
    expect(localized).toContain("[!!");
    expect(localized).toContain("!!]");
    expect(localized).not.toBe("Transaction Preview");
    expect(localized).toContain("Ṫřȧƞṡȧƈṫīǿƞ");
  });

  it("createPseudoLocalizedMessages produces full translated dictionary", () => {
    const pseudo = createPseudoLocalizedMessages();
    expect(pseudo.modalTitle).toContain("[!!");
    expect(pseudo.approve).toContain("[!!");
    expect(pseudo.warningsBlockedTitle(2)).toContain("[!!");
    expect(pseudo.warningDocsAriaLabel("AUTH")).toContain("[!!");
  });
});
