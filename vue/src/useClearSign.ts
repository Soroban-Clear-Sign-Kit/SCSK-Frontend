import { ref, readonly, Ref } from 'vue';
import { buildPreview, ClearSignPreview } from '@clearsign/core';

export interface UseClearSignOptions {
  rpcUrl: string;
  networkPassphrase: string;
  minAuthValidityLedgers?: number;
  feeWarningMultiplier?: number;
  rpcTimeoutMs?: number;
}

export interface RequestApprovalOptions {
  intent?: any;
  specs?: Record<string, Buffer | Uint8Array>;
  signerAddress?: string;
}

export interface UseClearSignReturn {
  open: Readonly<Ref<boolean>>;
  preview: Readonly<Ref<ClearSignPreview | null>>;
  loading: Readonly<Ref<boolean>>;
  requestApproval: (xdr: string, reqOptions?: RequestApprovalOptions) => Promise<boolean>;
  handleApprove: () => void;
  handleReject: () => void;
}

export function useClearSign(options: UseClearSignOptions): UseClearSignReturn {
  const open = ref(false);
  const loading = ref(false);
  const preview = ref<ClearSignPreview | null>(null);

  // Vue ref to store the promise resolvers
  const resolvePromise = ref<((value: boolean) => void) | null>(null);

  const requestApproval = async (xdr: string, reqOptions?: RequestApprovalOptions): Promise<boolean> => {
    loading.value = true;
    open.value = true;
    preview.value = null;

    try {
      const p = await buildPreview({
        xdr,
        rpcUrl: options.rpcUrl,
        networkPassphrase: options.networkPassphrase,
        ...(reqOptions?.signerAddress !== undefined && { signerAddress: reqOptions.signerAddress }),
        ...(reqOptions?.intent !== undefined && { intent: reqOptions.intent }),
        ...(reqOptions?.specs !== undefined && { specs: reqOptions.specs }),
        options: {
          ...(options.minAuthValidityLedgers !== undefined && { minAuthValidityLedgers: options.minAuthValidityLedgers }),
          ...(options.feeWarningMultiplier !== undefined && { feeWarningMultiplier: options.feeWarningMultiplier }),
          ...(options.rpcTimeoutMs !== undefined && { rpcTimeoutMs: options.rpcTimeoutMs })
        }
      });
      preview.value = p;
    } catch (e) {
      preview.value = {
        version: 1,
        risk: 'blocked',
        warnings: [{ code: 'INTERNAL_ERROR', message: 'Failed to build preview', severity: 'blocked' }],
        network: { passphrase: options.networkPassphrase, verified: false },
        envelope: { source: '', sequence: '', fee: '', operations: [] },
        auth: [],
        simulation: { status: 'skipped' },
        effects: [],
        summary: [],
        raw: { xdr }
      };
    } finally {
      loading.value = false;
    }

    return new Promise<boolean>((resolve) => {
      resolvePromise.value = resolve;
    });
  };

  const handleApprove = () => {
    if (resolvePromise.value) resolvePromise.value(true);
    open.value = false;
  };

  const handleReject = () => {
    if (resolvePromise.value) resolvePromise.value(false);
    open.value = false;
  };

  return {
    open: readonly(open),
    preview: readonly(preview) as unknown as Readonly<Ref<ClearSignPreview | null>>,
    loading: readonly(loading),
    requestApproval,
    handleApprove,
    handleReject
  };
}
