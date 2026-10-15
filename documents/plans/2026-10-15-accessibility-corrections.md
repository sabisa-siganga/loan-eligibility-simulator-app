# Accessibility corrections — system to-do

Target: WCAG 2.2 AA per [Frontend Requirements §13](../Loan_Eligibility_Simulator_Frontend_Requirements.md). Treat this as a correction backlog across shared UI, journey screens, motion, and verification — not a one-off screen polish.

Already partly in place: labelled inputs with `aria-invalid` / `aria-describedby` / `aria-required`, progress step announcements, dialog Escape + basic focus trap, `focus-visible` styles, `prefers-reduced-motion`, and some loading `role="status"` regions. Gaps below are what still needs correcting.

---

## 1. Shared UI primitives

- [ ] **Audit every form control** (`Input`, `InputGroup`, `Select`, `Checkbox`, `Slider`, `MoneyInput`, `WholeNumberInput`) for visible label, programmatic required state, helper + error association, and keyboard operability.
- [ ] **Standardise error announcement**: decide when `ErrorText` uses `role="alert"` vs `role="status"`; avoid noisy multi-alert spam on submit; prefer one form-level summary + field-level associations.
- [ ] **Button / link targets**: ensure primary actions meet ~44px touch targets (`$touch-min`); fix any undersized link-variant controls (e.g. dialog close).
- [ ] **Dialog corrections**: restore focus to the opener on close; keep focus trapped while open; ensure backdrop does not leave background interactive to assistive tech (`inert` / equivalent); cover with tests.
- [ ] **Slider + paired number inputs**: keyboard support end-to-end; do not announce every tick to screen readers; announce meaningful estimate updates politely and sparsely.
- [ ] **Unify visually hidden utilities**: one shared pattern (`visually-hidden` vs screen `srOnly`) used consistently.

## 2. Journey shell and navigation

- [ ] **Landmarks**: ensure a single `main`, labelled progress `nav`, and coherent heading order (`h1` per step, then `h2` sections).
- [ ] **Skip link** to main content (keyboard-first entry).
- [ ] **Progress stepper**: keep current/upcoming/completed announcements accurate when steps change; verify with a screen reader.
- [ ] **Step changes**: move focus sensibly on Continue / Back (e.g. to the new step `h1`), without trapping or losing context.
- [ ] **“How it works” help** (requirements): add an accessible, keyboard-operable help control in the header that opens the agreed content (reuse `Dialog`); do not leave it as decorative text.

## 3. Loan details screen

- [ ] **Product accordion**: correct `aria-expanded` / `aria-controls` behaviour; ensure collapsed panels are not in the tab order incorrectly.
- [ ] **Purpose radiogroup**: label from the purpose prompt (not only the product heading); wire purpose errors via `aria-describedby`.
- [ ] **Validation focus**: on Continue failure, focus the first invalid control (purpose / amount / term) and expose a clear error summary if needed.
- [ ] **Empty / error banners**: use the right live-region role (`alert` vs `status`) for “no products” and summary errors.

## 4. Your details (budget) screen

- [ ] **Conditional fields**: when employment/income fields appear or disappear, do not steal focus; if the focused field is removed, move focus to a sensible neighbour.
- [ ] **Submit / loading**: keep `aria-busy` + polite status text; prevent double-submit; announce failure with associated error text.
- [ ] **Missing-loan gate**: ensure the alert is discoverable and there is a clear path back.

## 5. Your result screen

- [ ] **Announce the decision** once on arrival (`aria-live` / focus on heading) without re-announcing noisy figure churn.
- [ ] **Result content structure**: headings, lists, and expandable cost sections (when present) expose expanded/collapsed state.
- [ ] **Adjust / back flows**: keyboard order and focus return after changing amount/term stay predictable.

## 6. Visual / interaction accessibility

- [ ] **Contrast audit** of tokens (text, borders, error, disabled, focus ring) against WCAG 2.2 AA; fix failing pairs at the token layer.
- [ ] **Focus visibility**: every interactive control has a visible non-colour-only focus indicator.
- [ ] **200% zoom / reflow**: Loan details, Your details, and Result remain usable without horizontal scrolling of essential content.
- [ ] **Motion**: keep reduced-motion respect; no shake/flash validation; no money count-up animation; state must be clear without motion.

## 7. Tooling and regression guards

- [ ] Add **`eslint-plugin-jsx-a11y`** (or equivalent) to the lint pipeline.
- [ ] Add **axe** (or similar) smoke checks on the three journey screens in unit and/or Playwright e2e.
- [ ] Prefer **accessible Testing Library queries** (`getByRole`, `getByLabelText`) in new/changed tests; extend component tests for the dialog/focus/association behaviours above.
- [ ] Document a short **manual checklist**: keyboard-only pass, VoiceOver or NVDA pass, 200% zoom, Windows high-contrast spot-check. Automated green ≠ compliance.

## 8. Exit criteria

- [ ] Manual + automated checks against requirements §13 completed for all three steps.
- [ ] Known exceptions (if any) listed with rationale — do not claim full compliance from automation alone.

---

### Suggested work order

1. Tooling (jsx-a11y + axe baseline) so fixes stay fixed.  
2. Shared primitives (labels, errors, dialog, slider).  
3. Shell (landmarks, skip link, How it works, step focus).  
4. Screen-by-screen pass (Loan details → Your details → Result).  
5. Contrast / zoom / motion polish.  
6. Manual SR + keyboard sign-off.
