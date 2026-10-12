import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisplayValueRenderer } from '../../src/components/DisplayValueRenderer.js';
import type { DisplayValue } from '@clearsign/core';

const u32 = (value: string): DisplayValue => ({ kind: 'int', type: 'u32', value });
const sym = (value: string): DisplayValue => ({ kind: 'symbol', value, truncated: false, sanitized: false });

describe('DisplayValueRenderer: maps', () => {
  it('renders every key and value of a map', () => {
    render(
      <DisplayValueRenderer
        val={{
          kind: 'map',
          entries: [
            { key: sym('fee'), value: u32('30') },
            { key: sym('cap'), value: u32('900') },
          ],
        }}
      />
    );

    expect(screen.getByText('fee')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('cap')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.queryByText('Complex value')).not.toBeInTheDocument();
  });

  it('renders an empty map explicitly', () => {
    render(<DisplayValueRenderer val={{ kind: 'map', entries: [] }} />);
    expect(screen.getByText('Empty map')).toBeInTheDocument();
  });
});
