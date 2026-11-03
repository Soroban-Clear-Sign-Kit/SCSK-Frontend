import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  AuthorizationTree,
  AuthTreeNode,
  convertCoreAuthToTree,
} from "../../src/components/AuthorizationTree.js";
import { ClearSignModal } from "../../src/ClearSignModal.js";
import { ClearSignPreview } from "@clearsign/core";

describe("AuthorizationTree Component", () => {
  const sampleTree: AuthTreeNode[] = [
    {
      id: "node-root",
      kind: "contract-fn",
      contract: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      functionName: "deposit",
      args: [
        {
          name: "amount",
          value: "1000000000000000000000000000000",
        },
        {
          name: "recipient",
          value: "GA2345678901234567890123456789012345678901234567890123456",
        },
      ],
      warnings: [
        {
          code: "LARGE_AMOUNT",
          message: "Transfer amount exceeds safe threshold",
          severity: "warning",
        },
      ],
      children: [
        {
          id: "node-child-1",
          kind: "contract-fn",
          contract: "CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
          functionName: "mint",
          args: [{ name: "shares", value: 50 }],
          children: [
            {
              id: "node-grandchild-1",
              kind: "transfer",
              contract:
                "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
              functionName: "transfer_internal",
              args: [],
              children: [],
            },
          ],
        },
        {
          id: "node-child-2",
          kind: "create-contract",
          contract: "CDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
          functionName: "init",
          warnings: [
            {
              code: "UNTRUSTED_CODE",
              message: "Bytecode hash is unverified",
              severity: "blocked",
            },
          ],
        },
      ],
    },
  ];

  describe("WAI-ARIA Tree Structure & Truncation Reveal", () => {
    it("renders tree with role='tree' and items with role='treeitem'", () => {
      render(<AuthorizationTree nodes={sampleTree} />);

      const tree = screen.getByRole("tree");
      expect(tree).toBeInTheDocument();
      expect(tree).toHaveAttribute("aria-label", "Authorization Tree");

      const treeitems = screen.getAllByRole("treeitem");
      expect(treeitems.length).toBeGreaterThanOrEqual(1);
    });

    it("collapses nodes deeper than level 2 by default", () => {
      render(<AuthorizationTree nodes={sampleTree} defaultExpandedDepth={2} />);

      // Level 1 (node-root) is expanded
      const rootItem = document.getElementById("node-root");
      expect(rootItem).toHaveAttribute("aria-expanded", "true");

      // Level 2 (node-child-1) is expanded by default
      const child1 = document.getElementById("node-child-1");
      expect(child1).toHaveAttribute("aria-expanded", "true");

      // Grandchild at level 3 is in DOM because parent (level 2) is expanded,
      // but its own children (if any) would be collapsed
      const grandchild = document.getElementById("node-grandchild-1");
      expect(grandchild).toBeInTheDocument();
    });

    it("reveals and hides full contract address on button click", () => {
      render(<AuthorizationTree nodes={sampleTree} />);

      // Initially shortened
      expect(screen.getByText("CAAA...AAAA")).toBeInTheDocument();

      const revealBtn = screen.getAllByRole("button", {
        name: "Reveal full contract address",
      })[0];
      expect(revealBtn).toBeDefined();
      if (revealBtn) {
        fireEvent.click(revealBtn);
      }

      // Full address revealed
      expect(
        screen.getByText(
          "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        ),
      ).toBeInTheDocument();
      const hideBtn = screen.getAllByRole("button", {
        name: "Hide full contract address",
      })[0];
      expect(hideBtn).toBeInTheDocument();

      // Click to hide again
      if (hideBtn) {
        fireEvent.click(hideBtn);
      }
      expect(screen.getByText("CAAA...AAAA")).toBeInTheDocument();
    });

    it("reveals and hides truncated decoded argument values", () => {
      render(<AuthorizationTree nodes={sampleTree} />);

      const revealArgBtn = screen.getByRole("button", {
        name: "Reveal full value for amount",
      });
      expect(revealArgBtn).toBeInTheDocument();

      // Click to reveal full value
      fireEvent.click(revealArgBtn);
      expect(
        screen.getByText("1000000000000000000000000000000"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Hide full value for amount" }),
      ).toBeInTheDocument();

      // Click to hide
      fireEvent.click(
        screen.getByRole("button", { name: "Hide full value for amount" }),
      );
      expect(
        screen.getByRole("button", { name: "Reveal full value for amount" }),
      ).toBeInTheDocument();
    });

    it("attaches warnings to the specific node that caused them", () => {
      render(<AuthorizationTree nodes={sampleTree} />);

      // Warning attached to root
      expect(screen.getByText("LARGE_AMOUNT")).toBeInTheDocument();

      // Blocked warning attached to node-child-2
      const blockedWarning = screen.getByText("UNTRUSTED_CODE");
      expect(blockedWarning).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation (WAI-ARIA Pattern)", () => {
    it("supports ArrowDown, ArrowUp, ArrowRight, ArrowLeft, Home, End, and Enter/Space", () => {
      const onSelect = vi.fn();
      render(<AuthorizationTree nodes={sampleTree} onNodeSelect={onSelect} />);

      const tree = screen.getByRole("tree");

      // Root is focused initially
      const rootItem = document.getElementById("node-root");
      expect(rootItem).toHaveAttribute("tabindex", "0");

      // ArrowDown to node-child-1
      fireEvent.keyDown(tree, { key: "ArrowDown" });
      const child1 = document.getElementById("node-child-1");
      expect(child1).toHaveAttribute("tabindex", "0");

      // ArrowUp back to root
      fireEvent.keyDown(tree, { key: "ArrowUp" });
      expect(rootItem).toHaveAttribute("tabindex", "0");

      // ArrowLeft collapses expanded root node
      fireEvent.keyDown(tree, { key: "ArrowLeft" });
      expect(rootItem).toHaveAttribute("aria-expanded", "false");

      // ArrowRight expands collapsed root node
      fireEvent.keyDown(tree, { key: "ArrowRight" });
      expect(rootItem).toHaveAttribute("aria-expanded", "true");

      // End moves to last visible item
      fireEvent.keyDown(tree, { key: "End" });
      const child2 = document.getElementById("node-child-2");
      expect(child2).toHaveAttribute("tabindex", "0");

      // Home moves back to first item
      fireEvent.keyDown(tree, { key: "Home" });
      expect(rootItem).toHaveAttribute("tabindex", "0");

      // Enter toggles and invokes onSelect
      fireEvent.keyDown(tree, { key: "Enter" });
      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe("Performance: 500-Node Large Tree Rendering Without Jank", () => {
    function generateLargeTree(count: number): AuthTreeNode[] {
      const rootChildren: AuthTreeNode[] = [];
      let created = 1;

      // 10 top-level branches
      for (let i = 0; i < 10 && created < count; i++) {
        const branchChildren: AuthTreeNode[] = [];
        // 5 sub-branches
        for (let j = 0; j < 5 && created < count; j++) {
          const leafNodes: AuthTreeNode[] = [];
          // 10 leaves
          for (let k = 0; k < 10 && created < count; k++) {
            leafNodes.push({
              id: `leaf-${i}-${j}-${k}`,
              kind: "transfer",
              contract: `C${i}${j}${k}000000000000000000000000000000000000000`,
              functionName: "execute",
              args: [{ name: "seq", value: created }],
            });
            created++;
          }
          branchChildren.push({
            id: `sub-${i}-${j}`,
            kind: "contract-fn",
            contract: `C${i}${j}000000000000000000000000000000000000000000`,
            functionName: "sub_call",
            children: leafNodes,
          });
          created++;
        }
        rootChildren.push({
          id: `branch-${i}`,
          kind: "contract-fn",
          contract: `C${i}00000000000000000000000000000000000000000000`,
          functionName: "branch_call",
          children: branchChildren,
        });
        created++;
      }

      return [
        {
          id: "perf-root",
          kind: "contract-fn",
          contract: "CROOT0000000000000000000000000000000000000000",
          functionName: "main",
          children: rootChildren,
        },
      ];
    }

    it("renders a 500-node tree quickly and lazily collapses deep nodes", () => {
      const largeTree = generateLargeTree(500);

      const startTime = performance.now();
      render(<AuthorizationTree nodes={largeTree} defaultExpandedDepth={2} />);
      const renderDuration = performance.now() - startTime;

      // Performance check: should render smoothly in under 100ms in jsdom
      expect(renderDuration).toBeLessThan(100);

      // Root is rendered
      expect(document.getElementById("perf-root")).toBeInTheDocument();

      // Level 1 branches are rendered
      expect(document.getElementById("branch-0")).toBeInTheDocument();

      // Deep leaf nodes (> level 2) are lazily omitted from the initial DOM
      expect(document.getElementById("leaf-0-0-0")).toBeNull();

      // Expanding the sub-branch renders its lazy children
      const subBranch = document.getElementById("sub-0-0");
      expect(subBranch).toBeInTheDocument();
      const chevron = subBranch?.querySelector("button");
      if (chevron) {
        fireEvent.click(chevron);
        expect(document.getElementById("leaf-0-0-0")).toBeInTheDocument();
      }
    });
  });

  describe("ClearSignModal Integration behind prop", () => {
    const basePreview: ClearSignPreview = {
      version: 1,
      risk: "ok",
      warnings: [],
      network: {
        passphrase: "test",
        rpcMatches: true,
        signatureBound: true,
      },
      envelope: { source: "G123", sequence: "1", fee: "100", operations: [] },
      auth: [
        {
          credentials: {
            type: "address",
            address: "G123",
            nonce: "1",
            signatureExpirationLedger: 100,
            signed: true,
          },
          root: {
            kind: "contract-fn",
            contractId: "C12345678901234567890",
            functionName: "test_fn",
            args: [],
            depth: 1,
            children: [],
          },
        },
      ],
      simulation: { status: "success" },
      effects: [],
      summary: ["Sample summary"],
      raw: { xdr: "AAAA" },
    };

    it("shows AuthorizationTree when useAuthorizationTree prop is true", () => {
      const { rerender } = render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
          useAuthorizationTree={false}
        />,
      );

      // By default without prop, renders standard Credentials
      expect(screen.getByText("Credentials: address")).toBeInTheDocument();
      expect(screen.queryByRole("tree")).not.toBeInTheDocument();

      // Enable useAuthorizationTree
      rerender(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
          useAuthorizationTree={true}
        />,
      );

      expect(screen.getByRole("tree")).toBeInTheDocument();
      expect(screen.getByText("test_fn()")).toBeInTheDocument();
    });

    it("supports custom authTree prop directly", () => {
      render(
        <ClearSignModal
          preview={basePreview}
          onApprove={vi.fn()}
          onReject={vi.fn()}
          authTree={sampleTree}
        />,
      );

      expect(screen.getByRole("tree")).toBeInTheDocument();
      expect(screen.getByText("deposit()")).toBeInTheDocument();
    });

    it("convertCoreAuthToTree gracefully maps empty or malformed inputs", () => {
      expect(convertCoreAuthToTree([])).toEqual([]);
      expect(
        convertCoreAuthToTree(
          null as unknown as Parameters<typeof convertCoreAuthToTree>[0],
        ),
      ).toEqual([]);
    });
  });

  describe("Snapshots per node type", () => {
    it("matches snapshot for contract-fn root node", () => {
      const singleNode: AuthTreeNode[] = [
        {
          id: "snap-root",
          kind: "contract-fn",
          contract: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          functionName: "root_call",
          args: [{ name: "val", value: 100 }],
        },
      ];
      const { container } = render(<AuthorizationTree nodes={singleNode} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot for node with warning and blocked severity", () => {
      const warningNode: AuthTreeNode[] = [
        {
          id: "snap-warning",
          kind: "contract-fn",
          contract: "CWARN0000000000000000000000000000000000000000",
          functionName: "dangerous_op",
          warnings: [
            {
              code: "HIGH_RISK",
              message: "Dangerous invocation",
              severity: "blocked",
            },
          ],
        },
      ];
      const { container } = render(<AuthorizationTree nodes={warningNode} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot for node with decoded arguments and full-value reveal", () => {
      const argsNode: AuthTreeNode[] = [
        {
          id: "snap-args",
          kind: "contract-fn",
          contract: "CARGS0000000000000000000000000000000000000000",
          functionName: "set_data",
          args: [
            {
              name: "payload",
              value: "VeryLongPayloadStringThatExceedsTwentyFiveCharacters",
            },
          ],
        },
      ];
      const { container } = render(<AuthorizationTree nodes={argsNode} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot for leaf node without children", () => {
      const leafNode: AuthTreeNode[] = [
        {
          id: "snap-leaf",
          kind: "transfer",
          contract: "CLEAF0000000000000000000000000000000000000000",
          functionName: "end_leaf",
          children: [],
        },
      ];
      const { container } = render(<AuthorizationTree nodes={leafNode} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it("matches snapshot for deep nested node collapsed by default (> level 2)", () => {
      const deepNode: AuthTreeNode[] = [
        {
          id: "lvl-1",
          kind: "contract-fn",
          children: [
            {
              id: "lvl-2",
              kind: "contract-fn",
              children: [
                {
                  id: "lvl-3-collapsed",
                  kind: "contract-fn",
                  children: [
                    {
                      id: "lvl-4-hidden",
                      kind: "leaf",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const { container } = render(
        <AuthorizationTree nodes={deepNode} defaultExpandedDepth={2} />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
