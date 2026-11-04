# feat(theme): Add high-contrast mode theme meeting WCAG AAA (7:1)

## Complexity

**Medium**

---

## Description

`@clearsign/react` currently provides light and dark themes compliant with WCAG 2.1 AA (`4.5:1` text contrast). For users with low vision, photosensitivity, or specific visual impairments, WCAG AAA requires a minimum relative luminance contrast ratio of `7:1` for regular text and `4.5:1` for large headings, alongside non-color cues for warning severity. This issue introduces a dedicated `"high-contrast"` theme mode.

---

## Requirements

1. **`7:1` Contrast Ratio (WCAG AAA)**:
   - Provide `data-theme="high-contrast"` and support `theme="high-contrast"` on `ClearSignModal`.
   - Pure black background (`#000000`) with high-luminance white text (`#ffffff`), producing a `21:1` contrast ratio.
   - Contrast for muted text, buttons, and warnings must exceed `7:1`.
2. **High-Visibility Focus Indicators**:
   - Focus rings must use a bold, high-visibility 3px outline (`outline: 3px solid #ffff00; outline-offset: 2px`).
3. **Non-Color Severity Differentiation**:
   - Warning banners must include distinct SVG shape indicators or patterned borders (e.g. solid border for info, dashed border for review, double thick border for blocked) rather than relying exclusively on hue.
4. **Automated WCAG AAA Verification**:
   - Extend `test/unit/themeContrast.test.ts` to compute relative luminance for all high-contrast tokens and assert contrast >= `7.0`.

---

## Files to Touch

- `src/styles.module.css`
- `src/ClearSignModal.tsx`
- `test/unit/themeContrast.test.ts`
- `docs/THEMING_AND_I18N.md`
- `example/src/App.tsx` (add "High Contrast" option to theme switcher)

---

## Suggested Execution

1. In `src/styles.module.css`, add `[data-theme="high-contrast"]`:
   ```css
   [data-theme="high-contrast"] {
     --clearsign-bg: #000000;
     --clearsign-border: #ffffff;
     --clearsign-text: #ffffff;
     --clearsign-text-muted: #e2e8f0;
     --clearsign-btn-primary-bg: #ffffff;
     --clearsign-btn-primary-text: #000000;
     --clearsign-warn-blocked-bg: #000000;
     --clearsign-warn-blocked-border: #ff6b6b;
     --clearsign-warn-blocked-text: #ffffff;
     --clearsign-warn-review-bg: #000000;
     --clearsign-warn-review-border: #ffd166;
     --clearsign-warn-review-text: #ffffff;
     --clearsign-focus-ring: #ffff00;
   }
   ```
2. Update `theme` prop type in `ClearSignModalProps`:
   ```ts
   theme?: "light" | "dark" | "auto" | "high-contrast";
   ```
3. Update `test/unit/themeContrast.test.ts` to assert that every high-contrast text color against its background achieves `>= 7.0` contrast ratio.
4. In `example/src/App.tsx`, add `"high-contrast"` to the theme switcher button.
5. Run `pnpm test` and `pnpm run check:size`.

---

## Acceptance Criteria

- [ ] `theme="high-contrast"` is supported on `<ClearSignModal />` and `[data-theme="high-contrast"]`.
- [ ] Automated luminance tests prove all high-contrast text meets or exceeds WCAG AAA `7:1` contrast.
- [ ] Interactive elements feature a high-visibility 3px focus outline.
- [ ] Warning cards use distinct borders/icons ensuring information is conveyed without relying solely on color.

---

## Pull Request Requirements

Please include **screenshots** of `ClearSignModal` in high-contrast mode showing the `ready`, `review`, and `blocked` states, including visible focus rings on buttons.
