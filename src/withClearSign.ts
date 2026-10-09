export class ClearSignRejectedError extends Error {
  constructor(message = 'User rejected the transaction preview') {
    super(message);
    this.name = 'ClearSignRejectedError';
  }
}

export interface WithClearSignOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- opts shape is caller-defined
  requestApproval: (xdr: string, opts?: any) => Promise<boolean>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- wraps arbitrary signer signatures
export function withClearSign<T extends (xdr: string, ...args: any[]) => Promise<any>>(
  signTransaction: T,
  options: WithClearSignOptions
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- must match T's rest args
  const safeSign = async (xdr: string, ...args: any[]) => {
    const intent = args[0]?.intent;
    const signerAddress = args[0]?.signerAddress || args[0]?.publicKey;
    
    const approved = await options.requestApproval(xdr, { signerAddress, intent });
    
    if (!approved) {
      throw new ClearSignRejectedError();
    }
    
    return signTransaction(xdr, ...args);
  };
  
  return safeSign as T;
}
