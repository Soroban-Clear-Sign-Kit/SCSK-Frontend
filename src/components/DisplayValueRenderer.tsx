import React from 'react';
import { DisplayValue } from '@clearsign/core';
import { shortenAddress, handleCopy } from '../utils.js';

export const DisplayValueRenderer: React.FC<{ val: DisplayValue }> = ({ val }) => {
  if (val.kind === 'address') {
    return (
      <span title={val.value}>
        {shortenAddress(val.value)}
        <button type="button" onClick={() => handleCopy(val.value)} aria-label="Copy address">Copy</button>
      </span>
    );
  }
  if (val.kind === 'int' || val.kind === 'bool' || val.kind === 'string' || val.kind === 'symbol' || val.kind === 'void') {
    return <span>{'value' in val ? String(val.value) : 'void'}</span>;
  }
  if (val.kind === 'bytes') {
    return <span>{val.hex}</span>;
  }
  if (val.kind === 'vec') {
    return (
      <ul>
        {val.items.map((item, i) => (
           <li key={i}><DisplayValueRenderer val={item} /></li>
        ))}
      </ul>
    );
  }
  if (val.kind === 'struct') {
    return (
      <ul>
        {val.fields.map((f, i) => (
           <li key={i}><strong>{f.name}:</strong> <DisplayValueRenderer val={f.value} /></li>
        ))}
      </ul>
    );
  }
  return <span>Complex value</span>;
};
