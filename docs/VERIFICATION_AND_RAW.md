# Transaction Verification, Raw Views, and Value Inspection

A core principle of the Soroban Clear-Sign Kit (SCSK) is **informed consent**: users must always be able to independently verify what they are signing before authorizing a transaction.

No cryptographic value, address, hash, or state change should ever be locked into an irreversible, truncated representation.

---

## 1. The 'Raw' Tab

`ClearSignModal` provides a tabbed interface with two primary views:

1. **Details Tab**: Human-readable transaction overview (contract calls, simulated balance changes, decoded arguments, authorization trees, fees, and safety warnings).
2. **Raw Tab**: Low-level technical verification containing:
   - **Transaction Envelope (XDR Base64)**: The exact unsigned envelope XDR payload submitted to the wallet for signing. Includes a one-click **Copy XDR** button.
   - **Decoded Transaction (JSON)**: The complete parsed and structured JSON data representation of the transaction, contracts, simulated effects, and security warnings. Includes a one-click **Copy JSON** button.

### Keyboard Navigation for Tabs

The tab system strictly follows the WAI-ARIA tab pattern:

- Switch tabs with the mouse or by pressing the <kbd>&larr;</kbd> and <kbd>&rarr;</kbd> arrow keys when focused on the tablist.
- Both tabs expose explicit `aria-selected`, `aria-controls`, and `aria-labelledby` semantics.

---

## 2. Address & Hash Inspection: Grouped Monospace Chunks

Stellar public keys (`G...`), Soroban contract IDs (`C...`), and transaction / bytecode hashes are long strings (e.g. 56 or 64 characters) where human eyes struggle to identify subtle typos, spoofing attempts, or address substitution attacks.

### Default Middle-Truncation

By default, long addresses and hashes are formatted with a middle-truncation preview (e.g., `GBRP...OX2H`) to preserve screen real estate and keep tables readable.

### On-Demand Full Reveal in 4-Character Chunks

Every address and hash rendered with `AddressHashView`:

- Features an accessible **Reveal full address** toggle button (`<button aria-expanded="false">↔</button>`).
- When toggled, reveals the full string formatted in **grouped 4-character monospace chunks**:
  ```text
  GBRP YHIL 2CI3 FNQ4 BXLF MNDL FJUN PU2H Y3ZM FSHO NUCE OASW 7QC7 OX2H
  ```
- Breaking values into 4-character groups makes visual comparison against known addresses (or block explorers) significantly faster and less error-prone.
- The button toggles to **Hide full address** (`<button aria-expanded="true">↩</button>`), allowing collapsing back to the compact format.

### Direct Clipboard Copy

Every address and hash has a dedicated **Copy** button. Clicking the copy button copies the **untruncated, contiguous string** without artificial spacing directly to the clipboard.

---

## 3. Handling Large State Diffs (1,000+ Entries)

DeFi liquidations, batch distributions, and complex contract invocations can generate dozens, hundreds, or even thousands of simulated balance changes or contract storage modifications.

Rendering 1,000+ DOM nodes simultaneously causes severe browser lag, unresponsive UI, and mobile memory crashes.

### `StateDiffViewer` Component

`@clearsign/react` includes `StateDiffViewer` to paginate and virtualize large lists of state changes and balance deltas:

- **Pagination Controls**: Automatically engages when the total entry count exceeds the page size (e.g., 10, 25, 50, 100 entries per page).
- **Accessible Status Region**: An `aria-live="polite"` region reports page status:
  ```text
  Page 1 of 40 (1000 entries)
  ```
- **Page Size Selector**: Users can switch between 10, 25, 50, or 100 entries per page.
- **Full Value Inspection**: Every entry on every page uses `AddressHashView`, ensuring no account or storage key is available only in truncated form.

### Example Usage:

```tsx
import { StateDiffViewer, StateDiffItem } from "@clearsign/react";

const diffs: StateDiffItem[] = [
  {
    key: "0102030405060708090a0b0c0d0e0f10",
    type: "modify",
    before: { balance: 100 },
    after: { balance: 250 },
  },
  {
    account: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
    delta: "+50.00",
    symbol: "USDC",
  },
];

<StateDiffViewer
  entries={diffs}
  pageSize={25}
  pageSizeOptions={[10, 25, 50, 100]}
/>;
```

---

## 4. Verification Guarantee

> [!IMPORTANT]
> **Zero Truncation Lock-In**:
> In `@clearsign/react`, **no value is available only in truncated form**. Any contract ID, public key, argument value, storage key, or XDR payload can be expanded into its full form, copied to clipboard, and inspected via the Raw tab.
