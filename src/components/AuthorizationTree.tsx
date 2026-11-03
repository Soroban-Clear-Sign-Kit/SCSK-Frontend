import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import styles from "../styles.module.css";
import { shortenAddress } from "../utils.js";
import { ClearSignMessages } from "../i18n/messages.js";
import { useClearSignMessages } from "../i18n/context.js";

export interface AuthTreeWarning {
  code: string;
  message: string;
  severity?: "warning" | "blocked" | "info";
}

export interface AuthTreeArg {
  name?: string;
  value: unknown;
}

export interface AuthTreeNode {
  id?: string | undefined;
  contract?: string | undefined;
  functionName?: string | undefined;
  args?: AuthTreeArg[] | undefined;
  children?: AuthTreeNode[] | undefined;
  warnings?: AuthTreeWarning[] | undefined;
  kind?: string | undefined;
}

export interface AuthorizationTreeProps {
  nodes: AuthTreeNode[];
  defaultExpandedDepth?: number | undefined;
  className?: string | undefined;
  onNodeSelect?: ((node: AuthTreeNode) => void) | undefined;
  ariaLabel?: string | undefined;
  messages?: Partial<ClearSignMessages> | undefined;
}

interface FlatVisibleNode {
  id: string;
  node: AuthTreeNode;
  level: number;
  parentId: string | null;
  hasChildren: boolean;
  isExpanded: boolean;
}

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${styles.authTreeChevron} ${
      expanded ? styles.authTreeChevronExpanded : ""
    }`}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const AuthorizationTree: React.FC<AuthorizationTreeProps> = ({
  nodes,
  defaultExpandedDepth = 2,
  className = "",
  onNodeSelect,
  ariaLabel,
  messages,
}) => {
  const m = useClearSignMessages(messages);
  const effectiveAriaLabel = ariaLabel || m.authTreeAriaLabel;
  // Normalize nodes with unique IDs if missing
  const normalizedNodes = useMemo(() => {
    let counter = 0;
    const assignIds = (
      items: AuthTreeNode[],
      prefix = "node",
    ): AuthTreeNode[] => {
      return items.map((item, index) => {
        const id = item.id || `${prefix}-${index}-${counter++}`;
        return {
          ...item,
          id,
          children: item.children ? assignIds(item.children, id) : undefined,
        };
      });
    };
    return assignIds(nodes);
  }, [nodes]);

  // Set of expanded node IDs; level > defaultExpandedDepth collapsed by default
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    const computeInitialExpanded = (
      items: AuthTreeNode[],
      currentLevel = 1,
    ) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          const nodeId = item.id ?? "";
          if (currentLevel <= defaultExpandedDepth && nodeId) {
            initial.add(nodeId);
          }
          computeInitialExpanded(item.children, currentLevel + 1);
        }
      }
    };
    computeInitialExpanded(normalizedNodes, 1);
    return initial;
  });

  // Track which fields have full-value revealed
  const [revealedValues, setRevealedValues] = useState<Set<string>>(new Set());

  // Flatten visible nodes for keyboard navigation
  const visibleNodes = useMemo<FlatVisibleNode[]>(() => {
    const list: FlatVisibleNode[] = [];
    const flatten = (
      items: AuthTreeNode[],
      level: number,
      parentId: string | null,
    ) => {
      for (const item of items) {
        const nodeId = item.id ?? "";
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isExpanded = hasChildren && expandedIds.has(nodeId);
        list.push({
          id: nodeId,
          node: item,
          level,
          parentId,
          hasChildren,
          isExpanded,
        });
        if (hasChildren && isExpanded && item.children) {
          flatten(item.children, level + 1, nodeId);
        }
      }
    };
    flatten(normalizedNodes, 1, null);
    return list;
  }, [normalizedNodes, expandedIds]);

  const [focusedId, setFocusedId] = useState<string | null>(() => {
    return visibleNodes.length > 0 ? (visibleNodes[0]?.id ?? null) : null;
  });

  const itemRefs = useRef<Record<string, HTMLElement | null>>({});

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleReveal = useCallback((revealKey: string) => {
    setRevealedValues((prev) => {
      const next = new Set(prev);
      if (next.has(revealKey)) {
        next.delete(revealKey);
      } else {
        next.add(revealKey);
      }
      return next;
    });
  }, []);

  // When focusedId changes, move focus to the DOM element
  useEffect(() => {
    if (focusedId && itemRefs.current[focusedId]) {
      itemRefs.current[focusedId]?.focus();
    }
  }, [focusedId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (visibleNodes.length === 0) return;
    const currentIndex = visibleNodes.findIndex((vn) => vn.id === focusedId);
    const currentNode =
      currentIndex >= 0 ? visibleNodes[currentIndex] : visibleNodes[0];
    if (!currentNode) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, visibleNodes.length - 1);
        const nextNode = visibleNodes[nextIndex];
        if (nextNode) {
          setFocusedId(nextNode.id);
        }
        break;
      }

      case "ArrowUp": {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        const prevNode = visibleNodes[prevIndex];
        if (prevNode) {
          setFocusedId(prevNode.id);
        }
        break;
      }

      case "ArrowRight": {
        e.preventDefault();
        if (currentNode.hasChildren) {
          if (!currentNode.isExpanded) {
            toggleExpand(currentNode.id);
          } else {
            // Already expanded: move to first child
            const nextIndex = currentIndex + 1;
            const nextNode = visibleNodes[nextIndex];
            if (nextNode) {
              setFocusedId(nextNode.id);
            }
          }
        }
        break;
      }

      case "ArrowLeft": {
        e.preventDefault();
        if (currentNode.hasChildren && currentNode.isExpanded) {
          // Collapse current node
          toggleExpand(currentNode.id);
        } else if (currentNode.parentId) {
          // Move focus to parent node
          setFocusedId(currentNode.parentId);
        }
        break;
      }

      case "Home": {
        e.preventDefault();
        const first = visibleNodes[0];
        if (first) {
          setFocusedId(first.id);
        }
        break;
      }

      case "End": {
        e.preventDefault();
        const last = visibleNodes[visibleNodes.length - 1];
        if (last) {
          setFocusedId(last.id);
        }
        break;
      }

      case "Enter":
      case " ": {
        e.preventDefault();
        if (currentNode.hasChildren) {
          toggleExpand(currentNode.id);
        }
        if (onNodeSelect) {
          onNodeSelect(currentNode.node);
        }
        break;
      }
    }
  };

  const renderArgs = (args: AuthTreeArg[], nodeId: string) => {
    if (!args || args.length === 0) return null;
    return (
      <ul className={styles.authTreeArgs} aria-label={m.authTreeArgsAriaLabel}>
        {args.map((arg, idx) => {
          const argKey = `${nodeId}-arg-${idx}`;
          const isRevealed = revealedValues.has(argKey);
          let formattedValue: string;
          try {
            formattedValue =
              typeof arg.value === "object" && arg.value !== null
                ? JSON.stringify(arg.value, null, 2)
                : String(arg.value);
          } catch {
            formattedValue = "[Circular / Complex]";
          }

          const isLong =
            formattedValue.length > 25 || formattedValue.includes("\n");
          const displayPreview =
            isLong && !isRevealed
              ? `${formattedValue.slice(0, 25)}...`
              : formattedValue;

          return (
            <li key={idx} className={styles.authTreeArgItem}>
              <strong>{arg.name || `arg[${idx}]`}:</strong>{" "}
              <span>{displayPreview}</span>
              {isLong && (
                <button
                  type="button"
                  className={styles.authTreeRevealBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReveal(argKey);
                  }}
                  aria-expanded={isRevealed}
                  aria-label={
                    isRevealed
                      ? m.hideFullArgValue(arg.name)
                      : m.revealFullArgValue(arg.name)
                  }
                >
                  {isRevealed ? m.hide : m.reveal}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderTreeItem = (item: AuthTreeNode, level: number) => {
    const id = item.id ?? "";
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isExpanded = hasChildren && expandedIds.has(id);
    const isFocused = focusedId === id;
    const isContractRevealed = revealedValues.has(`${id}-contract`);

    return (
      <li
        key={id}
        role="treeitem"
        id={id}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-level={level}
        tabIndex={isFocused ? 0 : -1}
        ref={(el) => {
          itemRefs.current[id] = el;
        }}
        className={styles.authTreeItem}
        onClick={(e) => {
          e.stopPropagation();
          setFocusedId(id);
          if (hasChildren) {
            toggleExpand(id);
          }
          if (onNodeSelect) {
            onNodeSelect(item);
          }
        }}
      >
        <div
          className={`${styles.authTreeRow} ${
            isFocused ? styles.authTreeRowFocused : ""
          }`}
        >
          {hasChildren ? (
            <button
              type="button"
              className={styles.authTreeChevron}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(id);
              }}
              aria-label={
                isExpanded ? m.collapseSubInvocations : m.expandSubInvocations
              }
              tabIndex={-1}
            >
              <ChevronIcon expanded={isExpanded} />
            </button>
          ) : (
            <span style={{ width: 20 }} aria-hidden="true" />
          )}

          {item.kind && (
            <span className={styles.authTreeKind}>{item.kind}</span>
          )}

          {item.contract && (
            <span className={styles.authTreeContract}>
              {isContractRevealed
                ? item.contract
                : shortenAddress(item.contract)}
              {item.contract.length > 12 && (
                <button
                  type="button"
                  className={styles.authTreeRevealBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReveal(`${id}-contract`);
                  }}
                  aria-expanded={isContractRevealed}
                  aria-label={
                    isContractRevealed
                      ? m.hideFullContract
                      : m.revealFullContract
                  }
                  tabIndex={-1}
                >
                  {isContractRevealed ? m.hide : m.reveal}
                </button>
              )}
            </span>
          )}

          {item.functionName && (
            <span className={styles.authTreeFunction}>
              {item.functionName}()
            </span>
          )}

          {item.warnings && item.warnings.length > 0 && (
            <span style={{ display: "inline-flex", gap: 4 }}>
              {item.warnings.map((w, wi) => (
                <span
                  key={wi}
                  className={`${styles.authTreeNodeWarning} ${
                    w.severity === "blocked"
                      ? styles.authTreeNodeWarningBlocked
                      : ""
                  }`}
                  role="status"
                  aria-label={`Warning: ${w.code} - ${w.message}`}
                >
                  <span aria-hidden="true">⚠️</span>
                  <span>{w.code}</span>
                </span>
              ))}
            </span>
          )}
        </div>

        {/* Decoded Arguments with inline full-value reveal */}
        {item.args && item.args.length > 0 && renderArgs(item.args, id)}

        {/* Lazy Children: Only rendered in DOM when node is expanded */}
        {hasChildren && isExpanded && item.children && (
          <ul role="group" className={styles.authTreeGroup}>
            {item.children.map((child) => renderTreeItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul
      role="tree"
      aria-label={effectiveAriaLabel}
      className={`${styles.authTreeRoot} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {normalizedNodes.map((node) => renderTreeItem(node, 1))}
    </ul>
  );
};

/**
 * Helper to convert arbitrary @clearsign/core auth entries or generic invocation trees
 * into the standardized local AuthTreeNode[] structure.
 */
export function convertCoreAuthToTree(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- supports arbitrary external auth shapes
  authEntries: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- supports arbitrary warning shapes
  warnings: any[] = [],
): AuthTreeNode[] {
  if (!authEntries || !Array.isArray(authEntries)) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapNode = (node: any, prefix: string): AuthTreeNode => {
    if (!node) return { id: prefix, kind: "unknown" };

    const matchingWarnings = warnings.filter(
      (w) => node.contractId && w.message?.includes(node.contractId),
    );

    return {
      id: prefix,
      kind: node.kind || "invocation",
      contract: node.contractId,
      functionName: node.functionName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: node.args?.map((a: any) => ({
        name: a.name,
        value: "value" in a ? a.value : a,
      })),
      warnings:
        node.warnings ||
        (matchingWarnings.length > 0 ? matchingWarnings : undefined),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: node.children?.map((c: any, ci: number) =>
        mapNode(c, `${prefix}-${ci}`),
      ),
    };
  };

  return authEntries.map((entry, i) => {
    const root = entry.root || entry;
    return mapNode(root, `auth-${i}`);
  });
}
