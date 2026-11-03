# Testing & Visual Regression Architecture

The Soroban Clear-Sign Kit frontend includes comprehensive unit, accessibility, and visual regression test suites ensuring complete modal state coverage and catching UI regressions before deployment.

---

## 1. Modal State Coverage

The `ClearSignModal` component supports six canonical modal states with tailored risk banners, ARIA announcements, and action controls:

| State         | Indicator / Banner                | Sign / Approve Action           | Accessibility Announcement         | Close / Reject                |
| :------------ | :-------------------------------- | :------------------------------ | :--------------------------------- | :---------------------------- |
| **`loading`** | Decoding spinner & message        | Hidden                          | `aria-busy="true"` + polite status | Reject button enabled         |
| **`ready`**   | `riskOk` ("Decoded and verified") | Enabled immediately             | Polite status announcement         | Reject button enabled         |
| **`review`**  | `riskReview` ("Review carefully") | Disabled until checkbox checked | Polite review warning announcement | Reject button enabled         |
| **`blocked`** | `riskBlocked` ("Signing blocked") | Hidden (cannot sign)            | Polite blocked risk announcement   | Reject button enabled         |
| **`error`**   | `riskBlocked` with error detail   | Hidden                          | `role="alert"` region              | Reject / Close button enabled |
| **`success`** | `riskOk` ("Transaction Signed")   | Hidden (action completed)       | Polite success announcement        | Close button enabled          |

Unit tests in [`test/unit/modalStates.test.tsx`](file:///test/unit/modalStates.test.tsx) verify all six states, ensuring:

- State gating and disabled/enabled states behave according to security invariants.
- Screen readers receive appropriate ARIA polite and assertive live updates.
- Focus traps and keyboard navigation function cleanly in every state.

---

## 2. Visual Regression Testing (Playwright)

Visual regression tests run against the example application using Playwright and Chromium. 12 baseline snapshots are maintained in `test/e2e/__snapshots__/`:

- `loading-light.png` / `loading-dark.png`
- `ready-light.png` / `ready-dark.png`
- `review-light.png` / `review-dark.png`
- `blocked-light.png` / `blocked-dark.png`
- `error-light.png` / `error-dark.png`
- `success-light.png` / `success-dark.png`

### Example App Controller

The example application (`example/src/App.tsx`) supports URL query parameters and interactive toolbar buttons to deterministically trigger any state and theme:

- `?state=loading|ready|review|blocked|error|success`
- `?theme=light|dark`

---

## 3. Coverage Thresholds

Code coverage is enforced via Vitest with v8 coverage provider at current production levels:

```ts
coverage: {
  include: ["src/**/*.ts", "src/**/*.tsx"],
  exclude: ["src/index.ts", "src/**/*.d.ts"],
  thresholds: {
    statements: 90,
    branches: 85,
    functions: 95,
    lines: 90,
  },
}
```

Any PR or commit that causes coverage to drop below these thresholds will fail CI.

---

## 4. CI Workflow & Failure Artifacts

In `.github/workflows/ci.yml`:

1. Matrix tests across Node 22 and 24.
2. Linting (`pnpm run lint`) and Prettier code formatting (`pnpm run format:check`).
3. Strict TypeScript typechecking (`pnpm run typecheck`).
4. Unit testing and coverage thresholds (`pnpm run test:coverage`).
5. Playwright visual regression checks (`pnpm run test:e2e`).
6. On any visual test failure, image diffs are automatically uploaded as artifacts via `actions/upload-artifact@v4`:
   ```yaml
   - name: Upload Visual Diffs
     if: failure()
     uses: actions/upload-artifact@v4
     with:
       name: playwright-visual-diffs-node-${{ matrix.node-version }}
       path: test-results/
       if-no-files-found: ignore
   ```

---

## 5. Running Tests Locally

```bash
# Run all unit tests
pnpm test

# Run unit tests with coverage report and threshold verification
pnpm run test:coverage

# Run Playwright visual regression tests
pnpm run test:e2e

# Update Playwright baseline snapshots
npx playwright test --update-snapshots
```
