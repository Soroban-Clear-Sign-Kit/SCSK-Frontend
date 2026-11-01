export class ClearSignRejectedError extends Error {
  constructor(message = 'User rejected the transaction preview') {
    super(message);
    this.name = 'ClearSignRejectedError';
  }
}

export interface WithClearSignOptions {
  requestApproval: (xdr: string, opts?: any) => Promise<boolean>;
}

export function withClearSign<T extends (xdr: string, ...args: any[]) => Promise<any>>(
  signTransaction: T,
  options: WithClearSignOptions
): T {
  const safeSign = async (xdr: string, ...args: any[]) => {
    const intent = args[0]?.intent;
    const specs = args[0]?.specs;
    const signerAddress = args[0]?.signerAddress || args[0]?.address || args[0]?.publicKey;
    
    let approved = await options.requestApproval(xdr, { signerAddress, intent, specs });
    
    if (approved !== true) {
      throw new ClearSignRejectedError();
    }
    
    return signTransaction(xdr, ...args);
  };
  
  return safeSign as T;
}
