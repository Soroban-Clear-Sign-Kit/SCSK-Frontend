# feat(tree): Add Stellar Expert / contract explorer deep links to AuthorizationTree

## Complexity

**Trivial**

---

## Description

In the `AuthorizationTree` component, contract IDs are displayed in middle-truncated monospace format (`CA3D...HA5C`) with an on-demand reveal button. Users verifying contracts often want to inspect the contract's verified source code, bytecode hash, or historical transactions on a block explorer. This issue adds an optional explorer link provider to contract ID nodes in the invocation hierarchy.

---

## Requirements

1. **Configurable Explorer URL Provider**:
   - Add prop `getExplorerUrl?: (contractIdOrAddress: string, networkPassphrase?: string) => string | null` to `AuthorizationTreeProps` and forward from `ClearSignModalProps`.
2. **Default Fallback**:
   - If not specified, default to Stellar Expert:
     - Public Network: `https://stellar.expert/explorer/public/contract/${id}`
     - Testnet: `https://stellar.expert/explorer/testnet/contract/${id}`
3. **Security & Accessibility**:
   - Renders an external link icon (`↗`) adjacent to the contract ID.
   - Must include `target="_blank"` and `rel="noopener noreferrer"`.
   - Must include accessible text `aria-label="View contract on Stellar Expert (opens in new tab)"`.
4. **Unit Tests**:
   - Add unit tests verifying explorer anchor tags are rendered with correct `href`, security attributes, and accessible labels.

---

## Files to Touch

- `src/components/AuthorizationTree.tsx`
- `src/ClearSignModal.tsx`
- `src/styles.module.css`
- `test/unit/authorizationTree.test.tsx`
- `README.md` (props reference)

---

## Suggested Execution

1. In `src/components/AuthorizationTree.tsx`:
   ```tsx
   function defaultExplorerUrl(id: string, networkPassphrase?: string): string {
     const isTestnet = networkPassphrase?.includes("Test");
     const net = isTestnet ? "testnet" : "public";
     return `https://stellar.expert/explorer/${net}/contract/${id}`;
   }
   ```
2. In contract node rendering, if `node.contract` is present:
   ```tsx
   const explorerHref = getExplorerUrl
     ? getExplorerUrl(node.contract, networkPassphrase)
     : defaultExplorerUrl(node.contract, networkPassphrase);

   {
     explorerHref && (
       <a
         href={explorerHref}
         target="_blank"
         rel="noopener noreferrer"
         className={styles.explorerLink}
         aria-label={`View contract ${node.contract} on explorer (opens in new tab)`}
       >
         <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24">
           ...
         </svg>
       </a>
     );
   }
   ```
3. Add minimal styling in `src/styles.module.css`:
   ```css
   .explorerLink {
     display: inline-flex;
     align-items: center;
     margin-inline-start: 4px;
     color: var(--clearsign-text-muted);
     text-decoration: none;
   }
   .explorerLink:hover,
   .explorerLink:focus-visible {
     color: var(--clearsign-btn-primary-bg);
   }
   ```
4. Add unit test in `test/unit/authorizationTree.test.tsx` testing explorer link generation.
5. Run `pnpm test` and `pnpm run lint`.

---

## Acceptance Criteria

- [ ] Contract IDs in `AuthorizationTree` display an external explorer icon linking to Stellar Expert.
- [ ] Link uses `target="_blank"` and `rel="noopener noreferrer"` with an accessible `aria-label`.
- [ ] Testnet vs Public network passphrases dynamically map to corresponding explorer paths.
- [ ] Custom `getExplorerUrl` prop allows consumers to override the explorer service.

---

## Pull Request Requirements

Please include **screenshots** showing contract nodes with the new explorer link icon in both light and dark themes in your Pull Request description.
