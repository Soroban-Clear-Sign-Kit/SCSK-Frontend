# perf(view): Add virtualized list rendering for 5,000+ entry state diffs

## Complexity

**Medium**

---

## Description

The `StateDiffViewer` component currently handles large ledger modifications via pagination (e.g. 50 entries per page). In automated protocols, arbitrage contracts, and liquidity pool rebalancings, a single Soroban transaction can produce thousands of ledger entry diffs. Some users prefer continuous vertical scrolling over pagination. This issue adds an optional virtualized/windowed scrolling mode to `StateDiffViewer` capable of rendering 5,000+ entries at a continuous 60fps without DOM bloat.

---

## Requirements

1. **Windowed / Virtualized Mode**:
   - Provide an optional `virtualize?: boolean` prop on `StateDiffViewer` (and forwarded from `ClearSignModalProps.virtualizeStateDiffs`).
   - When `virtualize={true}` and the item count exceeds 100 entries, render only the visible slice of items inside a scrollable viewport container (`max-height: 400px; overflow-y: auto`).
2. **Zero Heavy Dependencies**:
   - Implement either using a lightweight virtual scroll calculation hook (`useVirtualizer` or simple `scrollTop` / `itemHeight` math) with zero external dependency bloat.
   - Maintain size-limit budget for `dist/index.js` (`< 20 KB` brotlied).
3. **Accessibility**:
   - Retain full keyboard scrollability (`Tab` navigation, arrow keys, `PageUp`/`PageDown`).
   - Ensure `aria-rowcount` and `aria-rowindex` or list semantics inform screen readers of total item count.
4. **Performance Benchmark**:
   - Add a unit test rendering 5,000 state diff entries and assert that total rendered DOM nodes inside the container do not exceed 50 elements at any one time.

---

## Files to Touch

- `src/components/StateDiffViewer.tsx`
- `src/ClearSignModal.tsx`
- `src/styles.module.css`
- `test/unit/stateDiffViewer.test.tsx`
- `docs/VERIFICATION_AND_RAW.md`

---

## Suggested Execution

1. In `src/components/StateDiffViewer.tsx`, create a simple windowing hook or utility:
   ```ts
   // Calculate startIndex and endIndex based on container scrollTop, clientHeight, and itemHeight (approx 44px)
   ```
2. When `virtualize={true}`:
   - Calculate top and bottom spacer padding or absolute translation offsets so the scrollbar remains proportional to `totalCount * itemHeight`.
   - Render only `visibleItems = items.slice(startIndex, endIndex)`.
3. In `test/unit/stateDiffViewer.test.tsx`, add a test case:
   ```tsx
   it("renders 5,000 diff entries virtualized with fewer than 50 active DOM nodes", () => {
     const massiveDiffs = Array.from({ length: 5000 }, (_, i) => ({
       key: `key-${i}`,
       account: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
       delta: "+10",
     }));
     render(<StateDiffViewer diffs={massiveDiffs} virtualize={true} />);
     const renderedRows = screen.getAllByRole("listitem");
     expect(renderedRows.length).toBeLessThan(50);
   });
   ```
4. Verify with `pnpm run check:size` and `pnpm test`.

---

## Acceptance Criteria

- [ ] `StateDiffViewer` supports `virtualize?: boolean` prop.
- [ ] Scrolling through a 5,000-entry diff maintains smooth 60fps scrolling and renders fewer than 50 active DOM elements simultaneously.
- [ ] Keyboard accessibility is maintained, and screen readers are informed of total list size.
- [ ] Size budget for `@clearsign/react (ESM)` remains under `20 KB` brotlied.

---

## Pull Request Requirements

Please include a **screen recording** demonstrating smooth vertical scrolling through a 5,000-entry state diff list in your Pull Request.
