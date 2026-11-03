import type { SignerAdapter, SignTransactionOptions } from "../types/signer.js";
import { WalletSigningError } from "../types/signer.js";

/**
 * Structural interface matching @stellar/freighter-api
 */
export interface FreighterApi {
  getAddress(): Promise<{ address: string; error?: unknown } | string>;
  signTransaction(
    xdr: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      accountToSign?: string;
      [key: string]: unknown;
    },
  ): Promise<
    | {
        signedTxXdr?: string;
        signedTransaction?: string;
        error?: unknown;
      }
    | string
  >;
  isConnected?(): Promise<{ isConnected: boolean; error?: unknown } | boolean>;
  isAllowed?(): Promise<{ isAllowed: boolean; error?: unknown } | boolean>;
  setAllowed?(): Promise<{ isAllowed: boolean; error?: unknown } | boolean>;
}

export interface FreighterAdapterOptions {
  /** Optional custom or injected Freighter API instance (defaults to window.freighter or @stellar/freighter-api) */
  freighter?: FreighterApi;
  /** Alias for freighter */
  api?: FreighterApi;
}

async function resolveFreighterApi(
  options?: FreighterAdapterOptions,
): Promise<FreighterApi> {
  const custom = options?.freighter ?? options?.api;
  if (custom) return custom;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined" && (window as any).freighter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).freighter as FreighterApi;
  }

  try {
    const mod = await import("@stellar/freighter-api");
    return mod as unknown as FreighterApi;
  } catch (err) {
    throw new WalletSigningError(
      "Freighter API not detected. Please install the Freighter browser extension or add '@stellar/freighter-api' to your dependencies.",
      err,
    );
  }
}

/**
 * Creates a reference SignerAdapter for the Freighter wallet
 */
export function freighterAdapter(
  options?: FreighterAdapterOptions,
): SignerAdapter {
  return {
    async getAddress(): Promise<string> {
      try {
        const api = await resolveFreighterApi(options);
        const res = await api.getAddress();
        if (typeof res === "string") {
          return res;
        }
        if (res && res.error) {
          throw new Error(
            typeof res.error === "string"
              ? res.error
              : JSON.stringify(res.error),
          );
        }
        if (res && res.address) {
          return res.address;
        }
        throw new Error("Freighter returned no public address");
      } catch (err) {
        if (err instanceof WalletSigningError) {
          throw err;
        }
        throw new WalletSigningError(
          `Freighter getAddress failed: ${err instanceof Error ? err.message : String(err)}`,
          err,
        );
      }
    },

    async signTransaction(
      xdr: string,
      opts: SignTransactionOptions,
    ): Promise<string> {
      try {
        const api = await resolveFreighterApi(options);
        const res = await api.signTransaction(xdr, {
          networkPassphrase: opts.networkPassphrase,
        });
        if (typeof res === "string") {
          return res;
        }
        if (res && res.error) {
          throw new Error(
            typeof res.error === "string"
              ? res.error
              : JSON.stringify(res.error),
          );
        }
        if (res && res.signedTxXdr) {
          return res.signedTxXdr;
        }
        if (res && res.signedTransaction) {
          return res.signedTransaction;
        }
        throw new Error("Freighter did not return a signed transaction XDR");
      } catch (err) {
        if (err instanceof WalletSigningError) {
          throw err;
        }
        throw new WalletSigningError(
          `Freighter signTransaction failed: ${err instanceof Error ? err.message : String(err)}`,
          err,
        );
      }
    },
  };
}
