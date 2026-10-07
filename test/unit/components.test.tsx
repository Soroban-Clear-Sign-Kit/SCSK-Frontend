import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClearSignModal } from '../../src/ClearSignModal.js';
import { ClearSignPreview } from '@clearsign/core';

describe('ClearSignModal', () => {
  const basePreview: ClearSignPreview = {
    version: 1,
    risk: 'ok',
    warnings: [],
    network: { passphrase: 'test', verified: true },
    envelope: { source: 'G123', sequence: '1', fee: '100', operations: [] },
    auth: [],
    simulation: { status: 'success' },
    effects: [],
    summary: [],
    raw: { xdr: 'AAAA' }
  };

  it('renders risk ok and allows approve', () => {
    const onApprove = vi.fn();
    render(<ClearSignModal preview={basePreview} onApprove={onApprove} onReject={vi.fn()} />);
    
    expect(screen.getByText('Decoded and verified')).toBeInTheDocument();
    
    const approveBtn = screen.getByRole('button', { name: 'Approve' });
    expect(approveBtn).not.toBeDisabled();
    fireEvent.click(approveBtn);
    expect(onApprove).toHaveBeenCalled();
  });

  it('hides approve on blocked risk', () => {
    const blockedPreview = { ...basePreview, risk: 'blocked' as const };
    render(<ClearSignModal preview={blockedPreview} onApprove={vi.fn()} onReject={vi.fn()} />);
    
    expect(screen.getByText('Signing blocked')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('requires checkbox for review risk', () => {
    const reviewPreview = { ...basePreview, risk: 'review' as const };
    render(<ClearSignModal preview={reviewPreview} onApprove={vi.fn()} onReject={vi.fn()} />);
    
    expect(screen.getByText('Review carefully')).toBeInTheDocument();
    
    const approveBtn = screen.getByRole('button', { name: 'Approve' });
    expect(approveBtn).toBeDisabled();
    
    const checkbox = screen.getByRole('checkbox', { name: /I have reviewed the warnings/i });
    fireEvent.click(checkbox);
    
    expect(approveBtn).not.toBeDisabled();
  });

  it('triggers reject on Escape key', () => {
    const onReject = vi.fn();
    render(<ClearSignModal preview={basePreview} onApprove={vi.fn()} onReject={onReject} />);
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onReject).toHaveBeenCalled();
  });

  it('renders malicious strings safely', () => {
    const maliciousPreview = {
      ...basePreview,
      summary: ['<script>alert("xss")</script>']
    };
    render(<ClearSignModal preview={maliciousPreview} onApprove={vi.fn()} onReject={vi.fn()} />);
    
    // React escapes text natively, we just check it is rendered as text
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
  });
});
