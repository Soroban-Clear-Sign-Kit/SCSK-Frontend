"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { buildPreview } from "@clearsign/core";
import type { ClearSignPreview } from "@clearsign/core";
import type { WarningViewModel } from "./components/WarningList.js";
import type { SignerAdapter } from "./types/signer.js";
import { ClearSignRejectedError, WalletSigningError } from "./types/signer.js";

export interface RequestApprovalOptions {
  signerAddress?: string;
  intent?: Parameters<typeof buildPreview>[0]["intent"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specs?: Record<string, any>;
}

export interface UseClearSignOptions {
  rpcUrl: string;
  networkPassphrase: string;
  adapter?: SignerAdapter;
}

export interface UseClearSignResult {
  open: boolean;
  preview: ClearSignPreview | null;
  loading: boolean;
  isSigning: boolean;
  signedXdr: string | null;
  error: Error | null;
  requestApproval: (
    xdr: string,
    opts?: RequestApprovalOptions,
  ) => Promise<boolean>;
  signTransaction: (
    xdr: string,
    opts?: RequestApprovalOptions,
  ) => Promise<string>;
  onApprove: (acknowledgedWarnings?: WarningViewModel[]) => void;
  onReject: () => void;
}

export function useClearSign(opts: UseClearSignOptions): UseClearSignResult {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ClearSignPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signedXdr, setSignedXdr] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolverRef = useRef<((value: any) => void) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rejecterRef = useRef<((reason: any) => void) | null>(null);
  const previewRef = useRef<ClearSignPreview | null>(null);
  const currentXdrRef = useRef<string | null>(null);
  const isSigningRef = useRef(false);
  const isSigningModeRef = useRef(false);
  const adapterRef = useRef<SignerAdapter | undefined>(opts.adapter);
  const requestIdRef = useRef(0);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(() => {
    adapterRef.current = opts.adapter;
  }, [opts.adapter]);

  // If the component unmounts mid-request, fail closed without hanging callers
  useEffect(
    () => () => {
      requestIdRef.current++;
      if (isSigningModeRef.current) {
        if (rejecterRef.current) {
          rejecterRef.current(
            new ClearSignRejectedError(
              "Component unmounted during approval request",
            ),
          );
        }
      } else if (resolverRef.current) {
        resolverRef.current(false);
      }
      resolverRef.current = null;
      rejecterRef.current = null;
    },
    [],
  );

  const initiateApproval = useCallback(
    async (
      xdr: string,
      requestOpts?: RequestApprovalOptions,
      isSignMode = false,
    ) => {
      // A newer request supersedes any pending one
      if (isSigningModeRef.current) {
        if (rejecterRef.current) {
          rejecterRef.current(
            new ClearSignRejectedError(
              "Superseded by a newer approval request",
            ),
          );
        }
      } else if (resolverRef.current) {
        resolverRef.current(false);
      }

      isSigningModeRef.current = isSignMode;
      const requestId = ++requestIdRef.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let settleResolve!: (value: any) => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let settleReject!: (reason: any) => void;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decision = new Promise<any>((resolve, reject) => {
        settleResolve = resolve;
        settleReject = reject;
      });

      resolverRef.current = settleResolve;
      rejecterRef.current = settleReject;
      currentXdrRef.current = xdr;
      isSigningRef.current = false;

      setLoading(true);
      setIsSigning(false);
      setSignedXdr(null);
      setError(null);
      setPreview(null);
      setOpen(true);

      try {
        let inferredSignerAddress = requestOpts?.signerAddress;
        if (!inferredSignerAddress && adapterRef.current) {
          try {
            inferredSignerAddress = await adapterRef.current.getAddress();
          } catch {
            // Optional address pre-fetch; preview building continues if address isn't ready
          }
        }

        const buildInput: Parameters<typeof buildPreview>[0] = {
          xdr,
          rpcUrl: opts.rpcUrl,
          networkPassphrase: opts.networkPassphrase,
        };
        if (inferredSignerAddress !== undefined) {
          buildInput.signerAddress = inferredSignerAddress;
        }
        if (requestOpts?.intent !== undefined) {
          buildInput.intent = requestOpts.intent;
        }
        if (requestOpts?.specs !== undefined) {
          buildInput.specs = requestOpts.specs;
        }

        const res = await buildPreview(buildInput);
        if (requestId !== requestIdRef.current) return decision;
        setPreview(res);

        const isBlocked =
          res.risk === "blocked" ||
          (res.warnings || []).some((w) => w.severity === "blocked");

        if (isBlocked && isSigningModeRef.current) {
          setOpen(false);
          const blockError = new WalletSigningError(
            "Transaction signing blocked: high risk detected",
          );
          setError(blockError);
          settleReject(blockError);
          resolverRef.current = null;
          rejecterRef.current = null;
          return decision;
        }
      } catch (err) {
        // Fail closed if preview simulation fails
        if (requestId === requestIdRef.current) {
          setPreview(null);
          setOpen(false);
          if (isSigningModeRef.current) {
            settleReject(
              new WalletSigningError(
                "Failed to build transaction preview",
                err,
              ),
            );
          } else {
            settleResolve(false);
          }
          resolverRef.current = null;
          rejecterRef.current = null;
        }
        return decision;
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }

      return decision;
    },
    [opts.rpcUrl, opts.networkPassphrase],
  );

