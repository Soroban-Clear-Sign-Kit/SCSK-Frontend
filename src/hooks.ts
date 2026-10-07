import { useState, useEffect } from 'react';
import { useClearSignContext } from './provider.js';
import {
  parseEnvelope,
  decodeInvocation,
  ParseResult,
  WarningCode,
  Invocation,
  decodeEvent,
  DecodedEvent,
  decodeLedgerEntry,
  DecodedState
} from '@clearsign/core';
import { xdr, rpc, TransactionBuilder, Transaction, FeeBumpTransaction } from '@stellar/stellar-sdk';

export interface UseClearSignResult {
  isLoading: boolean;
  error: Error | null;
  envelope: any | null;
  invocations: Invocation[];
  warnings: { code: WarningCode; message: string }[];
}

export function useClearSign(xdrBase64: string | null): UseClearSignResult {
  const { rpcUrl, networkPassphrase } = useClearSignContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [envelope, setEnvelope] = useState<any | null>(null);
  const [invocations, setInvocations] = useState<Invocation[]>([]);
  const [warnings, setWarnings] = useState<{ code: WarningCode; message: string }[]>([]);

  useEffect(() => {
    if (!xdrBase64) {
      setEnvelope(null);
      setInvocations([]);
      setWarnings([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function decode() {
      setIsLoading(true);
      setError(null);
      
      try {
        const envResult = parseEnvelope(xdrBase64 as string, networkPassphrase);
        if (!isMounted) return;
        
        if (!envResult.success) {
           setError(new Error(envResult.error.message));
           setIsLoading(false);
           return;
        }

        setEnvelope(envResult.envelope);
        
        const allWarnings = [...envResult.warnings];
        const loadedInvocations: Invocation[] = [];

        const tx = envResult.innerTransaction;
        if (tx) {
           const ops = envResult.envelope.operations;
           for (let i = 0; i < ops.length; i++) {
              const op = ops[i];
              if (!op) continue;
              if (op.type === 'invokeHostFunction') {
                 try {
                   const xdrEnv = xdr.TransactionEnvelope.fromXDR(xdrBase64 as string, 'base64');
                   let xdrOps;
                   const envType = (xdrEnv as any).type || (xdrEnv as any).switch?.().name;
                   switch (envType) {
                     case 'envelopeTypeTx':
                       xdrOps = (xdrEnv as any).value ? (xdrEnv as any).value().tx().operations() : (xdrEnv as any).v1().tx().operations();
                       break;
                     case 'envelopeTypeTxV0':
                       xdrOps = (xdrEnv as any).value ? (xdrEnv as any).value().tx().operations() : (xdrEnv as any).v0().tx().operations();
                       break;
                     case 'envelopeTypeTxFeeBump':
                       xdrOps = (xdrEnv as any).value ? (xdrEnv as any).value().tx().innerTx().value().tx().operations() : (xdrEnv as any).feeBump().tx().innerTx().v1().tx().operations();
                       break;
                     default:
                       continue;
                   }
                   if (xdrOps && xdrOps[i]) {
                     const specOpts = networkPassphrase ? { rpcUrl, networkPassphrase } : { rpcUrl };
                     const invResult = await decodeInvocation(xdrOps[i], specOpts);
                     loadedInvocations.push(invResult.invocation);
                     allWarnings.push(...invResult.warnings);
                   }
                 } catch (e) {
                   allWarnings.push({ code: 'CLASSIC_OP_NOT_DECODED', message: 'Failed to extract XDR operation' });
                 }
              }
           }
        }
        
        if (isMounted) {
          setInvocations(loadedInvocations);
          setWarnings(allWarnings);
        }
      } catch (err: any) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    decode();

    return () => {
      isMounted = false;
    };
  }, [xdrBase64, rpcUrl, networkPassphrase]);

  return { isLoading, error, envelope, invocations, warnings };
}

export interface UseSimulateTransactionResult {
  isLoading: boolean;
  error: Error | null;
  events: DecodedEvent[];
  stateOverrides: DecodedState[];
  warnings: { code: WarningCode; message: string }[];
}

export function useSimulateTransaction(xdrBase64: string | null): UseSimulateTransactionResult {
  const { rpcUrl, networkPassphrase } = useClearSignContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [events, setEvents] = useState<DecodedEvent[]>([]);
  const [stateOverrides, setStateOverrides] = useState<DecodedState[]>([]);
  const [warnings, setWarnings] = useState<{ code: WarningCode; message: string }[]>([]);

  useEffect(() => {
    if (!xdrBase64 || !rpcUrl) {
      setEvents([]);
      setStateOverrides([]);
      setWarnings([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function simulate() {
      setIsLoading(true);
      setError(null);

      try {
        let tx;
        try {
          tx = TransactionBuilder.fromXDR(xdrBase64 as string, networkPassphrase || '') as Transaction | FeeBumpTransaction;
        } catch (e: any) {
          throw new Error('Failed to parse XDR for simulation: ' + e.message);
        }

        const server = new rpc.Server(rpcUrl);
        const simRes = await server.simulateTransaction(tx);
        
        if (!isMounted) return;

        if (rpc.Api.isSimulationError(simRes)) {
          throw new Error(simRes.error);
        }
        
        const allWarnings: { code: WarningCode; message: string }[] = [];
        const loadedEvents: DecodedEvent[] = [];
        const loadedStateOverrides: DecodedState[] = [];
        const specOpts = networkPassphrase ? { rpcUrl, networkPassphrase } : { rpcUrl };

        if (rpc.Api.isSimulationSuccess(simRes)) {
           const eventsArray = simRes.events || [];
           for (const rawEvent of eventsArray) {
              const xdrEvent = typeof rawEvent === 'string' ? xdr.DiagnosticEvent.fromXDR(rawEvent, 'base64') : rawEvent;
              const eventBody = (xdrEvent as any).event || (typeof (xdrEvent as any).event === 'function' ? (xdrEvent as any).event() : null);
              if (eventBody?.type?.name === 'contractEventTypeDiagnostic' || eventBody?.type?.name === 'diagnostic') {
                 // Skip diagnostic events for clean display by default, or decode them
              }
              const decoded = await decodeEvent(eventBody, specOpts);
              loadedEvents.push(decoded);
              allWarnings.push(...decoded.warnings);
           }
           
           const stateArray = simRes.stateChanges || [];
           for (const stateChange of stateArray) {
              const changeType = stateChange.type as unknown as string;
              if (changeType === 'updated' || changeType === 'created') {
                 const entry = typeof stateChange.after === 'string' ? xdr.LedgerEntry.fromXDR(stateChange.after as string, 'base64') : stateChange.after;
                 if (entry) {
                   const decoded = await decodeLedgerEntry(entry as xdr.LedgerEntry, specOpts);
                   if (decoded) {
                      loadedStateOverrides.push(decoded);
                      allWarnings.push(...decoded.warnings);
                   }
                 }
              }
           }
        }
        
        if (isMounted) {
          setEvents(loadedEvents);
          setStateOverrides(loadedStateOverrides);
          setWarnings(allWarnings);
        }
      } catch (err: any) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    simulate();

    return () => {
      isMounted = false;
    };
  }, [xdrBase64, rpcUrl, networkPassphrase]);

  return { isLoading, error, events, stateOverrides, warnings };
}
