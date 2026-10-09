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
    if (resolverRef.current) {
      resolverRef.current(false);
    }
    setLoading(true);
    setPreview(null);
    setOpen(true);
    
    try {
      const buildInput: Parameters<typeof buildPreview>[0] = {
        xdr,
        rpcUrl: opts.rpcUrl,
        networkPassphrase: opts.networkPassphrase,
      };
      if (requestOpts?.signerAddress !== undefined) buildInput.signerAddress = requestOpts.signerAddress;
      if (requestOpts?.intent !== undefined) buildInput.intent = requestOpts.intent;
      if (requestOpts?.specs !== undefined) buildInput.specs = requestOpts.specs;
      
      const res = await buildPreview(buildInput);
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
