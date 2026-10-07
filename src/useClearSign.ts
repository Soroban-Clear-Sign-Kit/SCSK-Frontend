import { useState, useCallback, useRef } from 'react';
import { buildPreview, ClearSignPreview, Intent } from '@clearsign/core';

export interface UseClearSignOptions {
  rpcUrl: string;
  networkPassphrase: string;
}

export interface RequestApprovalOptions {
  signerAddress?: string;
  intent?: Intent;
  specs?: Record<string, Buffer | Uint8Array>;
}

export interface UseClearSignResult {
  open: boolean;
  preview: ClearSignPreview | null;
  loading: boolean;
  requestApproval: (xdr: string, opts?: RequestApprovalOptions) => Promise<boolean>;
  onApprove: () => void;
  onReject: () => void;
}

export function useClearSign(opts: UseClearSignOptions): UseClearSignResult {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ClearSignPreview | null>(null);
  const [loading, setLoading] = useState(false);
  
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const requestApproval = useCallback(async (xdr: string, requestOpts?: RequestApprovalOptions) => {
    setLoading(true);
    setPreview(null);
    setOpen(true);
    
    try {
      const res = await buildPreview({
        xdr,
        rpcUrl: opts.rpcUrl,
        networkPassphrase: opts.networkPassphrase,
        signerAddress: requestOpts?.signerAddress,
        intent: requestOpts?.intent,
        specs: requestOpts?.specs
      });
      setPreview(res);
    } catch (err: any) {
      // In case buildPreview somehow throws despite catching internals
      setPreview(null);
    } finally {
      setLoading(false);
    }

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, [opts.rpcUrl, opts.networkPassphrase]);

  const onApprove = useCallback(() => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const onReject = useCallback(() => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  return { open, preview, loading, requestApproval, onApprove, onReject };
}