  const requestApproval = useCallback(
    async (
      xdr: string,
      requestOpts?: RequestApprovalOptions,
    ): Promise<boolean> => {
      const res = await initiateApproval(xdr, requestOpts, false);
      return Boolean(res);
    },
    [initiateApproval],
  );

  const onApprove = useCallback(
    async (acknowledgedWarnings?: WarningViewModel[]) => {
      const current = previewRef.current;
      if (!current) return;

      // Double-click protection: ignore subsequent clicks while signing is in flight
      if (isSigningRef.current) {
        return;
      }

      // Security Gating: Never sign a blocked transaction
      const isBlocked =
        current.risk === "blocked" ||
        (current.warnings || []).some((w) => w.severity === "blocked");

      if (isBlocked) {
        setOpen(false);
        if (isSigningModeRef.current) {
          if (rejecterRef.current) {
            rejecterRef.current(
              new WalletSigningError(
                "Transaction signing blocked: high risk detected",
              ),
            );
          }
        } else if (resolverRef.current) {
          resolverRef.current(false);
        }
        resolverRef.current = null;
        rejecterRef.current = null;
        return;
      }

      // Review Gating: Require explicit acknowledgement for review-risk transactions
      const isReview =
        current.risk === "review" ||
        (current.warnings || []).some((w) => w.severity === "review");

      if (
        isReview &&
        (!acknowledgedWarnings || acknowledgedWarnings.length === 0)
      ) {
        return;
      }

      const activeAdapter = adapterRef.current;
      if (!isSigningModeRef.current || !activeAdapter) {
        // Without active signing mode or without adapter, simply settle approval
        const approvable = current.risk === "ok" || current.risk === "review";
        setOpen(false);
        if (resolverRef.current) {
          resolverRef.current(approvable);
          resolverRef.current = null;
          rejecterRef.current = null;
        }
        return;
      }

      // With an adapter in signing mode: execute signing with double-click protection
      isSigningRef.current = true;
      setIsSigning(true);

      try {
        const xdr = currentXdrRef.current;
        if (!xdr) {
          throw new WalletSigningError("No transaction XDR available to sign");
        }

        const signed = await activeAdapter.signTransaction(xdr, {
          networkPassphrase: opts.networkPassphrase,
        });

        setSignedXdr(signed);
        setOpen(false);
        if (resolverRef.current) {
          resolverRef.current(signed);
        }
      } catch (err) {
        const signingError =
          err instanceof WalletSigningError
            ? err
            : new WalletSigningError(
                err instanceof Error ? err.message : String(err),
                err,
              );
        setError(signingError);
        setOpen(false);
        if (rejecterRef.current) {
          rejecterRef.current(signingError);
        }
      } finally {
        isSigningRef.current = false;
        setIsSigning(false);
        resolverRef.current = null;
        rejecterRef.current = null;
      }
    },
    [opts.networkPassphrase],
  );

  const onReject = useCallback(() => {
    // If active signing is in flight, reject action is suppressed
    if (isSigningRef.current) {
      return;
    }

    setOpen(false);
    if (isSigningModeRef.current) {
      const rejError = new ClearSignRejectedError(
        "User rejected transaction signature",
      );
      setError(rejError);
      if (rejecterRef.current) {
        rejecterRef.current(rejError);
      }
    } else if (resolverRef.current) {
      resolverRef.current(false);
    }
    resolverRef.current = null;
    rejecterRef.current = null;
  }, []);

  const signTransaction = useCallback(
    async (
      xdr: string,
      requestOpts?: RequestApprovalOptions,
    ): Promise<string> => {
      if (!adapterRef.current) {
        throw new WalletSigningError(
          "No SignerAdapter configured on useClearSign. Pass an adapter in UseClearSignOptions to enable signing.",
        );
      }
      const res = await initiateApproval(xdr, requestOpts, true);
      if (typeof res === "string") {
        return res;
      }
      throw new WalletSigningError(
        "Signing failed to produce a signed transaction XDR",
      );
    },
    [initiateApproval],
  );

  return {
    open,
    preview,
    loading,
    isSigning,
    signedXdr,
    error,
    requestApproval,
    signTransaction,
    onApprove,
    onReject,
  };
}
