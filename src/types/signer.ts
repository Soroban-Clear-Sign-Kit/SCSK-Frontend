/**
 * Options passed to the signer adapter during transaction signing
 */
export interface SignTransactionOptions {
  networkPassphrase: string;
  [key: string]: unknown;
}

/**
 * Decoupled signer adapter interface for wallet integration
 */
export interface SignerAdapter {
  /**
   * Retrieves the current active wallet address/public key
   */
  getAddress(): Promise<string>;

  /**
   * Signs the transaction XDR with the wallet
   * @param xdr - Unsigned transaction XDR string
   * @param options - Signing options including networkPassphrase
   * @returns Signed transaction XDR string
   */
  signTransaction(
    xdr: string,
    options: SignTransactionOptions,
  ): Promise<string>;
}

/**
 * Error thrown when a user rejects signing or closes the preview dialog
 */
export class ClearSignRejectedError extends Error {
  constructor(message = "User rejected the transaction preview") {
    super(message);
    this.name = "ClearSignRejectedError";
  }
}

/**
 * Error thrown when the wallet extension or adapter fails to sign
 */
export class WalletSigningError extends Error {
  public readonly cause?: unknown;

  constructor(message = "Wallet failed to sign transaction", cause?: unknown) {
    super(message);
    this.name = "WalletSigningError";
    this.cause = cause;
  }
}
