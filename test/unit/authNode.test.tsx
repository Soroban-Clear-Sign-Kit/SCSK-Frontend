import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthNodeRenderer } from '../../src/components/AuthNodeRenderer.js';
import type { AuthNode } from '@clearsign/core';

const call = (overrides: Partial<AuthNode> = {}): AuthNode => ({
  kind: 'contract-fn',
  contractId: 'CABCDEFGHIJKLMNOP',
  functionName: 'transfer',
  depth: 0,
  children: [],
  ...overrides,
});

describe('AuthNodeRenderer: arguments', () => {
  it('shows the decoded arguments of an authorized call', () => {
    render(
      <AuthNodeRenderer
        node={call({
          args: [
            { name: 'amount', typeName: 'i128', value: { kind: 'int', type: 'i128', value: '2500' } },
            { name: 'memo', typeName: null, value: { kind: 'string', value: 'rent', truncated: false, sanitized: false } },
          ],
        })}
      />
    );

    expect(screen.getByText('amount:')).toBeInTheDocument();
    expect(screen.getByText('2500')).toBeInTheDocument();
    expect(screen.getByText('memo:')).toBeInTheDocument();
    expect(screen.getByText('rent')).toBeInTheDocument();
  });

  it('falls back to a placeholder name for unnamed arguments', () => {
    render(
      <AuthNodeRenderer
        node={call({ args: [{ name: null, typeName: null, value: { kind: 'bool', value: true } }] })}
      />
    );
    expect(screen.getByText('arg:')).toBeInTheDocument();
  });

  it('shows the arguments of nested sub-invocations', () => {
    render(
      <AuthNodeRenderer
        node={call({
          children: [
            call({
              functionName: 'inner',
              depth: 1,
              args: [{ name: 'to', typeName: null, value: { kind: 'int', type: 'u32', value: '99' } }],
            }),
          ],
        })}
      />
    );
    expect(screen.getByText('to:')).toBeInTheDocument();
    expect(screen.getByText('99')).toBeInTheDocument();
  });
});

describe('AuthNodeRenderer: contract creation details', () => {
  it('lists the details of a create-contract authorization', () => {
    render(
      <AuthNodeRenderer
        node={{
          kind: 'create-contract-v2',
          depth: 0,
          children: [],
          details: { executable: 'wasm:abcd', salt: '0011' },
        }}
      />
    );

    expect(screen.getByText('create-contract-v2')).toBeInTheDocument();
    expect(screen.getByText('executable')).toBeInTheDocument();
    expect(screen.getByText('wasm:abcd')).toBeInTheDocument();
    expect(screen.getByText('salt')).toBeInTheDocument();
    expect(screen.getByText('0011')).toBeInTheDocument();
  });

  it('renders no definition list when there are no details', () => {
    const { container } = render(<AuthNodeRenderer node={call()} />);
    expect(container.querySelector('dl')).toBeNull();
  });
});
