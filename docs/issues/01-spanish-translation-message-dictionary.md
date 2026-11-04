# feat(i18n): Add built-in Spanish (es) message dictionary and locale switcher

## Complexity

**Trivial**

---

## Description

`@clearsign/react` supports string customization via the `messages` prop and `ClearSignProvider`, with English (`DEFAULT_MESSAGES`) provided as the default. To broaden adoption in Spanish-speaking Stellar and Soroban communities, this issue adds an official, built-in Spanish message dictionary (`SPANISH_MESSAGES`) exported from `@clearsign/react/locales/es`.

---

## Requirements

1. **Spanish Translations**: Translate all 38 user-facing keys in `ClearSignMessages` into natural, professional neutral Spanish (e.g., "Aprobar", "Rechazar", "Inspección de Transacción", "Riesgo detectado", etc.).
2. **Type Safety & Parity**: The Spanish dictionary must satisfy `ClearSignMessages` without missing keys or defaulting to `undefined`.
3. **Subpath Export**: Export the dictionary from a dedicated entry point `@clearsign/react/locales/es` so it is tree-shakeable and does not inflate the bundle size of consumers who only need English.
4. **Interactive Demo Integration**: Add a language toggle (English / Spanish) in `example/src/App.tsx` demonstrating live language switching.
5. **Automated Unit Tests**: Add a unit test asserting that every key in `DEFAULT_MESSAGES` exists and is non-empty in `SPANISH_MESSAGES`.

---

## Files to Touch

- `src/i18n/locales/es.ts` (New file)
- `src/i18n/index.ts`
- `package.json` (add `./locales/es` to `exports` map)
- `tsup.config.ts` (add entry for `locales/es`)
- `.size-limit.json` (add size limit budget `< 2 KB` for Spanish locale chunk)
- `test/unit/localization.test.tsx`
- `example/src/App.tsx`
- `docs/THEMING_AND_I18N.md`

---

## Suggested Execution

1. Create `src/i18n/locales/es.ts`:
   ```ts
   import type { ClearSignMessages } from "../messages.js";

   export const SPANISH_MESSAGES: ClearSignMessages = {
     modalTitle: "Inspección de Transacción",
     actionApprove: "Aprobar",
     actionReject: "Rechazar",
     actionSign: "Firmar Transacción",
     // ...translate all remaining keys from src/i18n/messages.ts
   };

   export default SPANISH_MESSAGES;
   ```
2. Export `SPANISH_MESSAGES` from `src/i18n/index.ts` and add `locales/es: "src/i18n/locales/es.ts"` to `tsup.config.ts`.
3. Add export map in `package.json`:
   ```json
   "./locales/es": {
     "import": {
       "types": "./dist/locales/es.d.ts",
       "default": "./dist/locales/es.js"
     },
     "require": {
       "types": "./dist/locales/es.d.cts",
       "default": "./dist/locales/es.cjs"
     }
   }
   ```
4. In `test/unit/localization.test.tsx`, write a test looping through `Object.keys(DEFAULT_MESSAGES)` to ensure parity with `SPANISH_MESSAGES`.
5. Add a simple `<select>` or button in `example/src/App.tsx` passing `messages={locale === "es" ? SPANISH_MESSAGES : undefined}` to `<ClearSignModal />`.
6. Run `pnpm run check:package`, `pnpm run check:size`, and `pnpm test` to verify.

---

## Acceptance Criteria

- [ ] `SPANISH_MESSAGES` implements `ClearSignMessages` with 100% of keys translated into natural Spanish.
- [ ] Export `@clearsign/react/locales/es` resolves cleanly under both ESM and CommonJS in `publint` and `attw`.
- [ ] Automated test passes verifying `SPANISH_MESSAGES` contains no missing or untranslated keys compared to `DEFAULT_MESSAGES`.
- [ ] `example/src/App.tsx` includes an interactive language switcher showing the modal in Spanish.

---

## Pull Request Requirements

Please include **screenshots** of the modal rendered in Spanish in both light and dark modes in your Pull Request description.
