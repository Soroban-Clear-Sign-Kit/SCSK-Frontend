# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Per-entrypoint size-limit budgets enforcing `< 20 KB` for core ESM, `< 25 KB` for core CJS, `< 2 KB` for wallet adapters, and `< 5 KB` for published CSS (`.size-limit.json` and `pnpm run check:size`).
- Comprehensive packaging validation script (`pnpm run check:package`) integrating `publint` and `@arethetypeswrong/cli` into CI.
- Automated clean Vite consumer verification test (`scripts/test-packed-tarball.mjs` and `pnpm run test:tarball`) installing packed `.tgz` into an isolated Vite project and rendering `ClearSignModal`.
- Published stylesheet documentation and import path specifications in `README.md`.

### Changed

- Updated `package.json` exports map to explicit nested `import` and `require` conditions with dedicated `.d.ts` and `.d.cts` dual type declarations.
- Created legacy Node 10 subpath proxies in `adapters/freighter/package.json` and `adapters/stellar-wallets-kit/package.json` ensuring 100% green resolution across all module resolution algorithms.
- Configured explicit `sideEffects` and `engines` fields in `package.json`.

- SSR and Server-Side Rendering support for Next.js (App Router and Pages Router), Remix, Astro, and Vite SSR.
- Built-in `"use client";` banner directive injected in tsup build configs and source entry points (`@clearsign/react`, `@clearsign/react/adapters/freighter`, `@clearsign/react/adapters/stellar-wallets-kit`).
- Comprehensive pure Node.js SSR test suite (`test/unit/ssr.test.tsx`) testing all 6 modal states, subcomponents, and adapters with `renderToString` from `react-dom/server`.
- Next.js and SSR integration guide and client/server recipes (`docs/NEXTJS_AND_SSR.md`).

### Changed

- Defensively guarded clipboard access (`navigator.clipboard.writeText`) in `src/utils.ts` to prevent reference errors in Node / SSR runtimes where `navigator.clipboard` is undefined.

- Support for all six modal states (`loading`, `ready`, `review`, `blocked`, `error`, `success`) in `ClearSignModal` with specific risk banners, live announcements, and gating controls.
- Comprehensive Testing Library unit test suite for all modal states (`test/unit/modalStates.test.tsx`).
- Playwright end-to-end visual regression test suite (`test/e2e/visual.spec.ts`) with 12 baseline snapshots across light and dark themes.
- Interactive modal state and theme URL controller in `example/src/App.tsx` (`?state=...&theme=...`).
- Strict Vitest coverage thresholds enforced at production levels (90% stmts, 85% branch, 95% funcs, 90% lines) and `test:coverage` script.
- CI visual regression testing with automated failure diff uploads via `actions/upload-artifact@v4`.
- Testing and visual regression architecture documentation (`docs/TESTING_AND_VISUAL.md`).

