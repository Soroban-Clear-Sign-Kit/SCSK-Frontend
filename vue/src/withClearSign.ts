export class ClearSignRejectedError extends Error {
  constructor() {
    super('User rejected the transaction in Clear-Sign preview');
    this.name = 'ClearSignRejectedError';
  }
}

export function withClearSign<T extends (...args: any[]) => Promise<any>>(
  originalSignFn: T,
  config: { requestApproval: (xdr: string, options?: any) => Promise<boolean>, signerAddress?: string }
): (...args: Parameters<T>) => ReturnType<T> {
  return (async (...args: Parameters<T>) => {
    // We assume the first or last string argument that looks like base64 XDR is the transaction
    const xdrArg = args.find(a => typeof a === 'string' && a.length > 50 && /^[a-zA-Z0-9+/=]+$/.test(a));
    
    if (xdrArg) {
      const approved = await config.requestApproval(xdrArg, { signerAddress: config.signerAddress });
      if (!approved) {
        throw new ClearSignRejectedError();
      }
    }
    
    return originalSignFn(...args);
  }) as (...args: Parameters<T>) => ReturnType<T>;
}
