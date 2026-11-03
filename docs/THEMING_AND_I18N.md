# Theming and Internationalization (i18n)

`@clearsign/react` is designed to be fully customizable without requiring a fork. You can adapt visual styles using CSS custom properties, toggle light/dark modes, supply custom translations for all user-facing strings, test with pseudo-localization, and render seamlessly in Right-to-Left (RTL) writing systems.

---

## 1. CSS Custom Properties (Design Tokens)

All modal components, warning lists, and invocation trees inherit styling from CSS custom properties defined on `.clearsign-theme` (or the document root).

### Color Tokens

| CSS Variable                      | Default (Light Mode) | Default (Dark Mode)   | Purpose                                  |
| --------------------------------- | -------------------- | --------------------- | ---------------------------------------- |
| `--clearsign-bg`                  | `#ffffff`            | `#121721`             | Modal card background                    |
| `--clearsign-overlay`             | `rgba(0, 0, 0, 0.5)` | `rgba(0, 0, 0, 0.75)` | Backdrop overlay                         |
| `--clearsign-text`                | `#111827`            | `#f1f5f9`             | Primary text                             |
| `--clearsign-text-muted`          | `#4b5563`            | `#94a3b8`             | Subtitle, metadata, and secondary text   |
| `--clearsign-border`              | `#e5e7eb`            | `#283347`             | Borders and dividers                     |
| `--clearsign-surface`             | `#f9fafb`            | `#1a2233`             | Card sections, pills, and argument boxes |
| `--clearsign-surface-hover`       | `#f3f4f6`            | `#243048`             | Interactive row hover state              |
| `--clearsign-primary`             | `#2563eb`            | `#3b82f6`             | Approve button and primary actions       |
| `--clearsign-primary-hover`       | `#1d4ed8`            | `#2563eb`             | Primary button hover                     |
| `--clearsign-primary-text`        | `#ffffff`            | `#ffffff`             | Text on primary buttons                  |
| `--clearsign-btn-secondary-bg`    | `#f3f4f6`            | `#243048`             | Reject / secondary button background     |
| `--clearsign-btn-secondary-hover` | `#e5e7eb`            | `#2f3e5c`             | Reject / secondary button hover          |
| `--clearsign-btn-secondary-text`  | `#1f2937`            | `#e2e8f0`             | Secondary button text                    |
| `--clearsign-code-bg`             | `#f1f5f9`            | `#0f172a`             | Raw XDR and code blocks background       |
| `--clearsign-code-text`           | `#0f172a`            | `#cbd5e1`             | Raw code text                            |

### Warning & Risk Severity Tokens

All severity colors and text combinations comply with **WCAG 2.1 AA** contrast standards (≥ 4.5:1 ratio for standard text against background in both light and dark themes).

| CSS Variable                      | Default (Light) | Default (Dark) | Purpose                          |
| --------------------------------- | --------------- | -------------- | -------------------------------- |
| `--clearsign-risk-ok-bg`          | `#f0fdf4`       | `#052e16`      | Safe / OK risk banner background |
| `--clearsign-risk-ok-border`      | `#bbf7d0`       | `#166534`      | Safe / OK risk banner border     |
| `--clearsign-risk-ok-text`        | `#166534`       | `#86efac`      | Safe / OK risk banner text       |
| `--clearsign-risk-review-bg`      | `#fefce8`       | `#3b2904`      | Review risk banner background    |
| `--clearsign-risk-review-border`  | `#fef08a`       | `#854d0e`      | Review risk banner border        |
| `--clearsign-risk-review-text`    | `#854400`       | `#fde047`      | Review risk banner text          |
| `--clearsign-risk-blocked-bg`     | `#fef2f2`       | `#3b0b0b`      | Blocked risk banner background   |
| `--clearsign-risk-blocked-border` | `#fecaca`       | `#991b1b`      | Blocked risk banner border       |
| `--clearsign-risk-blocked-text`   | `#991b1b`       | `#fca5a5`      | Blocked risk banner text         |
| `--clearsign-risk-info-bg`        | `#eff6ff`       | `#082547`      | Info risk banner background      |
| `--clearsign-risk-info-border`    | `#bfdbfe`       | `#1e40af`      | Info risk banner border          |
| `--clearsign-risk-info-text`      | `#1e40af`       | `#93c5fd`      | Info risk banner text            |

### Spacing, Radius & Typography Tokens

| CSS Variable                   | Default              | Purpose                                |
| ------------------------------ | -------------------- | -------------------------------------- |
| `--clearsign-space-xs`         | `0.25rem` (4px)      | Tight padding (pills, badges)          |
| `--clearsign-space-sm`         | `0.5rem` (8px)       | Small padding & gaps                   |
| `--clearsign-space-md`         | `1rem` (16px)        | Standard content padding & margins     |
| `--clearsign-space-lg`         | `1.5rem` (24px)      | Modal content padding                  |
| `--clearsign-space-xl`         | `2rem` (32px)        | Large section spacing                  |
| `--clearsign-radius-sm`        | `4px`                | Badges, small tags, disclosure buttons |
| `--clearsign-radius-md`        | `8px`                | Standard buttons and input cards       |
| `--clearsign-radius-lg`        | `12px`               | Outer dialog container                 |
| `--clearsign-font-family`      | system font stack    | Dialog typography                      |
| `--clearsign-font-family-mono` | monospace font stack | Hash, address, and XDR typography      |

---

## 2. Light & Dark Theme Modes

ClearSign automatically respects the user's system preferences via `@media (prefers-color-scheme: dark)`.

