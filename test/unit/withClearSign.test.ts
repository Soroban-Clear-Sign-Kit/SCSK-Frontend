import { describe, it, expect, vi } from 'vitest';
import { withClearSign, ClearSignRejectedError } from '../../src/withClearSign.js';

describe('withClearSign', () => {
  it('calls the original function if approved', async () => {
    const signTransaction = vi.fn().mockResolvedValue('signed');
    const requestApproval = vi.fn().mockResolvedValue(true);
    
    const safeSign = withClearSign(signTransaction, { requestApproval });
    const res = await safeSign('xdr', { someOpt: true });
    
    expect(requestApproval).toHaveBeenCalledWith('xdr', expect.any(Object));
    expect(signTransaction).toHaveBeenCalledWith('xdr', { someOpt: true });
    expect(res).toBe('signed');
  });

  it('throws ClearSignRejectedError if rejected', async () => {
    const signTransaction = vi.fn().mockResolvedValue('signed');
    const requestApproval = vi.fn().mockResolvedValue(false);
    
    const safeSign = withClearSign(signTransaction, { requestApproval });
    
    await expect(safeSign('xdr', {})).rejects.toThrow(ClearSignRejectedError);
    expect(signTransaction).not.toHaveBeenCalled();
  });
});
