# Accessibility Specification (A11y)

The `@clearsign/react` library is built to meet **WCAG 2.1 Level AA** standards. All modal dialog states, risk levels, and interactive elements are designed for screen readers and keyboard-only navigation.

---

## 1. Focus Management & Focus Trap

- **Initial Focus**: When `ClearSignModal` mounts with a valid `preview`, it captures the initiating trigger element (`document.activeElement`) and programmatically shifts focus to the modal dialog container (`tabIndex={-1}`).
- **Focus Trap**:
  - Keyboard focus is constrained within the modal while open.
  - Pressing `Tab` from the last focusable element wraps focus back to the first focusable element.
  - Pressing `Shift + Tab` from the first focusable element wraps focus to the last focusable element.
- **Focus Restoration**: When the modal closes (approved, rejected, or unmounted), focus is automatically restored to the element that triggered the modal.

---

## 2. Keyboard Navigation

- **Escape Key Handling**:
  - Pressing `Escape` closes and rejects the transaction preview dialog (`onReject()`).
  - **Pending Signatures**: If a transaction signature is actively pending (`isSigning: true` or `isPending: true`), the `Escape` key is intercepted (`e.preventDefault()`) and ignored to prevent accidental cancellation during cryptographic signing.
- **Standard Controls**:
  - Buttons ("Reject", "Approve", "Show/Hide Raw XDR", "Copy") activate via `Enter` and `Space`.
  - The risk acknowledgment checkbox ("I have reviewed the warnings") toggles via `Space`.

### WAI-ARIA Tree Keyboard Pattern (`AuthorizationTree`)

The nested invocation tree strictly follows the [W3C WAI-ARIA Treeview Design Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):

- **`Down Arrow`**: Moves focus to the next visible tree node.
- **`Up Arrow`**: Moves focus to the previous visible tree node.
- **`Right Arrow`**:
  - If focus is on a collapsed node with children, expands the node.
  - If focus is on an expanded node, moves focus to its first child node.
- **`Left Arrow`**:
  - If focus is on an expanded node with children, collapses the node.
  - If focus is on a collapsed node or leaf node, moves focus to its parent node.
- **`Home`**: Moves focus to the first visible node in the tree.
- **`End`**: Moves focus to the last visible node in the tree.
- **`Enter` / `Space`**: Toggles expansion on nodes with children and triggers selection.

---

## 3. ARIA Roles, Landmarks & Live Announcements

- **Dialog Landmark**:
  - Container has `role="dialog"` and `aria-modal="true"`.
  - Labeled by `aria-labelledby="clearsign-modal-title"`, pointing to the modal heading `<h2>`.
  - Described by `aria-describedby="clearsign-modal-description"`, pointing to the risk banner text and summary.
- **Live Status Announcements (`aria-live`)**:
  A polite live region (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`) announces modal status changes for assistive technologies:
  - **`decoding`**: `"Decoding transaction preview..."`
  - **`ready`** (`risk: "ok"`): `"Transaction preview ready. Decoded and verified."`
  - **`review`** (`risk: "review"`): `"Transaction requires review: warnings detected."`
  - **`blocked`** (`risk: "blocked"`): `"Transaction signing blocked: high risk detected."`
  - **`pending`** (`isSigning` / `isPending`): `"Transaction signature pending..."`
  - **`error`**: `"Error: <message>"`

---

## 4. Visual Contrast & Color Independence

Information is never conveyed through color alone:

- **Risk Level Banners**:
  - **`ok`**: Green background (`#e6f4ea`, text `#137333`) + Checkmark Circle SVG icon (`aria-hidden="true"`) + explicit text `"Decoded and verified"`.
  - **`review`**: Amber background (`#fef7e0`, text `#b06000`) + Alert Triangle SVG icon (`aria-hidden="true"`) + explicit text `"Review carefully"`.
  - **`blocked`**: Red background (`#fce8e6`, text `#c5221f`) + Shield Alert SVG icon (`aria-hidden="true"`) + explicit text `"Signing blocked"`.
- **Balance Changes**:
  - Credit deltas prepend an explicit `+` character (`+100 USDC`) alongside green text (`#188038`).
  - Debit deltas prepend an explicit `-` character (`-50 XLM`) alongside red text (`#d93025`).
- **Warning Items**:
  - Each warning item displays an alert icon, warning code in bold, and explicit message text.

---

## 5. Reduced Motion Support

A dedicated `@media (prefers-reduced-motion: reduce)` media query disables transitions, transforms, and animations across `.modalOverlay`, `.modalContent`, `.button`, and all child containers to prevent disorientation for users sensitive to motion.

---

## 6. Automated Testing & Verification

Automated accessibility testing is enforced via `vitest-axe` and `@testing-library/react` in [test/unit/accessibility.test.tsx](file:///c:/Users/ADMIN/OneDrive/Documents/Drips/SCSK-Frontend/test/unit/accessibility.test.tsx):

- **Zero axe violations** across:
  - Baseline `ok` risk state.
  - Warning/acknowledgment `review` risk state.
  - Prohibitive `blocked` risk state.
  - Active signature `isSigning: true` state.
  - Complex transaction payloads (nested authorization trees, ScVal DisplayValues, and multiple balance effects).
- **Keyboard navigation tests**:
  - Focus shifts to dialog on open.
  - Focus restoration to trigger button on unmount.
  - Trapped Tab and Shift+Tab cycling.
  - Escape key rejection and suppression during pending signing.
