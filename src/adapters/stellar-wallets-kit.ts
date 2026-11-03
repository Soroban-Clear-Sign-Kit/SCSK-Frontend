import type { SignerAdapter, SignTransactionOptions } from "../types/signer.js";
import { WalletSigningError } from "../types/signer.js";

/**
 * Structural interface matching @creit.tech/stellar-wallets-kit StellarWalletsKit
 */
export interface StellarWalletsKitLike {
  getPublicKey?: () => Promise<string>;
  getAddress?: () => Promise<{ address: string } | string>;
  signTransaction(
    xdr: string,
    opts?: { networkPassphrase?: string; [key: string]: unknown },
  ): Promise<{ signedXDR?: string; signedTxXdr?: string } | string>;
}

export interface StellarWalletsKitAdapterOptions {
  kit: StellarWalletsKitLike;
}

/**
 * Creates a reference SignerAdapter for the Stellar Wallets Kit
 */
export function stellarWalletsKitAdapter(
  options: StellarWalletsKitAdapterOptions,
): SignerAdapter {
  if (!options?.kit) {
    throw new WalletSigningError(
      "StellarWalletsKitAdapter requires a 'kit' instance in options",
    );
  }

  return {
    async getAddress(): Promise<string> {
      try {
        if (typeof options.kit.getAddress === "function") {
          const res = await options.kit.getAddress();
          if (typeof res === "string") return res;
          if (res && res.address) return res.address;
        }
        if (typeof options.kit.getPublicKey === "function") {
          return await options.kit.getPublicKey();
        }
        throw new Error(
          "StellarWalletsKit instance does not implement getAddress or getPublicKey",
        );
      } catch (err) {
        if (err instanceof WalletSigningError) {
          throw err;
        }
        throw new WalletSigningError(
          `Stellar Wallets Kit failed to retrieve address: ${err instanceof Error ? err.message : String(err)}`,
          err,
        );
      }
    },

    async signTransaction(
      xdr: string,
      opts: SignTransactionOptions,
    ): Promise<string> {
      try {
        const res = await options.kit.signTransaction(xdr, {
          networkPassphrase: opts.networkPassphrase,
        });
        if (typeof res === "string") {
          return res;
        }
        if (res && res.signedXDR) {
          return res.signedXDR;
        }
        if (res && res.signedTxXdr) {
          return res.signedTxXdr;
        }
        throw new Error(
          "Stellar Wallets Kit returned invalid signature format",
        );
      } catch (err) {
        if (err instanceof WalletSigningError) {
          throw err;
        }
        throw new WalletSigningError(
          `Stellar Wallets Kit signing failed: ${err instanceof Error ? err.message : String(err)}`,
          err,
        );
      }
    },
  };
}