- Accessible 'Raw' tab in `ClearSignModal` featuring transaction envelope XDR (base64) and formatted decoded JSON with dedicated copy buttons and copy status feedback.
- WAI-ARIA compliant tab navigation between 'Details' and 'Raw' tabs with arrow key switching.
- `AddressHashView` component and `formatGroupedMonospace` utility providing middle-truncated default previews, on-demand full reveals in grouped 4-character monospace chunks, and direct clipboard copying.
- `StateDiffViewer` component and `StateDiffItem` interface providing pagination and virtualization for balance changes and contract state modifications, handling 1,000+ diff entries smoothly.
- `stateDiffs` prop on `ClearSignModal` for custom state modification feeds.
- Comprehensive verification and raw view documentation (`docs/VERIFICATION_AND_RAW.md`).
- Automated test suites for `AddressHashView` (`test/unit/addressHashView.test.tsx`), `StateDiffViewer` with 1,000-entry diff benchmarks (`test/unit/stateDiffViewer.test.tsx`), and `Raw` tab with copy behaviors (`test/unit/rawTab.test.tsx`).
- `ClearSignMessages` interface, `DEFAULT_MESSAGES`, `ClearSignProvider`, and `useClearSignMessages` hook for full internationalization and string overrides without hard-coded strings.
- Pseudo-localization utilities `pseudoLocalizeString` and `createPseudoLocalizedMessages` for stress-testing UI with character dilation and diacritics.
- Complete design tokens via CSS custom properties (`--clearsign-*`) for colors, spacing, border radii, and typography.
- Automatic light and dark mode switching via `prefers-color-scheme` and manual override via `theme="light" | "dark" | "auto"` prop or `data-theme` attribute.
- Automated WCAG 2.1 AA relative luminance and contrast ratio verification for dark and light mode texts, buttons, and warning severities.
- Right-to-Left (RTL) layout support using CSS logical properties (`margin-inline`, `padding-inline`, `border-inline`).
- Theming and internationalization documentation with custom brand styling and Spanish localization examples (`docs/THEMING_AND_I18N.md`).
- Automated tests for pseudo-localization, zero hard-coded strings, and RTL layout (`test/unit/localization.test.tsx`).
- `SignerAdapter` interface (`getAddress()`, `signTransaction(xdr, { networkPassphrase })`) and typed errors (`ClearSignRejectedError`, `WalletSigningError`).
- Decoupled wallet signing in `useClearSign` via optional `adapter` prop, `isSigning` state, `signedXdr` state, typed `error` state, and `signTransaction()` method.
- Reference adapter for Freighter wallet exported at `@clearsign/react/adapters/freighter` with support for injected instances, `window.freighter`, and `@stellar/freighter-api`.
- Reference adapter for Stellar Wallets Kit exported at `@clearsign/react/adapters/stellar-wallets-kit`.
- Separate subpath exports and optional peer dependencies for `@stellar/freighter-api` and `@creit.tech/stellar-wallets-kit` ensuring zero main bundle size overhead.
- Double-click protection and state-gated signing preventing signing when blocked and requiring acknowledgement when under review.
- Unit test suite for signer adapters and gating (`test/unit/signer.test.ts`).
- Interactive Freighter testnet signing integration in `example/src/App.tsx`.
- Local `WarningViewModel` and `WarningSeverity` types with `mapToWarningViewModel` and `groupWarningsBySeverity` mapping functions.
- `WarningList` component grouping warnings by severity (`blocked`, `review`, `info`) with codes, titles, explanations, and documentation links.
- Warnings specification and decision table documentation in `docs/WARNINGS.md`.
- Comprehensive warning gating and acknowledgement reset test suite in `test/unit/warnings.test.tsx`.
- `AuthorizationTree` component for nested invocations with full WAI-ARIA tree pattern and keyboard navigation.
- Local `AuthTreeNode`, `AuthTreeArg`, and `AuthTreeWarning` types and `convertCoreAuthToTree` helper.
- Lazy rendering for deep invocation trees with level > 2 collapsed by default, supporting 500+ node trees without jank.
- Inline truncation and full-value reveal toggles for contract IDs and decoded arguments.
- Direct node-attached warning badges with blocked/warning severity highlights.
- `useAuthorizationTree` and `authTree` props on `ClearSignModal`.
- Test suite with keyboard navigation, 500-node performance benchmarks, and node snapshots (`test/unit/authorizationTree.test.tsx`).
- Accessibility specification documentation (`docs/ACCESSIBILITY.md`).
- Automated accessibility testing suite using `vitest-axe` and Testing Library (`test/unit/accessibility.test.tsx`).
- Live announcements region (`aria-live="polite"`, `role="status"`) for decoding, ready, review, blocked, pending, and error states.
- SVG visual risk icons with `aria-hidden="true"` ensuring risk is conveyed by both text and icons, not color alone.
- `aria-describedby` linking dialog to risk banner and description.
- Reduced-motion support via `@media (prefers-reduced-motion: reduce)` in CSS modules.
- `isSigning` and `isPending` props to `ClearSignModal`, preventing Escape key dismissal during active cryptographic signing.
- Issue template configuration (`.github/ISSUE_TEMPLATE/config.yml`) with community links.
- CI build status, License, and npm badges in `README.md`.
- Unit tests verifying repository templates and badges (`test/unit/templates.test.ts`).

### Changed

- Gated signing strictly when any warning or risk is `blocked`, disabling the sign button and preventing re-enabling by props.
- Guaranteed signing in a blocked state is a strict no-op.
- Required explicit review acknowledgment checkbox (`reviewed`) before enabling signing for `review` severity transactions.
- Automatically reset review acknowledgment whenever the transaction or preview changes.
- Updated `onApprove` callback to report acknowledged `WarningViewModel[]` for audit logging and telemetry.
- Updated `ClearSignModal` focus trap and keyboard navigation to suppress Escape closing when signature is pending.
- Enhanced `.github/pull_request_template.md` with mandatory screenshot/recording section and checklist item for UI changes.
- Added screenshot prompt to `.github/ISSUE_TEMPLATE/bug_report.md`.

## [0.1.0] - 2026-10-08

### Added

- Initial open-source release of the Soroban Clear-Sign Kit backend engine (`@clearsign/core`).
- Support for safe parsing of Soroban XDR envelopes and fee-bumps.
- AST generation and `DisplayValue` mapping from raw `ScVal`s using Stellar contract specs.
- Secure event and token movement simulation via Soroban RPC.
- Deep nested authorization tree extraction.
- Intent verification and fail-closed risk analysis engine with 30 distinct warning codes.
