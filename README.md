# Soroban Clear-Sign Kit - Frontend React Kit (`@clearsign/react`)

The Frontend package of the **Soroban Clear-Sign Kit (SCSK)** provides React context providers, hooks, and presentation components for inspecting, simulating, and previewing Soroban and Stellar transactions with human-readable clarity.

## Features

- **`ClearSignProvider`**: Supplies configuration (such as Soroban RPC URL, Network Passphrase, and contract spec caching policies) across the React application tree.
- **`useClearSign(xdrBase64)`**: Synchronously and reactively decodes transaction envelopes, unwraps muxed accounts, decodes host functions, inspects authorization trees, and flags security warnings (e.g. unknown contracts, high fees, expiration).
- **`useSimulateTransaction(xdrBase64)`**: Submits candidate transactions to the Soroban RPC simulation endpoint, extracting and parsing diagnostic events and ledger state mutations into clear before/after diffs.
- **Accessibility & UX**: Tested with jsdom and React Testing Library to deliver accessible transaction previews.

## Installation

```bash
pnpm install
```

## Building

```bash
pnpm run build
```

## Testing

```bash
pnpm run test
```
