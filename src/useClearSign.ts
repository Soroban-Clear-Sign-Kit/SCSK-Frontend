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
  const requestIdRef = useRef(0);

  const requestApproval = useCallback(async (xdr: string, requestOpts?: RequestApprovalOptions) => {
    // A newer request supersedes any pending one, which is reported as rejected.
    resolverRef.current?.(false);
    const requestId = ++requestIdRef.current;
    let settle!: (value: boolean) => void;
    const decision = new Promise<boolean>((resolve) => {
      settle = resolve;
    });
    resolverRef.current = settle;

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
      if (requestId !== requestIdRef.current) return decision;
      setPreview(res);
    } catch {
      // buildPreview is designed not to throw. If it does, fail closed: there is nothing
      // to show the user, so close the dialog and report the request as rejected.
      if (requestId === requestIdRef.current) {
        setPreview(null);
        setOpen(false);
        resolverRef.current = null;
        settle(false);
      }
      return decision;
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }

    return decision;
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
