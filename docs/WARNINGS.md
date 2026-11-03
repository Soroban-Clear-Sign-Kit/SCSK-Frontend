# Warning System & Signing Gating Specification

This document details how warnings are modeled, grouped, and how they gate signing in `@clearsign/react`.

## View Model: `WarningViewModel`

All warnings from core simulation or external sources are mapped to a local, predictable view-model:

```typescript
export type WarningSeverity = "blocked" | "review" | "info";

export interface WarningViewModel {
  code: string;
  severity: WarningSeverity;
  title: string;
  explanation: string;
  docsUrl?: string;
}
```

The helper function `mapToWarningViewModel(raw: unknown): WarningViewModel` normalizes arbitrary inputs:

- Generates human-friendly titles from screaming snake case codes (e.g., `UNTRUSTED_CONTRACT` -> `Untrusted Contract`).
- Extracts or falls back to standard explanation messages.
- Computes canonical documentation links (`https://docs.clearsign.io/warnings/{code}`).

## Decision Table (Severity × UI Behavior)

The table below outlines the exact behavior for each warning severity level and how signing is gated:

| Severity      | Risk Banner                                                      | Banner ARIA Role | Sign / Approve Action                                                                                           | Explicit Acknowledgment Required?                  | Live Region Announcement                             | Documentation Link                        |
| :------------ | :--------------------------------------------------------------- | :--------------- | :-------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- | :--------------------------------------------------- | :---------------------------------------- |
| **`blocked`** | Red "Signing blocked" + `ShieldAlertIcon`                        | `role="alert"`   | **Disabled / Hidden**: Signing is strictly disabled and props cannot re-enable it. Approving is a strict no-op. | N/A (Cannot be signed even with acknowledgement)   | `"Transaction signing blocked: high risk detected."` | Provided (`Docs ↗` with accessible label) |
| **`review`**  | Amber "Review carefully" + `AlertTriangleIcon`                   | `role="alert"`   | **Gated**: Sign button is disabled until the user checks the explicit acknowledgment checkbox.                  | **Yes**: `"I have reviewed the warnings"` checkbox | `"Transaction requires review: warnings detected."`  | Provided (`Docs ↗` with accessible label) |
| **`info`**    | Green "Decoded and verified" + `CheckCircleIcon` (or unaffected) | N/A              | **Enabled**: Sign button is enabled immediately. Informational items are displayed for transparency.            | **No**                                             | `"Transaction preview ready."`                       | Provided (`Docs ↗` with accessible label) |
| **`ok`**      | Green "Decoded and verified" + `CheckCircleIcon`                 | N/A              | **Enabled**: Sign button is enabled immediately.                                                                | **No**                                             | `"Transaction preview ready. Decoded and verified."` | N/A                                       |

### Precedence & Gating Rules

1. **`blocked` Trumps Everything**: If any warning has `severity: "blocked"`, or the transaction risk is `"blocked"`, or modal prop `status="blocked"`, signing is completely gated. No other prop, status, or checkbox can bypass this.
2. **Review Gating**: When in `review` state without any `blocked` warnings, the Approve button remains disabled until the acknowledgment checkbox (`reviewed`) is explicitly checked.
3. **Transaction Change Resets Acknowledgment**: When the transaction changes (identified by change in raw XDR, sequence number, or preview object), the acknowledgment resets to unchecked (`false`). The user must re-acknowledge warnings for the new transaction.
4. **Callback Reports Acknowledged Warnings**: When approved, `onApprove(acknowledgedWarnings)` passes the list of `WarningViewModel[]` that were acknowledged, enabling audit logs and wallet telemetry.
5. **Signing in Blocked State is a Strict No-op**: Even if `handleApprove` is called programmatically or via synthetic events, it returns immediately without invoking `onApprove`.

## Component: `WarningList`

The `WarningList` component groups warnings by severity into distinct semantic sections:

1. **🛑 Blocked**: Warnings preventing transaction execution.
2. **⚠️ Review Required**: Warnings requiring user inspection and acknowledgment.
3. **ℹ️ Informational**: Informational notices and hints.

Each item renders the warning code, human-readable title, detailed explanation, and an accessible link to documentation (`Docs ↗`).

```tsx
import { WarningList } from "@clearsign/react";

<WarningList warnings={mappedWarnings} />;
```
