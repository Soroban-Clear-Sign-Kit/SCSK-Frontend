import React from "react";
import { AuthNode } from "@clearsign/core";
import { shortenAddress } from "../utils.js";
import styles from "../styles.module.css";

export const AuthNodeRenderer: React.FC<{ node: AuthNode }> = ({ node }) => {
  return (
    <div className={styles.treeNode}>
      <div>
        <strong>{node.kind}</strong>
      </div>
      {node.contractId && (
        <div>
          Contract:{" "}
          <span title={node.contractId}>{shortenAddress(node.contractId)}</span>
        </div>
      )}
      {node.functionName && <div>Function: {node.functionName}</div>}
      {node.children && node.children.length > 0 && (
        <div>
          Sub-invocations:
          {node.children.map((child, i) => (
            <AuthNodeRenderer key={i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};
