import React from 'react';
import { AuthNode } from '@clearsign/core';
import { shortenAddress } from '../utils.js';
import { DisplayValueRenderer } from './DisplayValueRenderer.js';
import styles from '../styles.module.css';

export const AuthNodeRenderer: React.FC<{ node: AuthNode }> = ({ node }) => {
  return (
    <div className={styles.treeNode}>
      <div><strong>{node.kind}</strong></div>
      {node.contractId && <div>Contract: <span title={node.contractId}>{shortenAddress(node.contractId)}</span></div>}
      {node.functionName && <div>Function: {node.functionName}</div>}
      {node.args && node.args.length > 0 && (
        <ul>
          {node.args.map((arg, i) => (
            <li key={i}><strong>{arg.name || 'arg'}:</strong> <DisplayValueRenderer val={arg.value} /></li>
          ))}
        </ul>
      )}
      {node.details && Object.keys(node.details).length > 0 && (
        <dl>
          {Object.entries(node.details).map(([key, value]) => (
            <React.Fragment key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
      {node.children && node.children.length > 0 && (
        <div>
          Sub-invocations:
          {node.children.map((child, i) => <AuthNodeRenderer key={i} node={child} />)}
        </div>
      )}
    </div>
  );
};
