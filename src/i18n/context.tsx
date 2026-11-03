"use client";

import React, { createContext, useContext, useMemo } from "react";
import { ClearSignMessages, DEFAULT_MESSAGES } from "./messages.js";

export const ClearSignMessagesContext =
  createContext<ClearSignMessages>(DEFAULT_MESSAGES);

export interface ClearSignProviderProps {
  messages?: Partial<ClearSignMessages> | undefined;
  children: React.ReactNode;
}

/**
 * Provider allowing application consumers to override any or all user-facing strings
 * without needing to fork or re-implement components.
 */
export const ClearSignProvider: React.FC<ClearSignProviderProps> = ({
  messages,
  children,
}) => {
  const mergedMessages = useMemo(() => {
    if (!messages) return DEFAULT_MESSAGES;
    return {
      ...DEFAULT_MESSAGES,
      ...messages,
    };
  }, [messages]);

  return (
    <ClearSignMessagesContext.Provider value={mergedMessages}>
      {children}
    </ClearSignMessagesContext.Provider>
  );
};

/**
 * Hook to retrieve the current active messages dictionary.
 * Can be optionally passed a per-component override object.
 */
export function useClearSignMessages(
  localOverrides?: Partial<ClearSignMessages>,
): ClearSignMessages {
  const contextMessages = useContext(ClearSignMessagesContext);
  return useMemo(() => {
    if (!localOverrides) return contextMessages;
    return {
      ...contextMessages,
      ...localOverrides,
    };
  }, [contextMessages, localOverrides]);
}
