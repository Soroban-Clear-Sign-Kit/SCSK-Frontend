import { expect, test, describe } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ClearSignProvider, useClearSign } from '../src/index.js';
import React from 'react';

// A mock envelope we can pass.
const mockXdr = 'AAAAAgAAAAA...'; // We can just mock the parseEnvelope in core for the test.

describe('useClearSign hook', () => {
  test('throws if used outside of provider', () => {
    // suppress console.error for expected throw
    const originalError = console.error;
    console.error = () => {};
    
    expect(() => {
      renderHook(() => useClearSign(null));
    }).toThrow('useClearSignContext must be used within a ClearSignProvider');
    
    console.error = originalError;
  });

  test('returns default state with null xdr', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ClearSignProvider rpcUrl="https://rpc.example.com">
        {children}
      </ClearSignProvider>
    );

    const { result } = renderHook(() => useClearSign(null), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.envelope).toBeNull();
    expect(result.current.invocations).toEqual([]);
    expect(result.current.warnings).toEqual([]);
  });
});
