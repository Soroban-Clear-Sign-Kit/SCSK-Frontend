# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
