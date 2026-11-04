# feat(adapters): Add Albedo web wallet reference adapter

## Complexity

**Medium**

---

## Description

`@clearsign/react` decouples presentation from signing via the `SignerAdapter` interface, shipping with reference adapters for Freighter and Stellar Wallets Kit. Albedo (`albedo.link`) is one of the most widely used web-based, browser-agnostic non-custodial Stellar signers. This issue adds an official reference adapter for Albedo exported at `@clearsign/react/adapters/albedo`.

---

## Requirements

1. **`SignerAdapter` Implementation**:
   - Provide `albedoAdapter(options?: AlbedoAdapterOptions): SignerAdapter`.
   - `getAddress()`: Triggers Albedo `public_key` intent and returns the user's public key (`G...`).
   - `signTransaction(xdr, opts)`: Triggers Albedo `tx` intent passing `xdr` and `network: opts?.networkPassphrase`.
2. **Fail-Closed Error Handling**:
   - Map user cancellation / closed popup errors to `ClearSignRejectedError`.
   - Map network, invalid secret, or signing failures to `WalletSigningError`.
3. **Zero Main Bundle Impact**:
   - Make `@albedo-link/intent` an optional peer dependency (`peerDependenciesMeta`).
   - Support dynamically importing `@albedo-link/intent` or using window postMessage if installed.
   - Bundle as an independent subpath export `@clearsign/react/adapters/albedo`.
4. **Mocked Unit Tests**:
   - Write comprehensive unit tests in `test/unit/signer.test.ts` mocking Albedo intents (`public_key`, `tx`), verifying address retrieval, successful signing, user cancellation, and network rejection.

---

## Files to Touch

- `src/adapters/albedo.ts` (New file)
- `package.json` (add `@clearsign/react/adapters/albedo` exports, optional peer dependency)
- `adapters/albedo/package.json` (New legacy Node 10 proxy)
- `tsup.config.ts` (add `adapters/albedo` entry)
- `.size-limit.json` (add budget `< 2 KB` brotlied)
- `test/unit/signer.test.ts`
- `README.md` (add Albedo adapter section to Signer Adapters)

---

## Suggested Execution

1. Create `src/adapters/albedo.ts`:
   ```ts
   import type { SignerAdapter } from "../types/signer.js";
   import {
     ClearSignRejectedError,
     WalletSigningError,
   } from "../types/signer.js";

   export interface AlbedoAdapterOptions {
     albedoInstance?: any;
   }

   export function albedoAdapter(
     options: AlbedoAdapterOptions = {},
   ): SignerAdapter {
     return {
       name: "Albedo",
       async getAddress(): Promise<string> {
         try {
           const albedo =
             options.albedoInstance ||
             (await import("@albedo-link/intent")).default;
           const res = await albedo.publicKey({});
           return res.pubkey;
         } catch (err: any) {
           if (
             err?.message?.includes("closed") ||
             err?.message?.includes("rejected")
           ) {
             throw new ClearSignRejectedError("Albedo window closed by user");
           }
           throw new WalletSigningError("Failed to fetch address from Albedo", {
             cause: err,
           });
         }
       },
       async signTransaction(
         xdr: string,
         opts?: { networkPassphrase?: string },
       ): Promise<string> {
         try {
           const albedo =
             options.albedoInstance ||
             (await import("@albedo-link/intent")).default;
           const res = await albedo.tx({
             xdr,
             network: opts?.networkPassphrase,
           });
           return res.signed_envelope_xdr;
         } catch (err: any) {
           if (
             err?.message?.includes("closed") ||
             err?.message?.includes("rejected")
           ) {
             throw new ClearSignRejectedError("Transaction rejected in Albedo");
           }
           throw new WalletSigningError("Albedo transaction signing failed", {
             cause: err,
           });
         }
       },
     };
   }
   ```
2. Add `"adapters/albedo": "src/adapters/albedo.ts"` to `tsup.config.ts`.
3. Add export entry in `package.json` and create `adapters/albedo/package.json`.
4. Add test cases in `test/unit/signer.test.ts` verifying address fetching and transaction signing with simulated Albedo response objects.
5. Verify with `pnpm run check:package`, `pnpm run check:size`, and `pnpm test`.

---

## Acceptance Criteria

- [ ] `albedoAdapter()` implements the `SignerAdapter` interface.
- [ ] User cancellations map cleanly to `ClearSignRejectedError` and signing errors map to `WalletSigningError`.
- [ ] Subpath export `@clearsign/react/adapters/albedo` builds cleanly and passes `publint` and `attw`.
- [ ] Unit tests verify happy path signing, rejection, and network failure without needing real network calls.

---

## Pull Request Requirements

Please include a short **video screen recording or GIF** showing Albedo approval and rejection flow in the example application or test harness.
