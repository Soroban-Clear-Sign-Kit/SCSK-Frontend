# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- `ClearSignModal` accepts `loading` and shows a busy dialog while the preview builds.
- The modal shows the target network and whether it was verified, plus the simulation status and error.
- Warnings are listed with blocking ones first.
- Authorization trees show decoded call arguments and contract-creation details.
- `DisplayValueRenderer` renders maps, enums, options, timepoints, durations and raw values, shows byte lengths, and marks truncated or sanitized strings.
- `withClearSign` also reads the signer from `address` and forwards `specs`.

### Fixed
- `useClearSign` no longer leaves callers waiting forever: it settles superseded requests, ignores stale previews, resolves `false` on unmount, and fails closed when `buildPreview` throws.
- `onApprove` never resolves `true` for blocked or unrecognised previews, and `withClearSign` treats anything other than `true` as a rejection.
- The modal no longer offers Approve for unrecognised risk levels, requires a fresh acknowledgement for each preview, and keeps a stable key listener so focus returns to the original trigger.
- The example app now wires the modal to the hook's `onApprove` and `onReject`.
- Component tests type-check under `tsc`.

## [0.1.0] - 2026-10-08
### Added
- Initial open-source release of the Soroban Clear-Sign Kit backend engine (`@clearsign/core`).
- Support for safe parsing of Soroban XDR envelopes and fee-bumps.
- AST generation and `DisplayValue` mapping from raw `ScVal`s using Stellar contract specs.
- Secure event and token movement simulation via Soroban RPC.
- Deep nested authorization tree extraction.
- Intent verification and fail-closed risk analysis engine with 30 distinct warning codes.
