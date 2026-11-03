import React from "react";
import { DisplayValue } from "@clearsign/core";
import { AddressHashView } from "./AddressHashView.js";
import { ClearSignMessages } from "../i18n/messages.js";
import { useClearSignMessages } from "../i18n/context.js";

export interface DisplayValueRendererProps {
  val: DisplayValue;
  messages?: Partial<ClearSignMessages> | undefined;
}

export const DisplayValueRenderer: React.FC<DisplayValueRendererProps> = ({
  val,
  messages,
}) => {
  const m = useClearSignMessages(messages);

  if (val.kind === "address") {
    return (
      <AddressHashView value={val.value} kind="address" messages={messages} />
    );
  }
  if (val.kind === "string" || val.kind === "symbol") {
    return (
      <span>
        <span>{val.value}</span>
        {val.truncated && <em> {m.truncatedBadge}</em>}
        {val.sanitized && (
          <em title={m.sanitizedTooltip}> {m.sanitizedBadge}</em>
        )}
      </span>
    );
  }
  if (val.kind === "int" || val.kind === "bool" || val.kind === "void") {
    return <span>{"value" in val ? String(val.value) : "void"}</span>;
  }
  if (val.kind === "bytes") {
    return (
      <span>
        <span>{val.hex}</span>
        {val.truncated ? "…" : ""}{" "}
        {val.length !== undefined && (
          <span>{m.bytesFormatted(val.length, val.truncated)}</span>
        )}
      </span>
    );
  }
  if (val.kind === "vec") {
    return (
      <ul>
        {val.items.map((item, i) => (
          <li key={i}>
            <DisplayValueRenderer val={item} messages={messages} />
          </li>
        ))}
      </ul>
    );
  }
  if (val.kind === "struct") {
    return (
      <ul>
        {val.fields.map((f, i) => (
          <li key={i}>
            <strong>{f.name}:</strong>{" "}
            <DisplayValueRenderer val={f.value} messages={messages} />
          </li>
        ))}
      </ul>
    );
  }
  if (val.kind === "map") {
    if (val.entries.length === 0) return <span>{m.emptyMap}</span>;
    return (
      <ul>
        {val.entries.map((entry, i) => (
          <li key={i}>
            <DisplayValueRenderer val={entry.key} messages={messages} />{" "}
            <span aria-hidden="true">&rarr;</span>{" "}
            <DisplayValueRenderer val={entry.value} messages={messages} />
          </li>
        ))}
      </ul>
    );
  }
  if (val.kind === "enum") {
    return (
      <span>
        <strong>
          {val.name}::{val.variant}
        </strong>
        {val.values.length > 0 && (
          <ul>
            {val.values.map((v, i) => (
              <li key={i}>
                <DisplayValueRenderer val={v} messages={messages} />
              </li>
            ))}
          </ul>
        )}
      </span>
    );
  }
  if (val.kind === "option") {
    if (val.value === null) return <span>{m.optionNone}</span>;
    return (
      <span>
        {m.optionSomePrefix}
        <DisplayValueRenderer val={val.value} messages={messages} />)
      </span>
    );
  }
  if (val.kind === "timepoint" || val.kind === "duration") {
    return (
      <span>
        {val.kind === "timepoint" ? m.timepointLabel : m.durationLabel}{" "}
        {val.value}
      </span>
    );
  }
  if (val.kind === "raw") {
    return <span title={val.xdr}>{m.undecodedLabel(val.scvalType)}</span>;
  }
  return <span>{m.complexValue}</span>;
};
