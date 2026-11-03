# Frontend React API Reference

## Components

### `ClearSignModal`

The main drop-in UI component that presents the user with a human-readable preview of their transaction before they approve or reject it.

```tsx
import { ClearSignModal } from "@clearsign/react";

<ClearSignModal
  preview={previewData}
  onApprove={() => handleApprove()}
  onReject={() => handleReject()}
/>;
```

#### Props:

- `preview` (ClearSignPreview | null): The resolved preview object from `@clearsign/core`. If null or missing, the modal displays a loading state or nothing.
- `onApprove` (`(acknowledgedWarnings?: WarningViewModel[]) => void`): Callback fired when the user successfully clicks "Approve". If risk is `review`, they must check the warning acknowledgment box first, and the acknowledged warnings are reported in the callback. If risk is `blocked`, this button is disabled/hidden and cannot be re-enabled.
- `onReject` (function): Callback fired when the user clicks "Reject", clicks outside the modal, or presses the Escape key.
- `isSigning` (boolean, optional): Set to true during active wallet signing. Suppresses Escape dismissal and disables action buttons.
- `useAuthorizationTree` (boolean, optional): When true, renders authorization entries using the accessible, collapsible `AuthorizationTree` component.
- `authTree` (AuthTreeNode[], optional): Custom authorization tree nodes to display directly.
- `theme` (`"light" | "dark" | "auto"`, optional, default: `"auto"`): Forces light or dark mode styling, overriding system preferences.
- `messages` (`Partial<ClearSignMessages>`, optional): Custom or translated strings for all user-facing labels in this modal instance. See [docs/THEMING_AND_I18N.md](THEMING_AND_I18N.md).
- `stateDiffs` (`StateDiffItem[]`, optional): Custom state modifications or balance deltas to display in the paginated diff view. See [docs/VERIFICATION_AND_RAW.md](VERIFICATION_AND_RAW.md).

### `WarningList`

An accessible warning list component that groups warnings by severity (`blocked`, `review`, `info`) with icons, explanations, and documentation links. See [docs/WARNINGS.md](WARNINGS.md) for the complete decision table.

```tsx
import { WarningList } from "@clearsign/react";

<WarningList warnings={warnings} />;
```

### `AuthorizationTree`

A WAI-ARIA compliant tree component for deeply nested smart contract invocations and authorization trees.

```tsx
import { AuthorizationTree, AuthTreeNode } from "@clearsign/react";

<AuthorizationTree
  nodes={authTreeNodes}
  defaultExpandedDepth={2}
  onNodeSelect={(node) => console.log("Selected:", node)}
/>;
```

#### Props:

- `nodes` (`AuthTreeNode[]`): Tree nodes to display.
- `defaultExpandedDepth` (`number`, optional, default: 2): Nodes deeper than this depth are collapsed by default.
- `onNodeSelect` (`(node: AuthTreeNode) => void`, optional): Callback fired when a node is activated.
- `ariaLabel` (`string`, optional, default: "Authorization Tree"): Accessible name for the tree landmark.

#### Node Shape (`AuthTreeNode`):

```ts
export interface AuthTreeNode {
  id?: string;
  contract?: string;
  functionName?: string;
  args?: Array<{ name?: string; value: unknown }>;
  children?: AuthTreeNode[];
  warnings?: Array<{
    code: string;
    message: string;
    severity?: "warning" | "blocked" | "info";
  }>;
  kind?: string;
}
```

### `ClearSignProvider`

Context provider for customizing themes and supplying localized user-facing message dictionaries across all child ClearSign components. See [docs/THEMING_AND_I18N.md](THEMING_AND_I18N.md).

```tsx
import { ClearSignProvider } from "@clearsign/react";

<ClearSignProvider messages={customMessages}>
  <App />
</ClearSignProvider>;
```

### `AddressHashView`

An accessible component that formats long Stellar addresses, Soroban contract IDs, and cryptographic hashes. Displays a middle-truncated preview by default (e.g. `GBRP...OX2H`), expands into grouped 4-character monospace chunks on demand, and copies untruncated values directly to the clipboard. See [docs/VERIFICATION_AND_RAW.md](VERIFICATION_AND_RAW.md).

```tsx
import { AddressHashView } from "@clearsign/react";

<AddressHashView
  value="GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"
  kind="address"
  copyable={true}
/>;
```

