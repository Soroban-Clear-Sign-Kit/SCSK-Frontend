import { ref, readonly, Ref } from 'vue';
import { buildPreview, ClearSignPreview, PreviewOptions } from '@clearsign/core';

export interface UseClearSignOptions extends PreviewOptions {
  rpcUrl: string;
  networkPassphrase: string;
  options?: PreviewOptions;
}

export interface RequestApprovalOptions {
  intent?: any;
  specs?: Record<string, Buffer | Uint8Array>;
  signerAddress?: string;
  options?: PreviewOptions;
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

  // Vue ref to store the promise resolvers and current request ID
  const resolvePromise = ref<((value: boolean) => void) | null>(null);
  let activeRequestId = 0;

  const requestApproval = async (xdr: string, reqOptions?: RequestApprovalOptions): Promise<boolean> => {
    // Supersede any in-flight request with false
    if (resolvePromise.value) {
      resolvePromise.value(false);
      resolvePromise.value = null;
    }
    const requestId = ++activeRequestId;
    let settle!: (value: boolean) => void;
    const decision = new Promise<boolean>((resolve) => {
      settle = resolve;
    });
    resolvePromise.value = settle;

    loading.value = true;
    open.value = true;
    preview.value = null;

    try {
      const { rpcUrl, networkPassphrase, options: nestedOptions, ...inlineOptions } = options;
      const mergedOpts = Object.fromEntries(
        Object.entries({
          ...inlineOptions,
          ...nestedOptions,
          ...reqOptions?.options,
        }).filter(([, v]) => v !== undefined),
      ) as PreviewOptions;

      const p = await buildPreview({
        xdr,
        rpcUrl,
        networkPassphrase,
        ...(reqOptions?.signerAddress !== undefined && { signerAddress: reqOptions.signerAddress }),
        ...(reqOptions?.intent !== undefined && { intent: reqOptions.intent }),
        ...(reqOptions?.specs !== undefined && { specs: reqOptions.specs }),
        options: mergedOpts,
      });
      if (requestId === activeRequestId) {
        preview.value = p;
      }
    } catch (e) {
      if (requestId === activeRequestId) {
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
      }
    } finally {
      if (requestId === activeRequestId) {
        loading.value = false;
      }
    }

    return decision;
  };

  const handleApprove = () => {
    if (!preview.value) return;
    const approvable = preview.value.risk === 'ok' || preview.value.risk === 'review';
    open.value = false;
    if (resolvePromise.value) {
      resolvePromise.value(approvable);
      resolvePromise.value = null;
    }
  };

  const handleReject = () => {
    activeRequestId++;
    open.value = false;
    loading.value = false;
    if (resolvePromise.value) {
      resolvePromise.value(false);
      resolvePromise.value = null;
    }
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
