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
  if (val.kind === 'map') {
    if (val.entries.length === 0) return <span>Empty map</span>;
    return (
      <ul>
        {val.entries.map((entry, i) => (
           <li key={i}>
             <DisplayValueRenderer val={entry.key} /> <span aria-hidden="true">&rarr;</span> <DisplayValueRenderer val={entry.value} />
           </li>
        ))}
      </ul>
    );
  }
  if (val.kind === 'enum') {
    return (
      <span>
        <strong>{val.name}::{val.variant}</strong>
        {val.values.length > 0 && (
          <ul>
            {val.values.map((v, i) => (
               <li key={i}><DisplayValueRenderer val={v} /></li>
            ))}
          </ul>
        )}
      </span>
    );
  }
  if (val.kind === 'option') {
    if (val.value === null) return <span>None</span>;
    return <span>Some(<DisplayValueRenderer val={val.value} />)</span>;
  }
  if (val.kind === 'timepoint' || val.kind === 'duration') {
    return <span>{val.kind === 'timepoint' ? 'Timepoint' : 'Duration'} {val.value}</span>;
  }
  if (val.kind === 'raw') {
    return (
      <span title={val.xdr}>
        Undecoded {val.scvalType} value (raw XDR available below)
      </span>
    );
  }
  return <span>Complex value</span>;
};