You can also force a specific theme using either the `theme` prop on `ClearSignModal` or by placing a `data-theme` attribute on any parent container:

### Via the `theme` Prop:

```tsx
<ClearSignModal
  preview={preview}
  onApprove={handleApprove}
  onReject={handleReject}
  theme="dark" // "light" | "dark" | "auto"
/>
```

### Via the `data-theme` Attribute:

```html
<!-- Force dark mode regardless of OS setting -->
<div data-theme="dark">
  <ClearSignModal ... />
</div>

<!-- Force light mode -->
<div data-theme="light">
  <ClearSignModal ... />
</div>
```

---

## 3. Custom Theme Example

You can override CSS custom properties in your application's stylesheet to seamlessly match your dApp's branding:

```css
/* brand-theme.css */
[data-theme="custom-brand"],
.my-dapp-theme {
  --clearsign-bg: #0d1117;
  --clearsign-surface: #161b22;
  --clearsign-surface-hover: #21262d;
  --clearsign-border: #30363d;
  --clearsign-text: #f0f6fc;
  --clearsign-text-muted: #8b949e;
  --clearsign-radius-lg: 16px;
  --clearsign-radius-md: 10px;

  /* Neon Cyan Brand Primary */
  --clearsign-primary: #00d4aa;
  --clearsign-primary-hover: #00b894;
  --clearsign-primary-text: #051412;

  /* Custom Font */
  --clearsign-font-family: "Inter", -apple-system, sans-serif;
  --clearsign-font-family-mono: "Fira Code", monospace;
}
```

Usage in React:

```tsx
<div className="my-dapp-theme">
  <ClearSignModal
    preview={preview}
    onApprove={handleApprove}
    onReject={handleReject}
  />
</div>
```

---

## 4. Internationalization (i18n) & Localization

All user-facing strings are decoupled from component logic and defined in a messages dictionary with standard English defaults.

You can customize or translate strings globally via `ClearSignProvider` or per-instance via the `messages` prop.

### Complete Second-Language Example (Spanish)

```tsx
import React, { useState } from "react";
import {
  ClearSignProvider,
  ClearSignModal,
  ClearSignMessages,
  useClearSign,
} from "@clearsign/react";

const SPANISH_MESSAGES: Partial<ClearSignMessages> = {
  // Modal Header & Status
  title: "Aprobar Transacción",
  statusDecoding: "Decodificando transacción...",
  statusReady: "Transacción lista para revisión.",
  statusReview: "Transacción requiere revisión cuidadosa de advertencias.",
  statusBlocked:
    "Transacción bloqueada debido a riesgos críticos de seguridad.",
  statusError: "Error al procesar la transacción.",

  // Risk Badges
  riskOk: "SEGURO",
  riskReview: "REVISIÓN REQUERIDA",
  riskBlocked: "BLOQUEADO",

  // Action Buttons
  approveButton: "Firmar Transacción",
  rejectButton: "Rechazar",
  signingButton: "Firmando con billetera...",

  // Warnings & Acknowledgement
  warningsTitle: "Advertencias de Seguridad",
  reviewWarningNotice: "Por favor revise las advertencias antes de proceder:",
  acknowledgementCheckboxLabel:
    "He revisado las advertencias de seguridad y entiendo los riesgos asociados.",
  docsLinkText: "Ver Documentación",
  severityBlocked: "Bloqueado",
  severityReview: "Revisión",
  severityInfo: "Información",

  // Sections
  networkLabel: "Red",
  sourceAccountLabel: "Cuenta de Origen",
  feeLabel: "Comisión Máxima",
  operationsTitle: "Operaciones",
  effectsTitle: "Efectos Simulados",
  authTreeTitle: "Árbol de Autorizaciones",
  rawDetailsTitle: "Detalles Técnicos (XDR)",
  copiedText: "¡Copiado!",
  copyXdrButton: "Copiar XDR",

  // Tree & Values
  expand: "Expandir",
  collapse: "Contraer",
  showMore: "Ver más",
  showLess: "Ver menos",
  unnamedArgument: "argumento",
  anonymousContract: "Contrato Anónimo",
};

export function App() {
  const { preview, open, onApprove, onReject } = useClearSign({
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  });

  return (
    <ClearSignProvider messages={SPANISH_MESSAGES}>
      {open && (
        <ClearSignModal
          preview={preview}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </ClearSignProvider>
  );
}
```

---

## 5. Pseudo-Localization Testing

Pseudo-localization allows you to verify that no hard-coded English strings exist and ensure your UI accommodates expanded text lengths and accented characters.

`@clearsign/react` provides helper functions:

```tsx
import {
  createPseudoLocalizedMessages,
  ClearSignProvider,
} from "@clearsign/react";

// Automatically transforms every message:
// e.g. "Approve Transaction" -> "[!! Àþþřövê Ťřáñšáçťïöñ !!]"
const pseudoMessages = createPseudoLocalizedMessages();

export function PseudoLocalizationPreview() {
  return (
    <ClearSignProvider messages={pseudoMessages}>
      <ClearSignModal preview={preview} ... />
    </ClearSignProvider>
  );
}
```

---

## 6. Right-to-Left (RTL) Layouts

The CSS styles use CSS logical properties (`margin-inline-start`, `padding-inline-end`, `border-inline-start`, etc.) so that directional alignments automatically flip when placed in an RTL context.

```html
<div dir="rtl" lang="ar">
  <ClearSignProvider messages="{ARABIC_MESSAGES}">
    <ClearSignModal ... />
  </ClearSignProvider>
</div>
```

Tree indentation, badges, warning borders, and button arrangements will automatically align right-to-left.
