import React from "react";
import { AuthNode } from "@clearsign/core";
import { DisplayValueRenderer } from "./DisplayValueRenderer.js";
import { AddressHashView } from "./AddressHashView.js";
import { ClearSignMessages } from "../i18n/messages.js";
import { useClearSignMessages } from "../i18n/context.js";
import styles from "../styles.module.css";

export interface AuthNodeRendererProps {
  node: AuthNode;
  messages?: Partial<ClearSignMessages> | undefined;
}

export const AuthNodeRenderer: React.FC<AuthNodeRendererProps> = ({
  node,
  messages,
}) => {
  const m = useClearSignMessages(messages);

  return (
    <div className={styles.treeNode}>
      <div>
        <strong>{node.kind}</strong>
      </div>
      {node.contractId && (
        <div>
          {m.contractLabel}{" "}
          <AddressHashView
            value={node.contractId}
            kind="address"
            messages={messages}
          />
        </div>
      )}
      {node.functionName && (
        <div>
          {m.functionLabel} {node.functionName}
        </div>
      )}
      {node.args && node.args.length > 0 && (
        <ul>
          {node.args.map((arg, i) => (
            <li key={i}>
              <strong>{arg.name || "arg"}:</strong>{" "}
              <DisplayValueRenderer val={arg.value} messages={messages} />
            </li>
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
          {m.subInvocationsLabel}
          {node.children.map((child, i) => (
            <AuthNodeRenderer key={i} node={child} messages={messages} />
          ))}
        </div>
      )}
    </div>
  );
};
