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

  it.each([
    ['signerAddress', 'GSIGNER'],
    ['address', 'GWALLET'],
    ['publicKey', 'GLEGACY'],
  ])('derives the signer from %s', async (key, value) => {
    const requestApproval = vi.fn().mockResolvedValue(true);
    const safeSign = withClearSign(vi.fn().mockResolvedValue('ok'), { requestApproval });

    await safeSign('xdr', { [key]: value });

    expect(requestApproval).toHaveBeenCalledWith('xdr', expect.objectContaining({ signerAddress: value }));
  });

  it('prefers signerAddress over address and publicKey', async () => {
    const requestApproval = vi.fn().mockResolvedValue(true);
    const safeSign = withClearSign(vi.fn().mockResolvedValue('ok'), { requestApproval });

    await safeSign('xdr', { signerAddress: 'A', address: 'B', publicKey: 'C' });

    expect(requestApproval).toHaveBeenCalledWith('xdr', expect.objectContaining({ signerAddress: 'A' }));
  });

  it('forwards intent and specs to the approval request', async () => {
    const requestApproval = vi.fn().mockResolvedValue(true);
    const safeSign = withClearSign(vi.fn().mockResolvedValue('ok'), { requestApproval });
    const intent = { contractId: 'C1', functionName: 'transfer' };
    const specs = { C1: new Uint8Array([1, 2, 3]) };

    await safeSign('xdr', { intent, specs });

    expect(requestApproval).toHaveBeenCalledWith('xdr', expect.objectContaining({ intent, specs }));
  });
});
