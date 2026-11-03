import { ClearSignRejectedError } from "./types/signer.js";

export { ClearSignRejectedError };

export interface WithClearSignOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- opts shape is caller-defined
  requestApproval: (xdr: string, opts?: any) => Promise<boolean>;
}

export function withClearSign<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (xdr: string, ...args: any[]) => Promise<any>,
>(signTransaction: T, options: WithClearSignOptions): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- must match T's rest args
  const safeSign = async (xdr: string, ...args: any[]) => {
    const intent = args[0]?.intent;
    const specs = args[0]?.specs;
    const signerAddress =
      args[0]?.signerAddress || args[0]?.address || args[0]?.publicKey;

    const approved = await options.requestApproval(xdr, {
      signerAddress,
      intent,
      specs,
    });

    if (approved !== true) {
      throw new ClearSignRejectedError();
    }

    return signTransaction(xdr, ...args);
  };

  return safeSign as T;
}