### `StateDiffViewer`

A high-performance paginated viewer for balance changes and contract storage modifications. Capable of smoothly rendering 1,000+ diff entries with interactive page controls, size selection, and full address inspection.

```tsx
import { StateDiffViewer, StateDiffItem } from "@clearsign/react";

<StateDiffViewer
  entries={diffs}
  pageSize={25}
  pageSizeOptions={[10, 25, 50, 100]}
/>;
```

## Hooks

### `useClearSign`

A custom React hook that manages the asynchronous state of building a preview, opening the modal, and waiting for the user's decision.

```tsx
import { useClearSign } from "@clearsign/react";

const { open, preview, loading, requestApproval } = useClearSign({
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
});
```

#### Hook Configuration Options:

- `rpcUrl` (string): The RPC endpoint to use for fetching contract specs and simulating transactions.
- `networkPassphrase` (string): The exact network passphrase expected.
- `adapter` (`SignerAdapter`, optional): Wallet adapter conforming to the `SignerAdapter` interface. When provided, `signTransaction` coordinates preview, approval gating, and wallet signing.

#### Hook Returns:

- `open` (boolean): Whether the modal should be visible.
- `preview` (ClearSignPreview | null): The resolved preview object.
- `loading` (boolean): True while the preview is actively being simulated and built.
- `isSigning` (boolean): True while the connected wallet adapter is in flight signing the transaction.
- `signedXdr` (string | null): The signed transaction XDR returned by the adapter upon success.
- `error` (Error | null): The last error encountered (`ClearSignRejectedError`, `WalletSigningError`, etc.).
- `requestApproval(xdr: string, options?: RequestApprovalOptions)`: A function returning a `Promise<boolean>`. Resolves to `true` if approved, `false` if rejected.
- `signTransaction(xdr: string, options?: RequestApprovalOptions)`: A function returning `Promise<string>`. Evaluates preview, gates on security/warnings, prompts approval via modal, and signs via the configured adapter. Throws `ClearSignRejectedError` on user rejection or `WalletSigningError` on wallet failure.

## Wallet Signer Adapters

`@clearsign/react` supports optional, decoupled wallet signing via the `SignerAdapter` interface. Reference adapters are provided in separate entry points so that the main bundle does not grow and optional peer dependencies are only loaded when needed.

### `SignerAdapter` Interface

```ts
export interface SignTransactionOptions {
  networkPassphrase?: string;
  [key: string]: unknown;
}

export interface SignerAdapter {
  getAddress(): Promise<string>;
  signTransaction(xdr: string, opts?: SignTransactionOptions): Promise<string>;
}
```

### Reference Adapters

#### Freighter (`@clearsign/react/adapters/freighter`)

```tsx
import { useClearSign } from "@clearsign/react";
import { freighterAdapter } from "@clearsign/react/adapters/freighter";

const { signTransaction, open, preview, isSigning, onApprove, onReject } =
  useClearSign({
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    adapter: freighterAdapter(),
  });
```

#### Stellar Wallets Kit (`@clearsign/react/adapters/stellar-wallets-kit`)

```tsx
import { useClearSign } from "@clearsign/react";
import { stellarWalletsKitAdapter } from "@clearsign/react/adapters/stellar-wallets-kit";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";

const kit = new StellarWalletsKit({ ... });

const { signTransaction } = useClearSign({
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  adapter: stellarWalletsKitAdapter({ kit }),
});
```

### Typed Signing Errors

- `ClearSignRejectedError`: Thrown when the user rejects transaction signing in the preview modal or closes it without approving.
- `WalletSigningError`: Thrown when wallet interaction fails, extension is missing, or the user declines inside the wallet popup. Preserves the underlying `cause`.

## Utilities

### `withClearSign`

A higher-order wrapper around wallet `signTransaction` functions. It hijacks the signing flow to first show the `ClearSignModal`. If the user approves, it forwards the call to the original wallet function. If rejected, it throws a `ClearSignRejectedError`.

```tsx
import { withClearSign } from "@clearsign/react";

const safeSign = withClearSign(
  freighterApi.signTransaction,
  { requestApproval }, // from useClearSign
);

// safeSign has the exact same signature as freighterApi.signTransaction
```

## Warning Codes

The Frontend consumes and renders the exact same warnings as the backend. See the Core API Reference for the full warning table.
