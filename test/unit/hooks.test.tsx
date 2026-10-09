import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClearSign } from '../../src/useClearSign.js';
import * as core from '@clearsign/core';

vi.mock('@clearsign/core', () => ({
  buildPreview: vi.fn()
}));

describe('useClearSign', () => {
  it('manages modal open state and requests approval', async () => {
    const mockPreview = { risk: 'ok' };
    (core.buildPreview as any).mockResolvedValue(mockPreview);

    const { result } = renderHook(() => useClearSign({ rpcUrl: 'http://localhost', networkPassphrase: 'test' }));
    
    expect(result.current.open).toBe(false);

    let approved: boolean | undefined;
    
    act(() => {
      result.current.requestApproval('xdr').then(res => { approved = res; });
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
       expect(result.current.open).toBe(true);
       expect(result.current.preview).toEqual(mockPreview);
       expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.onApprove();
    });

    expect(result.current.open).toBe(false);
    
    await waitFor(() => {
       expect(approved).toBe(true);
    });
  });

  it('resolves false on reject', async () => {
    (core.buildPreview as any).mockResolvedValue({ risk: 'ok' });
    const { result } = renderHook(() => useClearSign({ rpcUrl: 'http://localhost', networkPassphrase: 'test' }));
    
    let approved: boolean | undefined;
    act(() => {
      result.current.requestApproval('xdr').then(res => { approved = res; });
    });

    await waitFor(() => {
       expect(result.current.open).toBe(true);
    });

    act(() => {
      result.current.onReject();
    });

    await waitFor(() => {
       expect(approved).toBe(false);
    });
  });
});

