# Frontend React API Reference

## Components

### `ClearSignModal`
The main drop-in UI component that presents the user with a human-readable preview of their transaction before they approve or reject it.

```tsx
import { ClearSignModal } from '@clearsign/react';

<ClearSignModal 
  preview={previewData} 
  onApprove={() => handleApprove()} 
  onReject={() => handleReject()} 
/>
```

#### Props:
- `preview` (ClearSignPreview | null): The resolved preview object from `@clearsign/core`. If null or missing, the modal displays a loading state or nothing.
- `onApprove` (function): Callback fired when the user successfully clicks "Approve". If risk is `review`, they must check the warning acknowledgment box first. If risk is `blocked`, this button is hidden and cannot be clicked.
- `onReject` (function): Callback fired when the user clicks "Reject", clicks outside the modal, or presses the Escape key.

## Hooks

### `useClearSign`
A custom React hook that manages the asynchronous state of building a preview, opening the modal, and waiting for the user's decision.

```tsx
import { useClearSign } from '@clearsign/react';

const { open, preview, loading, requestApproval } = useClearSign({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015'
});
```

#### Hook Configuration Options:
- `rpcUrl` (string): The RPC endpoint to use for fetching contract specs and simulating transactions.
- `networkPassphrase` (string): The exact network passphrase expected.

#### Hook Returns:
- `open` (boolean): Whether the modal should be visible.
- `preview` (ClearSignPreview | null): The resolved preview object.
- `loading` (boolean): True while the preview is actively being simulated and built.
- `requestApproval(xdr: string, options?: RequestApprovalOptions)`: A function returning a `Promise<boolean>`. Resolves to `true` if approved, `false` if rejected.

## Utilities

### `withClearSign`
A higher-order wrapper around wallet `signTransaction` functions. It hijacks the signing flow to first show the `ClearSignModal`. If the user approves, it forwards the call to the original wallet function. If rejected, it throws a `ClearSignRejectedError`.

```tsx
import { withClearSign } from '@clearsign/react';

const safeSign = withClearSign(
  freighterApi.signTransaction, 
  { requestApproval } // from useClearSign
);

// safeSign has the exact same signature as freighterApi.signTransaction
```

## Warning Codes

The Frontend consumes and renders the exact same warnings as the backend. See the Core API Reference for the full warning table.
