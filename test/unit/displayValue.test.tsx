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

describe('DisplayValueRenderer: enums', () => {
  it('renders the enum name, variant and payload', () => {
    render(<DisplayValueRenderer val={{ kind: 'enum', name: 'Mode', variant: 'Scheduled', values: [u32('1700000000')] }} />);

    expect(screen.getByText('Mode::Scheduled')).toBeInTheDocument();
    expect(screen.getByText('1700000000')).toBeInTheDocument();
  });

  it('renders a unit variant without a payload list', () => {
    render(<DisplayValueRenderer val={{ kind: 'enum', name: 'Mode', variant: 'Fast', values: [] }} />);

    expect(screen.getByText('Mode::Fast')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('DisplayValueRenderer: options', () => {
  it('renders None for an empty option', () => {
    render(<DisplayValueRenderer val={{ kind: 'option', value: null }} />);
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('renders the wrapped value of Some', () => {
    const { container } = render(<DisplayValueRenderer val={{ kind: 'option', value: u32('7') }} />);
    expect(container).toHaveTextContent('Some(7)');
  });
});

describe('DisplayValueRenderer: time values', () => {
  it('labels timepoints', () => {
    const { container } = render(<DisplayValueRenderer val={{ kind: 'timepoint', value: '1700000000' }} />);
    expect(container).toHaveTextContent('Timepoint 1700000000');
  });

  it('labels durations', () => {
    const { container } = render(<DisplayValueRenderer val={{ kind: 'duration', value: '3600' }} />);
    expect(container).toHaveTextContent('Duration 3600');
  });
});
