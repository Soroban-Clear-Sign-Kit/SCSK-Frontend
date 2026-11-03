# Next.js and SSR Integration Guide

`@clearsign/react` is designed from the ground up to be fully compatible with Server-Side Rendering (SSR) frameworks, including Next.js (App Router and Pages Router), Remix, Astro, and Vite SSR.

---

## SSR Safety Guarantees

1. **Zero Import-Time Browser Globals**:
   - Neither `window`, `document`, nor `navigator` are accessed at module evaluation / import time.
   - All browser-specific APIs (such as `navigator.clipboard`, DOM focus management, and event listeners) are strictly guarded with runtime environment checks (`typeof window !== "undefined"` and `typeof navigator !== "undefined"`) and deferred to React lifecycle effects (`useEffect`) or user-initiated event handlers.
2. **`"use client";` Directive Built-In**:
   - All package entry points (`@clearsign/react`, `@clearsign/react/adapters/freighter`, `@clearsign/react/adapters/stellar-wallets-kit`) and bundled distribution chunks contain the `"use client";` directive banner.
   - You can import `@clearsign/react` components directly inside Next.js App Router projects without experiencing `"use client"` boundary errors.
3. **Pure Node.js `react-dom/server` Test Coverage**:
   - Every modal state (`ready`, `loading`, `review`, `blocked`, `error`, `success`) and subcomponent (`AuthorizationTree`, `WarningList`, `AddressHashView`, `StateDiffViewer`, `ClearSignProvider`) is continuously tested in pure Node.js environments using `renderToString` from `react-dom/server`.

---

## Next.js App Router (React Server Components)

In Next.js 13, 14, and 15 (App Router), components are Server Components by default. Because ClearSign manages interactive modal state, accessibility focus traps, and user approval workflows, it is consumed as a Client Component.

### 1. Global Styles Setup

Add the ClearSign stylesheet to your root layout:

```tsx
// app/layout.tsx
import "@clearsign/react/styles.css";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 2. Client Component Recipe

Create an interactive transaction review component:

```tsx
// components/TransactionSigner.tsx
"use client";

import React, { useState } from "react";
import { ClearSignModal, useClearSign } from "@clearsign/react";

interface TransactionSignerProps {
  xdr: string;
  onSuccess?: (signedXdr: string) => void;
}

export function TransactionSigner({ xdr, onSuccess }: TransactionSignerProps) {
  const { open, preview, loading, requestApproval, onApprove, onReject } =
    useClearSign({
      rpcUrl:
        process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
        "https://soroban-testnet.stellar.org",
      networkPassphrase:
        process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
        "Test SDF Network ; September 2015",
    });

  const [signingStatus, setSigningStatus] = useState<string | null>(null);

  const handleSignClick = async () => {
    try {
      setSigningStatus("Awaiting clear-sign preview approval...");
      const approved = await requestApproval(xdr);

      if (!approved) {
        setSigningStatus("Transaction rejected by user.");
        return;
      }

      setSigningStatus("Submitting to wallet...");
      // Invoke your wallet signer here (e.g. Freighter, StellarWalletsKit)
      // const signed = await wallet.signTransaction(xdr);
      // onSuccess?.(signed);
      setSigningStatus("Transaction signed successfully!");
    } catch (err) {
      setSigningStatus(`Signing failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="signer-container">
      <button onClick={handleSignClick} className="btn-primary">
        Inspect & Sign Transaction
      </button>

      {signingStatus && <p className="status-text">{signingStatus}</p>}

      {open && (
        <ClearSignModal
          preview={preview}
          loading={loading}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </div>
  );
}
```

### 3. Usage inside a Server Component

You can fetch or construct unsigned transaction XDR in a Server Component or Server Action, then pass it down to your client component:

```tsx
// app/transfer/page.tsx
import { TransactionSigner } from "@/components/TransactionSigner";

async function getUnsignedTransaction(): Promise<string> {
  // Fetch or assemble Soroban transaction XDR securely on the server
  return "AAAAAgAAAAA...";
}

export default async function TransferPage() {
  const unsignedXdr = await getUnsignedTransaction();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Soroban Transfer</h1>
      <p>Verify contract invocations and state diffs before signing.</p>
      <TransactionSigner xdr={unsignedXdr} />
    </main>
  );
}
```

---

## Next.js Pages Router

For projects using the Pages Router (`pages/` directory):

```tsx
// pages/index.tsx
import React from "react";
import dynamic from "next/dynamic";
import { useClearSign } from "@clearsign/react";

// Optional: You may import ClearSignModal directly because it is SSR-safe,
// or use dynamic import with ssr: false if code-splitting modal assets:
const ClearSignModal = dynamic(
  () => import("@clearsign/react").then((mod) => mod.ClearSignModal),
  { ssr: false },
);

export default function HomePage() {
  const { open, preview, loading, requestApproval, onApprove, onReject } =
    useClearSign({
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
    });

  return (
    <div>
      <button onClick={() => requestApproval("AAAAAg...")}>Preview XDR</button>
      {open && (
        <ClearSignModal
          preview={preview}
          loading={loading}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </div>
  );
}
```

---

## Server Actions & Route Handlers Integration

When simulating Soroban transactions, `@clearsign/react` decodes authorizations, parameters, and contract balance footprints. You can pair it with Next.js Server Actions:

```tsx
// app/actions/simulate.ts
"use server";

export async function prepareTransaction(recipient: string, amount: string) {
  // Construct Soroban transaction on the server with secure secrets
  const xdr = await assembleSorobanInvocation(recipient, amount);
  return { xdr };
}
```

Then pass the returned `{ xdr }` to `requestApproval(xdr)` in your client component.

---

## Testing SSR in Your Application

If you write automated SSR or Node tests in your application:

```tsx
import { renderToString } from "react-dom/server";
import { ClearSignModal } from "@clearsign/react";

describe("SSR Verification", () => {
  it("renders ClearSignModal to string without window or navigator errors", () => {
    const html = renderToString(
      <ClearSignModal
        preview={null}
        loading={true}
        onApprove={() => {}}
        onReject={() => {}}
      />,
    );
    expect(html).toContain("clearsign-dialog");
  });
});
```
