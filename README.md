# Soroban Clear-Sign Kit - Frontend React Kit (`@clearsign/react`)

The Frontend package of the **Soroban Clear-Sign Kit (SCSK)** provides React context providers, hooks, and presentation components for inspecting, simulating, and previewing Soroban and Stellar transactions with human-readable clarity.

## Features

- **`ClearSignModal`**: A plug-and-play UI component to safely preview, simulate, and request signatures for transactions.
- **`useClearSign`**: A hook that manages the UI state for transaction previews and leverages `@clearsign/core` to build transaction summaries and decode arguments.
- **Accessibility & UX**: Built with modern CSS modules, offering clean diffs, warning cards, and structured invocation displays. The dialog traps focus, closes on Escape, returns focus to the trigger, announces review and blocked risk as alerts, and shows a busy state while the preview builds.
- **Fail-closed**: Approve is only offered for `ok` and `review` previews, `review` needs an explicit acknowledgement for each preview, and unrecognised risk levels cannot be approved.

## Usage

```tsx
import { ClearSignModal, useClearSign } from '@clearsign/react';
import '@clearsign/react/styles.css';

function SignButton({ xdr }: { xdr: string }) {
  const { open, preview, loading, requestApproval, onApprove, onReject } = useClearSign({
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
  });

  return (
    <>
      <button onClick={() => requestApproval(xdr).then((ok) => ok && sign(xdr))}>Sign</button>
      {open && (
        <ClearSignModal preview={preview} loading={loading} onApprove={onApprove} onReject={onReject} />
      )}
    </>
  );
}
```

`requestApproval` resolves `true` only when the user approves a preview whose risk is `ok` or `review`. It resolves `false` when the user rejects, when a newer request supersedes it, when the component unmounts, or when the preview cannot be built.

### Guarding an existing wallet call

```ts
import { withClearSign } from '@clearsign/react';

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

## Testing

```bash
pnpm run test
```
