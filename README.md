# Soroban Clear-Sign Kit - Frontend React Kit (`@clearsign/react`)

[![CI](https://github.com/Soroban-Clear-Sign-Kit/SCSK-Frontend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Soroban-Clear-Sign-Kit/SCSK-Frontend/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@clearsign/react.svg)](https://www.npmjs.com/package/@clearsign/react)

The Frontend package of the **Soroban Clear-Sign Kit (SCSK)** provides React context providers, hooks, and presentation components for inspecting, simulating, and previewing Soroban and Stellar transactions with human-readable clarity.

## Features

- **`ClearSignModal`**: A plug-and-play UI component to safely preview, simulate, and request signatures for transactions.
- **`useClearSign`**: A hook that manages the UI state for transaction previews and leverages `@clearsign/core` to build transaction summaries and decode arguments.
- **Accessibility & UX**: Built with modern CSS modules, offering clean diffs, warning cards, and structured invocation displays. The dialog traps focus, closes on Escape, returns focus to the trigger, announces review and blocked risk as alerts, and shows a busy state while the preview builds.
- **Fail-closed**: Approve is only offered for `ok` and `review` previews, `review` needs an explicit acknowledgement for each preview, and unrecognised risk levels cannot be approved.
- **Theming & i18n**: Fully customizable without forking using CSS custom property tokens, automatic light/dark switching and manual overrides, WCAG 2.1 AA contrast compliance, message dictionary overrides (`ClearSignProvider`), pseudo-localization, and RTL layout support. See [docs/THEMING_AND_I18N.md](docs/THEMING_AND_I18N.md).
- **Verification & Raw View**: Accessible 'Raw' tab with Base64 transaction envelope and formatted JSON, one-click copy buttons, grouped 4-character monospace chunk reveals for addresses and hashes, and paginated diff viewers handling 1,000+ entries without performance loss. Zero value is available only in truncated form. See [docs/VERIFICATION_AND_RAW.md](docs/VERIFICATION_AND_RAW.md).
- **Testing & Visual Regressions**: Testing Library unit tests across all 6 modal states (`loading`, `ready`, `review`, `blocked`, `error`, `success`), Playwright e2e visual regression test suite in light and dark themes (12 baseline snapshots), strict coverage thresholds, and automated CI failure diff artifact uploads. See [docs/TESTING_AND_VISUAL.md](docs/TESTING_AND_VISUAL.md).
- **SSR & Next.js Safe**: Zero import-time browser accesses (`window`, `document`, `navigator`), built-in `"use client";` directives in all distribution outputs, pure Node.js `react-dom/server` rendering verification, and ready-to-use recipes for Next.js App Router and Pages Router. See [docs/NEXTJS_AND_SSR.md](docs/NEXTJS_AND_SSR.md).

## Usage

```tsx
import { ClearSignModal, useClearSign } from "@clearsign/react";
import "@clearsign/react/styles.css";

function SignButton({ xdr }: { xdr: string }) {
  const { open, preview, loading, requestApproval, onApprove, onReject } =
    useClearSign({
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
    });

  return (
    <>
      <button
        onClick={() => requestApproval(xdr).then((ok) => ok && sign(xdr))}
      >
        Sign
      </button>
      {open && (
        <ClearSignModal
          preview={preview}
          loading={loading}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </>
  );
}
```

`requestApproval` resolves `true` only when the user approves a preview whose risk is `ok` or `review`. It resolves `false` when the user rejects, when a newer request supersedes it, when the component unmounts, or when the preview cannot be built.

### Guarding an existing wallet call

```ts
import { withClearSign } from "@clearsign/react";

const safeSignTransaction = withClearSign(signTransaction, { requestApproval });
// Throws ClearSignRejectedError unless the user approved the preview.
```

The wrapped function reads the signer from `signerAddress`, `address` or `publicKey`, and forwards `intent` and `specs`, from the wallet options object (its second argument).

## Installation

```bash
pnpm install
```

## Running the Demo

A full Vite + React demo application is included:

```bash
cd example
pnpm install
pnpm run dev
```

## Building

```bash
pnpm run build
```

## Package Distribution & Published CSS

`@clearsign/react` is built for maximum compatibility across modern ESM, CommonJS, and legacy bundlers with zero type resolution flaws:

| Entry Point                | Import Path                                     | Description                                           | Size Budget          |
| :------------------------- | :---------------------------------------------- | :---------------------------------------------------- | :------------------- |
| **Main Component & Hooks** | `@clearsign/react`                              | `ClearSignModal`, `useClearSign`, `ClearSignProvider` | `< 20 KB` (brotlied) |
| **Freighter Adapter**      | `@clearsign/react/adapters/freighter`           | Freighter wallet signing adapter                      | `< 2 KB` (brotlied)  |
| **Stellar Wallets Kit**    | `@clearsign/react/adapters/stellar-wallets-kit` | Creit Tech StellarWalletsKit adapter                  | `< 2 KB` (brotlied)  |
| **Published Stylesheet**   | `@clearsign/react/styles.css`                   | CSS tokens, layouts, and animations                   | `< 5 KB` (brotlied)  |

### Stylesheet Import

Always include the stylesheet once in your application entry file or root layout:

```tsx
import "@clearsign/react/styles.css";
```

### Packaging & Quality Verification

- **Exports & Dual ESM/CJS Types**: Verified via `publint` and `@arethetypeswrong/cli` across `node10`, `node16 (CJS/ESM)`, and `bundler` resolution modes.
- **Size Budgets**: Enforced via `size-limit` per entry point to guarantee light bundle footprints.
- **Tarball Consumer Test**: Automated test installs packed `.tgz` into a clean Vite application and renders the modal component.

```bash
# Run publint and arethetypeswrong audits
pnpm run check:package

# Verify size-limit budgets
pnpm run check:size

# Test packed tarball in an isolated Vite application
pnpm run test:tarball
```

## Testing

```bash
# Run all unit tests
pnpm test

# Run unit tests with coverage thresholds check
pnpm run test:coverage

# Run Playwright visual regression tests
pnpm run test:e2e

# Update Playwright snapshots
npx playwright test --update-snapshots
```
